import { Context } from 'hono';
import { UAParser } from 'ua-parser-js';
import { Bindings } from '../../bindings';
import {
  sendCommentNotification,
  sendCommentReplyNotification,
  isValidEmail,
  getAdminNotifyEmail,
  loadEmailNotificationSettings,
  EmailNotificationSettings
} from '../../utils/email';

// 检查内容，将<script>标签之间的内容删除
export function checkContent(content: string): string {
    return content.replace(/<script[\s\S]*?<\/script>/g, "");
}

export const postComment = async (c: Context<{ Bindings: Bindings }>) => {
  const data = await c.req.json();
  if (!data || typeof data !== 'object') {
    return c.json({ message: '无效的请求体' }, 400);
  }
  const { post_slug, content: rawContent, author: rawAuthor, email, url, post_title, post_url } = data;
  const parentId = (data as any).parent_id ?? (data as any).parentId ?? null;
  if (!post_slug || typeof post_slug !== 'string') {
    return c.json({ message: 'post_slug 必填' }, 400);
  }
  if (!rawContent || typeof rawContent !== 'string') {
    return c.json({ message: '评论内容不能为空' }, 400);
  }
  if (!rawAuthor || typeof rawAuthor !== 'string') {
    return c.json({ message: '昵称不能为空' }, 400);
  }
  if (!email || typeof email !== 'string') {
    return c.json({ message: '邮箱不能为空' }, 400);
  }
  if (!isValidEmail(email)) {
    return c.json({ message: '邮箱格式不正确' }, 400);
  }
  const userAgent = c.req.header('user-agent') || "";
  
  // 1. 获取 IP (Worker 获取 IP 的标准方式)
  const ip = c.req.header('cf-connecting-ip') || "127.0.0.1";

  // 2. 检查评论频率控制 (对应 canPostComment)
  // 这里建议使用 D1 查最近一条评论的时间，或者直接放行（如果使用了 Cloudflare WAF）
  const lastComment = await c.env.CWD_DB.prepare(
    'SELECT pub_date FROM Comment WHERE ip_address = ? ORDER BY pub_date DESC LIMIT 1'
  ).bind(ip).first<{ pub_date: string }>();

  if (lastComment) {
    const lastTime = new Date(lastComment.pub_date).getTime();
    if (Date.now() - lastTime < 10 * 1000) {
      return c.json({ message: "评论频繁，等10s后再试" }, 429);
    }
  }

  // 初始化邮件日志表（若不存在）
  await c.env.CWD_DB.prepare(`
    CREATE TABLE IF NOT EXISTS EmailLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      type TEXT NOT NULL,
      ip_address TEXT,
      created_at TEXT NOT NULL
    )
  `).run();

  // 3. 准备数据
  const content = checkContent(rawContent);
  const author = checkContent(rawAuthor);

  console.log('PostComment:request', {
    postSlug: post_slug,
    hasParent: parentId !== null && parentId !== undefined,
    author,
    email,
    ip
  });
  const uaParser = new UAParser(userAgent);
  const uaResult = uaParser.getResult();

  // 4. 写入 D1 数据库
  try {
    const { success } = await c.env.CWD_DB.prepare(`
      INSERT INTO Comment (
        pub_date, post_slug, author, email, url, ip_address, 
        os, browser, device, user_agent, content_text, content_html, 
        parent_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      new Date().toISOString(),
      post_slug,
      author,
      email,
      url || null,
      ip,
      `${uaResult.os.name || ""} ${uaResult.os.version || ""}`.trim(),
      `${uaResult.browser.name || ""} ${uaResult.browser.version || ""}`.trim(),
      uaResult.device.model || uaResult.device.type || "Desktop",
      userAgent,
      content,
      content,
      parentId || null,
      "approved" // 或者从环境变量读取默认状态
    ).run();

    if (!success) throw new Error("Database insert failed");

    console.log('PostComment:inserted', {
      postSlug: post_slug,
      hasParent: parentId !== null && parentId !== undefined,
      ip
    });

    let notifySettings: EmailNotificationSettings = {
      globalEnabled: true,
      adminEnabled: true,
      userEnabled: true
    };
    try {
      notifySettings = await loadEmailNotificationSettings(c.env);
    } catch (e) {
      console.error('PostComment:mailDispatch:loadEmailSettingsFailed', e);
    }

    if (!notifySettings.globalEnabled) {
      console.log('PostComment:mailDispatch:disabledByGlobalConfig');
    } else {
      console.log('PostComment:mailDispatch:start', {
        hasParent: parentId !== null && parentId !== undefined
      });
      c.executionCtx.waitUntil((async () => {
        try {
          if (parentId !== null && parentId !== undefined) {
            let adminEmail: string | null = null;
            try {
              adminEmail = await getAdminNotifyEmail(c.env);
            } catch (e) {
              console.error('PostComment:mailDispatch:userReply:getAdminEmailFailed', e);
            }
            const isAdminReply = !!adminEmail && email === adminEmail;

            const parentComment = await c.env.CWD_DB.prepare(
              "SELECT author, email, content_text FROM Comment WHERE id = ?"
            ).bind(parentId).first<{ author: string, email: string, content_text: string }>();

            if (parentComment && parentComment.email && parentComment.email !== email) {
              let canSendUserMail = true;
              if (!isAdminReply) {
                const recentUserMail = await c.env.CWD_DB.prepare(
                  "SELECT created_at FROM EmailLog WHERE recipient = ? AND type = 'user-reply' ORDER BY created_at DESC LIMIT 1"
                ).bind(parentComment.email).first<{ created_at: string }>();
                canSendUserMail =
                  !recentUserMail ||
                  (Date.now() - new Date(recentUserMail.created_at).getTime() > 30 * 1000);
              }
              
              if (canSendUserMail && isValidEmail(parentComment.email)) {
                if (!notifySettings.userEnabled) {
                  console.log('PostComment:mailDispatch:userReply:disabledByConfig');
                } else {
                  console.log('PostComment:mailDispatch:userReply:send', {
                    toEmail: parentComment.email,
                    toName: parentComment.author
                  });
                  await sendCommentReplyNotification(c.env, {
                    toEmail: parentComment.email,
                    toName: parentComment.author,
                    postTitle: data.post_title,
                    parentComment: parentComment.content_text,
                    replyAuthor: author,
                    replyContent: content,
                    postUrl: data.post_url,
                  });
                  await c.env.CWD_DB.prepare(
                    "INSERT INTO EmailLog (recipient, type, ip_address, created_at) VALUES (?, ?, ?, ?)"
                  ).bind(parentComment.email, 'user-reply', ip, new Date().toISOString()).run();
                  console.log('PostComment:mailDispatch:userReply:logInserted', {
                    toEmail: parentComment.email
                  });
                }
              }
            }
          } else {
            const adminEmailRow = await c.env.CWD_DB.prepare(
              "SELECT created_at FROM EmailLog WHERE type = 'admin-notify' ORDER BY created_at DESC LIMIT 1"
            ).first<{ created_at: string }>();
            const canSendAdminMail = !adminEmailRow || (Date.now() - new Date(adminEmailRow.created_at).getTime() > 15 * 1000);
            if (canSendAdminMail) {
              if (!notifySettings.adminEnabled) {
                console.log('PostComment:mailDispatch:admin:disabledByConfig');
              } else {
                console.log('PostComment:mailDispatch:admin:send');
                await sendCommentNotification(c.env, {
                  postTitle: data.post_title,
                  postUrl: data.post_url,
                  commentAuthor: author,
                  commentContent: content
                });
                await c.env.CWD_DB.prepare(
                  "INSERT INTO EmailLog (recipient, type, ip_address, created_at) VALUES (?, ?, ?, ?)"
                ).bind('admin', 'admin-notify', ip, new Date().toISOString()).run();
                console.log('PostComment:mailDispatch:admin:logInserted');
              }
            }
            if (!canSendAdminMail) {
              console.log('PostComment:mailDispatch:admin:skippedByRateLimit');
            }
          }
        } catch (mailError) {
          console.error("Mail Notification Failed:", mailError);
        }
      })());
    }
    return c.json({ message: "Comment submitted. Awaiting moderation." });

  } catch (e: any) {
    console.error("Create Comment Error:", e);
    return c.json({ message: "Internal Server Error" }, 500);
  }
};
