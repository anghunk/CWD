import { Bindings } from '../bindings';

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const EMAIL_NOTIFY_GLOBAL_KEY = 'email_notify_enabled';
const EMAIL_NOTIFY_ADMIN_KEY = 'email_notify_admin_enabled';
const EMAIL_NOTIFY_USER_KEY = 'email_notify_user_enabled';

type MailGatewayPayload = {
  to: string[];
  subject: string;
  html: string;
};

async function dispatchMail(env: Bindings, payload: MailGatewayPayload) {
  if (!env.MAIL_GATEWAY_URL) {
    console.error('MailGateway:missingUrl');
    return;
  }

  try {
    const res = await fetch(env.MAIL_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.MAIL_GATEWAY_TOKEN ? { 'X-Auth-Token': env.MAIL_GATEWAY_TOKEN } : {})
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error('MailGateway:sendFailed', {
        status: res.status,
        statusText: res.statusText
      });
    }
  } catch (e: any) {
    console.error('MailGateway:error', {
      message: e?.message || String(e)
    });
  }
}

export type EmailNotificationSettings = {
  globalEnabled: boolean;
  adminEnabled: boolean;
  userEnabled: boolean;
};

function parseEnabled(raw: string | undefined, defaultValue: boolean) {
  if (raw === undefined) return defaultValue;
  return raw === '1';
}

export async function loadEmailNotificationSettings(
  env: Bindings
): Promise<EmailNotificationSettings> {
  await env.CWD_DB.prepare(
    'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  ).run();

  const keys = [EMAIL_NOTIFY_GLOBAL_KEY, EMAIL_NOTIFY_ADMIN_KEY, EMAIL_NOTIFY_USER_KEY];
  const { results } = await env.CWD_DB.prepare(
    'SELECT key, value FROM Settings WHERE key IN (?, ?, ?)'
  )
    .bind(...keys)
    .all<{ key: string; value: string }>();

  const map = new Map<string, string>();
  for (const row of results) {
    if (row && row.key) {
      map.set(row.key, row.value);
    }
  }

  const globalEnabled = parseEnabled(map.get(EMAIL_NOTIFY_GLOBAL_KEY), true);
  const adminEnabled = parseEnabled(map.get(EMAIL_NOTIFY_ADMIN_KEY), true);
  const userEnabled = parseEnabled(map.get(EMAIL_NOTIFY_USER_KEY), true);

  return {
    globalEnabled,
    adminEnabled,
    userEnabled
  };
}

export async function saveEmailNotificationSettings(
  env: Bindings,
  settings: {
    globalEnabled?: boolean;
    adminEnabled?: boolean;
    userEnabled?: boolean;
  }
) {
  await env.CWD_DB.prepare(
    'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  ).run();

  const entries: { key: string; value: string | undefined }[] = [
    {
      key: EMAIL_NOTIFY_GLOBAL_KEY,
      value:
        typeof settings.globalEnabled === 'boolean'
          ? settings.globalEnabled
            ? '1'
            : '0'
          : undefined
    },
    {
      key: EMAIL_NOTIFY_ADMIN_KEY,
      value:
        typeof settings.adminEnabled === 'boolean'
          ? settings.adminEnabled
            ? '1'
            : '0'
          : undefined
    },
    {
      key: EMAIL_NOTIFY_USER_KEY,
      value:
        typeof settings.userEnabled === 'boolean'
          ? settings.userEnabled
            ? '1'
            : '0'
          : undefined
    }
  ];

  for (const entry of entries) {
    if (entry.value !== undefined) {
      await env.CWD_DB.prepare('REPLACE INTO Settings (key, value) VALUES (?, ?)')
        .bind(entry.key, entry.value)
        .run();
    }
  }
}

export async function sendCommentReplyNotification(
  env: Bindings,
  params: {
    toEmail: string;
    toName: string;
    postTitle: string;
    parentComment: string;
    replyAuthor: string;
    replyContent: string;
    postUrl: string;
  }
) {
  const { toEmail, toName, postTitle, parentComment, replyAuthor, replyContent, postUrl } = params;

  console.log('EmailReplyNotification:start', {
    toEmail,
    toName,
    postTitle
  });

  const html = `
    <div style="background-color:#f4f4f5;padding:24px 0;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111827;">
        <div style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#2563eb,#4f46e5);">
          <h1 style="margin:0;font-size:18px;line-height:1.4;color:#f9fafb;">评论回复 - ${postTitle}</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#e5e7eb;">你在文章下的评论收到了新的回复</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 8px 0;font-size:14px;color:#374151;">Hi <span style="font-weight:600;">${toName}</span>，</p>
          <p style="margin:0 0 16px 0;font-size:14px;color:#4b5563;">
            <span style="font-weight:600;">${replyAuthor}</span> 回复了你在
            <span style="font-weight:600;">《${postTitle}》</span>
            中的评论：
          </p>
          <div style="margin:0 0 18px 0;padding:14px 16px;border-radius:10px;background:#f3f4f6;border:1px solid #e5e7eb;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">你之前的评论</div>
            <div style="font-size:14px;color:#374151;white-space:pre-wrap;">${parentComment}</div>
          </div>
          <div style="margin:0 0 24px 0;padding:14px 16px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;">
            <div style="font-size:12px;color:#1d4ed8;margin-bottom:6px;">最新回复</div>
            <div style="font-size:14px;color:#1f2937;white-space:pre-wrap;">${replyContent}</div>
          </div>
          <div style="text-align:center;margin-bottom:8px;">
            <a href="${postUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#2563eb;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;">
              打开文章查看完整对话
            </a>
          </div>
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            如果按钮无法点击，可以将链接复制到浏览器中打开：<br />
            <span style="word-break:break-all;color:#6b7280;">${postUrl}</span>
          </p>
        </div>
        <div style="padding:14px 20px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
          <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">
            此邮件由系统自动发送，请勿直接回复。
          </p>
        </div>
      </div>
    </div>
  `;

  if (!isValidEmail(toEmail)) {
    console.warn('EmailReplyNotification:invalidRecipient', { toEmail });
    return;
  }

  await dispatchMail(env, {
    to: [toEmail],
    subject: `评论回复 - ${postTitle}`,
    html
  });

  console.log('EmailReplyNotification:sent', {
    toEmail
  });
}

/**
 * 站长通知邮件
 */
export async function sendCommentNotification(
  env: Bindings,
  params: {
    postTitle: string;
    postUrl: string;
    commentAuthor: string;
    commentContent: string;
  }
) {
  const { postTitle, postUrl, commentAuthor, commentContent } = params;
  const toEmail = await getAdminNotifyEmail(env);

  const html = `
    <div style="background-color:#f4f4f5;padding:24px 0;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111827;">
        <div style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#0f766e,#059669);">
          <h1 style="margin:0;font-size:18px;line-height:1.4;color:#f9fafb;">新评论提醒</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#d1fae5;">你的文章收到了新的评论</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 10px 0;font-size:14px;color:#374151;">
            <span style="font-weight:600;">${commentAuthor}</span> 在文章
            <span style="font-weight:600;">《${postTitle}》</span>
            下发表了新评论：
          </p>
          <div style="margin:0 0 18px 0;padding:14px 16px;border-radius:10px;background:#f9fafb;border:1px solid #e5e7eb;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">评论内容</div>
            <div style="font-size:14px;color:#374151;white-space:pre-wrap;">${commentContent}</div>
          </div>
          <div style="margin:0 0 8px 0;">
            <a href="${postUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#047857;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;">
              打开后台查看并管理评论
            </a>
          </div>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            如果按钮无法点击，可以将链接复制到浏览器中打开：<br />
            <span style="word-break:break-all;color:#6b7280;">${postUrl}</span>
          </p>
        </div>
        <div style="padding:14px 20px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
          <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af;">
            此邮件由系统自动发送，如非本人操作可忽略本邮件。
          </p>
        </div>
      </div>
    </div>
  `;

  if (!isValidEmail(toEmail)) {
    console.warn('EmailAdminNotification:invalidRecipient', { toEmail });
    return;
  }

  await dispatchMail(env, {
    to: [toEmail],
    subject: `新评论提醒 - ${postTitle}`,
    html
  });

  console.log('EmailAdminNotification:sent', {
    toEmail
  });
}

export async function getAdminNotifyEmail(env: Bindings): Promise<string> {
  await env.CWD_DB.prepare(
    'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  ).run();
  const row = await env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
    .bind('admin_notify_email')
    .first<{ value: string }>();
  if (row?.value && isValidEmail(row.value)) {
    const cleanEmail = row.value.trim();
    console.log('EmailAdminNotification:useDbEmail', {
      email: cleanEmail,
      originalLength: row.value.length,
      cleanLength: cleanEmail.length
    });
    return cleanEmail;
  }
  console.error('EmailAdminNotification:noAdminEmail', {
    dbValue: row?.value
  });
  throw new Error('未配置管理员通知邮箱或格式不正确');
}
