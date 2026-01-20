<template>
  <div class="page">
    <h2 class="page-title">数据管理</h2>
    <div
      v-if="toastVisible"
      class="toast"
      :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
    >
      {{ toastMessage }}
    </div>
    
    <div class="card">
      <h3 class="card-title">数据导出</h3>
      <p class="card-desc">
        将所有评论数据导出为 JSON 格式，字段与数据库结构一致。
      </p>
      <div class="card-actions">
        <button class="card-button" :disabled="exporting" @click="handleExport">
          <span v-if="exporting">导出中...</span>
          <span v-else>导出 JSON</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { exportComments } from "../api/admin";

const exporting = ref(false);
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

async function handleExport() {
  exporting.value = true;
  try {
    const data = await exportComments();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comments-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast("导出成功", "success");
  } catch (e: any) {
    showToast(e.message || "导出失败", "error");
  } finally {
    exporting.value = false;
  }
}
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

.card-desc {
  font-size: 14px;
  color: #57606a;
  margin: 0 0 16px;
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
</style>
