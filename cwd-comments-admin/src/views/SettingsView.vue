<template>
  <div class="page">
    <h2 class="page-title">系统设置</h2>
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
          <label class="form-label">头像前缀（Gravatar/Cravatar）</label>
          <input v-model="avatarPrefix" class="form-input" type="text" />
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
          <label class="form-label">新评论通知管理员</label>
          <label class="switch">
            <input v-model="emailAdminEnabled" type="checkbox" />
            <span class="slider" />
          </label>
        </div>
        <div class="form-item">
          <label class="form-label">评论回复通知用户</label>
          <label class="switch">
            <input v-model="emailUserEnabled" type="checkbox" />
            <span class="slider" />
          </label>
        </div>
        <div class="form-item">
          <label class="form-label">管理员通知邮箱</label>
          <input v-model="email" class="form-input" type="email" />
        </div>
        <div
          v-if="message && messageType === 'error'"
          class="form-message form-message-error"
        >
          {{ message }}
        </div>
        <div class="card-actions">
          <button class="card-button" :disabled="savingEmail" @click="saveEmail">
            <span v-if="savingEmail">保存中...</span>
            <span v-else>保存</span>
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
} from "../api/admin";

const email = ref("");
const emailGlobalEnabled = ref(true);
const emailAdminEnabled = ref(true);
const emailUserEnabled = ref(true);
const commentAdminEmail = ref("");
const commentAdminBadge = ref("");
const avatarPrefix = ref("");
const commentAdminEnabled = ref(false);
const savingEmail = ref(false);
const savingComment = ref(false);
const loading = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  window.setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
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
    emailGlobalEnabled.value = !!emailNotifyRes.globalEnabled;
    emailAdminEnabled.value = !!emailNotifyRes.adminEnabled;
    emailUserEnabled.value = !!emailNotifyRes.userEnabled;
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
        adminEnabled: emailAdminEnabled.value,
        userEnabled: emailUserEnabled.value,
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

async function saveComment() {
  savingComment.value = true;
  message.value = "";
  try {
    const res = await saveCommentSettings({
      adminEmail: commentAdminEmail.value,
      adminBadge: commentAdminBadge.value,
      avatarPrefix: avatarPrefix.value,
      adminEnabled: commentAdminEnabled.value,
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
</style>
