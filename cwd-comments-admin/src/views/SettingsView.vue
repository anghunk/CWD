<template>
  <div class="page">
    <h2 class="page-title">网站设置</h2>
    <div
      v-if="toastVisible"
      class="toast"
      :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
    >
      {{ toastMessage }}
    </div>
    <div v-if="loading" class="page-hint">加载中...</div>
    <div v-else>
      <div class="card">
        <h3 class="card-title">评论显示配置</h3>
        <div class="form-item">
          <label class="form-label">评论博主邮箱（用于前台标记）</label>
          <input v-model="commentAdminEmail" class="form-input" type="email" />
        </div>
        <div class="form-item">
          <label class="form-label">博主标签文字</label>
          <input v-model="commentAdminBadge" class="form-input" type="text" />
        </div>
        <div class="form-item">
          <label class="form-label">是否开启博主显示</label>
          <label class="switch">
            <input v-model="commentAdminEnabled" type="checkbox" />
            <span class="slider" />
          </label>
        </div>
        <div class="form-item">
          <label class="form-label">新评论是否审核后再显示</label>
          <label class="switch">
            <input v-model="requireReview" type="checkbox" />
            <span class="slider" />
          </label>
        </div>
        <div class="form-item">
          <label class="form-label">头像前缀（默认：https://gravatar.com/avatar）</label>
          <input v-model="avatarPrefix" class="form-input" type="text" />
        </div>
        <h3 class="card-title">安全设置</h3>
        <div class="form-item">
          <label class="form-label">允许调用的域名（多个域名用逗号分隔，留空则不限制。设置后仅匹配域名可调用前台评论组件。）</label>
          <textarea
            v-model="allowedDomains"
            class="form-input"
            rows="3"
            placeholder="例如: example.com, test.com"
          ></textarea>
        </div>
        <div class="form-item">
          <label class="form-label">管理员评论密钥</label>
          <div class="form-hint" style="margin-bottom: 4px;">
            设置后前台使用管理员邮箱评论需输入此密钥。
          </div>
          <input
            v-model="commentAdminKey"
            class="form-input"
            placeholder="输入密钥以设置或修改"
            autocomplete="new-password"
          />
        </div>
        <div class="card-actions">
          <button class="card-button" :disabled="savingComment" @click="saveComment">
            <span v-if="savingComment">保存中...</span>
            <span v-else>保存</span>
          </button>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">通知邮箱设置</h3>
        <div class="form-item">
          <label class="form-label">开启邮件通知</label>
          <label class="switch">
            <input v-model="emailGlobalEnabled" type="checkbox" />
            <span class="slider" />
          </label>
        </div>
        <div class="form-item">
          <label class="form-label">管理员通知邮箱</label>
          <input
            v-model="email"
            class="form-input"
            type="email"
            placeholder="接收新评论提醒的邮箱"
          />
        </div>

        <div class="divider"></div>
        <h4 class="card-subtitle">1. SMTP 发件配置</h4>

        <div class="form-item">
          <label class="form-label">邮件服务商</label>
          <select v-model="smtpProvider" class="form-input" @change="onProviderChange">
            <option value="qq">QQ 邮箱</option>
            <option value="custom">自定义 SMTP</option>
          </select>
        </div>

        <div v-if="smtpProvider === 'custom'">
          <div class="form-item">
            <label class="form-label">SMTP 服务器</label>
            <input v-model="smtpHost" class="form-input" placeholder="smtp.example.com" />
          </div>
          <div class="form-item">
            <label class="form-label">SMTP 端口</label>
            <input
              v-model="smtpPort"
              class="form-input"
              type="number"
              placeholder="465"
            />
          </div>
          <div class="form-item">
            <label class="form-label">SSL 安全连接</label>
            <label class="switch">
              <input v-model="smtpSecure" type="checkbox" />
              <span class="slider" />
            </label>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">发件邮箱账号</label>
          <input
            v-model="smtpUser"
            class="form-input"
            placeholder="例如: 123456@qq.com"
          />
        </div>
        <div class="form-item">
          <label class="form-label">授权码/密码</label>
          <input
            v-model="smtpPass"
            class="form-input"
            type="password"
            placeholder="QQ邮箱请使用授权码"
          />
          <div v-if="smtpProvider === 'qq'" class="form-hint">
            注意：QQ 邮箱必须使用<a
              href="https://service.mail.qq.com/detail/0/75"
              target="_blank"
              >授权码</a
            >，而非 QQ 密码。<br />
            请登录 QQ 邮箱网页版，在【设置 - 账户】中开启 POP3/SMTP 服务并生成授权码。
          </div>
        </div>

        <div class="divider"></div>
        <h4 class="card-subtitle">2. 邮件模板设置</h4>

        <div class="form-item">
          <label class="form-label">管理员通知模板 (HTML)</label>
          <div class="form-hint">
            可用变量：${commentAuthor} (评论人昵称), ${postTitle} (文章标题), ${postUrl}
            (文章链接), ${commentContent} (评论内容)
          </div>
          <textarea
            v-model="templateAdmin"
            class="form-input"
            rows="6"
            placeholder="留空则使用默认模板"
          ></textarea>
        </div>

        <div class="form-item">
          <label class="form-label">回复通知模板 (HTML)</label>
          <div class="form-hint">
            可用变量：${toName} (接收人昵称), ${replyAuthor} (回复人昵称), ${postTitle}
            (文章标题), ${postUrl} (文章链接), ${parentComment} (原评论), ${replyContent}
            (回复内容)
          </div>
          <textarea
            v-model="templateReply"
            class="form-input"
            rows="6"
            placeholder="留空则使用默认模板"
          ></textarea>
        </div>

        <div
          v-if="message && messageType === 'error'"
          class="form-message form-message-error"
        >
          {{ message }}
        </div>
        <div class="card-actions" style="justify-content: space-between">
          <button
            class="card-button secondary"
            :disabled="testingEmail"
            @click="testEmail"
          >
            <span v-if="testingEmail">发送中...</span>
            <span v-else>发送测试邮件</span>
          </button>
          <button
            class="card-button secondary"
            style="margin-left: auto;"
            @click="resetTemplatesToDefault"
          >
            恢复默认模板
          </button>
          <button class="card-button" :disabled="savingEmail" @click="saveEmail">
            <span v-if="savingEmail">保存中...</span>
            <span v-else>保存配置</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  fetchAdminEmail,
  saveAdminEmail,
  fetchCommentSettings,
  saveCommentSettings,
  fetchEmailNotifySettings,
  saveEmailNotifySettings,
  sendTestEmail,
} from "../api/admin";

const DEFAULT_REPLY_TEMPLATE = `<div style="background-color:#f4f4f5;padding:24px 0;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111827;">
        <div style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#2563eb,#4f46e5);">
          <h1 style="margin:0;font-size:18px;line-height:1.4;color:#f9fafb;">评论回复 - \${postTitle}</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#e5e7eb;">你在文章下的评论收到了新的回复</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 8px 0;font-size:14px;color:#374151;">Hi <span style="font-weight:600;">\${toName}</span>，</p>
          <p style="margin:0 0 16px 0;font-size:14px;color:#4b5563;">
            <span style="font-weight:600;">\${replyAuthor}</span> 回复了你在
            <span style="font-weight:600;">《\${postTitle}》</span>
            中的评论：
          </p>
          <div style="margin:0 0 18px 0;padding:14px 16px;border-radius:10px;background:#f3f4f6;border:1px solid #e5e7eb;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">你之前的评论</div>
            <div style="font-size:14px;color:#374151;">\${parentComment}</div>
          </div>
          <div style="margin:0 0 24px 0;padding:14px 16px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;">
            <div style="font-size:12px;color:#1d4ed8;margin-bottom:6px;">最新回复</div>
            <div style="font-size:14px;color:#1f2937;">\${replyContent}</div>
          </div>
          <div style="text-align:center;margin-bottom:8px;">
            <a href="\${postUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#2563eb;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;">
              打开文章查看完整对话
            </a>
          </div>
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            如果按钮无法点击，可以将链接复制到浏览器中打开：<br />
            <span style="word-break:break-all;color:#6b7280;">\${postUrl}</span>
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

const DEFAULT_ADMIN_TEMPLATE = `<div style="background-color:#f4f4f5;padding:24px 0;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111827;">
        <div style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#0f766e,#059669);">
          <h1 style="margin:0;font-size:18px;line-height:1.4;color:#f9fafb;">新评论提醒</h1>
          <p style="margin:4px 0 0;font-size:12px;color:#d1fae5;">你的文章收到了新的评论</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 10px 0;font-size:14px;color:#374151;">
            <span style="font-weight:600;">\${commentAuthor}</span> 在文章
            <span style="font-weight:600;">《\${postTitle}》</span>
            下发表了新评论：
          </p>
          <div style="margin:0 0 18px 0;padding:14px 16px;border-radius:10px;background:#f9fafb;border:1px solid #e5e7eb;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">评论内容</div>
            <div style="font-size:14px;color:#374151;">\${commentContent}</div>
          </div>
          <div style="margin:0 0 8px 0;">
            <a href="\${postUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#047857;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;">
              打开后台查看并管理评论
            </a>
          </div>
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            如果按钮无法点击，可以将链接复制到浏览器中打开：<br />
            <span style="word-break:break-all;color:#6b7280;">\${postUrl}</span>
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

const email = ref("");
const emailGlobalEnabled = ref(true);
const commentAdminEmail = ref("");
const commentAdminBadge = ref("");
const avatarPrefix = ref("");
const commentAdminEnabled = ref(false);
const allowedDomains = ref("");
const commentAdminKey = ref("");
const adminKeySet = ref(false);
const requireReview = ref(false);
const savingEmail = ref(false);
const testingEmail = ref(false);
const savingComment = ref(false);
const loading = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);

const smtpProvider = ref("qq");
const smtpHost = ref("smtp.qq.com");
const smtpPort = ref(465);
const smtpUser = ref("");
const smtpPass = ref("");
const smtpSecure = ref(true);
const templateAdmin = ref(DEFAULT_ADMIN_TEMPLATE);
const templateReply = ref(DEFAULT_REPLY_TEMPLATE);

function onProviderChange() {
  if (smtpProvider.value === "qq") {
    smtpHost.value = "smtp.qq.com";
    smtpPort.value = 465;
    smtpSecure.value = true;
  }
}

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  window.setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
}

function resetTemplatesToDefault() {
  templateAdmin.value = DEFAULT_ADMIN_TEMPLATE;
  templateReply.value = DEFAULT_REPLY_TEMPLATE;
}

async function load() {
  loading.value = true;
  try {
    const [notifyRes, commentRes, emailNotifyRes] = await Promise.all([
      fetchAdminEmail(),
      fetchCommentSettings(),
      fetchEmailNotifySettings(),
    ]);
    email.value = notifyRes.email || "";
    commentAdminEmail.value = commentRes.adminEmail || "";
    commentAdminBadge.value = commentRes.adminBadge || "博主";
    avatarPrefix.value = commentRes.avatarPrefix || "";
    commentAdminEnabled.value = !!commentRes.adminEnabled;
    allowedDomains.value = commentRes.allowedDomains
      ? commentRes.allowedDomains.join(", ")
      : "";
    commentAdminKey.value = commentRes.adminKey || "";
    adminKeySet.value = !!commentRes.adminKeySet;
    requireReview.value = !!commentRes.requireReview;
    emailGlobalEnabled.value = !!emailNotifyRes.globalEnabled;

    if (emailNotifyRes.templates) {
      templateAdmin.value =
        emailNotifyRes.templates.admin || DEFAULT_ADMIN_TEMPLATE;
      templateReply.value =
        emailNotifyRes.templates.reply || DEFAULT_REPLY_TEMPLATE;
    } else {
      templateAdmin.value = DEFAULT_ADMIN_TEMPLATE;
      templateReply.value = DEFAULT_REPLY_TEMPLATE;
    }

    if (emailNotifyRes.smtp) {
      smtpHost.value = emailNotifyRes.smtp.host;
      smtpPort.value = emailNotifyRes.smtp.port;
      smtpUser.value = emailNotifyRes.smtp.user;
      smtpPass.value = emailNotifyRes.smtp.pass;
      smtpSecure.value = emailNotifyRes.smtp.secure;

      if (emailNotifyRes.smtp.host === "smtp.qq.com") {
        smtpProvider.value = "qq";
      } else {
        smtpProvider.value = "custom";
      }
    }
  } catch (e: any) {
    message.value = e.message || "加载失败";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
}

async function saveEmail() {
  if (!email.value) {
    message.value = "请输入邮箱";
    messageType.value = "error";
    return;
  }
  savingEmail.value = true;
  message.value = "";
  try {
    const [emailRes] = await Promise.all([
      saveAdminEmail(email.value),
      saveEmailNotifySettings({
        globalEnabled: emailGlobalEnabled.value,
        smtp: {
          host: smtpHost.value,
          port: smtpPort.value,
          user: smtpUser.value,
          pass: smtpPass.value,
          secure: smtpSecure.value,
        },
        templates: {
          reply: templateReply.value,
          admin: templateAdmin.value,
        },
      }),
    ]);
    showToast(emailRes.message || "保存成功", "success");
  } catch (e: any) {
    message.value = e.message || "保存失败";
    messageType.value = "error";
  } finally {
    savingEmail.value = false;
  }
}

async function testEmail() {
  if (!email.value) {
    message.value = "请输入管理员通知邮箱作为测试接收邮箱";
    messageType.value = "error";
    return;
  }
  if (!smtpUser.value || !smtpPass.value) {
    message.value = "请先填写 SMTP 账号和密码";
    messageType.value = "error";
    return;
  }

  testingEmail.value = true;
  message.value = "";
  try {
    const res = await sendTestEmail({
      toEmail: email.value,
      smtp: {
        host: smtpHost.value,
        port: smtpPort.value,
        user: smtpUser.value,
        pass: smtpPass.value,
        secure: smtpSecure.value,
      },
    });
    showToast(res.message || "发送成功，请查收邮件", "success");
  } catch (e: any) {
    // 显示详细错误信息
    console.error(e);
    let errorMsg = e.message || "发送失败";

    // 针对 QQ 邮箱 535 错误的友好提示
    if (
      errorMsg.includes("535") &&
      (errorMsg.includes("Login fail") || errorMsg.includes("authentication failed"))
    ) {
      errorMsg =
        "验证失败 (535)：请检查 1. QQ 邮箱是否已开启 POP3/SMTP 服务；2. 密码栏是否填写了“授权码”（非 QQ 密码）。";
    }

    message.value = errorMsg;
    messageType.value = "error";
  } finally {
    testingEmail.value = false;
  }
}

async function saveComment() {
  savingComment.value = true;
  message.value = "";
  try {
    const res = await saveCommentSettings({
      adminEmail: commentAdminEmail.value,
      adminBadge: commentAdminBadge.value,
      avatarPrefix: avatarPrefix.value,
      adminEnabled: commentAdminEnabled.value,
      allowedDomains: allowedDomains.value
        .split(/[,，\n]/)
        .map((d) => d.trim())
        .filter(Boolean),
      adminKey: commentAdminKey.value || undefined,
      requireReview: requireReview.value,
    });

    showToast(res.message || "保存成功", "success");
  } catch (e: any) {
    message.value = e.message || "保存失败";
    messageType.value = "error";
  } finally {
    savingComment.value = false;
  }
}

onMounted(() => {
  load();
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 520px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  color: #24292f;
}

.card {
  background-color: #ffffff;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  padding: 16px 18px;
  margin-bottom: 1em;
}

.card-title {
  margin: 0 0 12px;
  font-size: 15px;
}

.card-subtitle {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #24292f;
}

.divider {
  height: 1px;
  background-color: #d0d7de;
  margin: 16px 0;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-label {
  font-size: 14px;
  color: #555555;
}

.form-input {
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  font-size: 14px;
  outline: none;
}

.form-input:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 1px rgba(9, 105, 218, 0.2);
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 220px;
  max-width: 320px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
  z-index: 1000;
}

.toast-success {
  background-color: #1a7f37;
  color: #ffffff;
}

.toast-error {
  background-color: #d1242f;
  color: #ffffff;
}

.switch {
  position: relative;
  display: inline-flex;
  width: 40px;
  height: 22px;
  align-items: center;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d0d7de;
  transition: 0.2s;
  border-radius: 999px;
}

.slider::before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  top: 3px;
  background-color: #ffffff;
  transition: 0.2s;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(27, 31, 36, 0.15);
}

.switch input:checked + .slider {
  background-color: #0969da;
}

.switch input:checked + .slider::before {
  transform: translateX(16px);
}

.card-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.card-button {
  padding: 8px 14px;
  border-radius: 4px;
  border: none;
  background-color: #0969da;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
}

.card-button.secondary {
  background-color: #f6f8fa;
  color: #24292f;
  border: 1px solid #d0d7de;
}
.card-button.secondary:hover {
  background-color: #f3f4f6;
  border-color: #d0d7de;
}

.card-button:disabled {
  opacity: 0.7;
  cursor: default;
}

.form-message {
  font-size: 13px;
  margin-bottom: 8px;
}

.form-message-success {
  color: #1a7f37;
}

.form-message-error {
  color: #d1242f;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #0969da;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: #57606a;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.page-hint {
  font-size: 14px;
  color: #57606a;
}
.form-hint {
  font-size: 12px;
  color: #57606a;
  margin-top: 4px;
  line-height: 1.5;
}
.form-hint a {
  color: #0969da;
  text-decoration: none;
}
.form-hint a:hover {
  text-decoration: underline;
}
</style>
