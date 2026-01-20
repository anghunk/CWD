<template>
  <div class="page">
    <h2 class="page-title">评论管理</h2>
    <div class="toolbar">
      <div class="toolbar-left">
        <select v-model="statusFilter" class="toolbar-select">
          <option value="">全部状态</option>
          <option value="approved">已通过</option>
          <option value="pending">待审核</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-button" @click="loadComments">刷新</button>
      </div>
    </div>
    <div v-if="loading" class="page-hint">加载中...</div>
    <div v-else-if="error" class="page-error">{{ error }}</div>
    <div v-else>
      <div class="comment-table">
        <div class="table-header">
          <div class="table-cell table-cell-author">用户</div>
          <div class="table-cell table-cell-content">评论信息</div>
          <div class="table-cell table-cell-path">评论地址</div>
          <div class="table-cell table-cell-status">状态</div>
          <div class="table-cell table-cell-actions">操作</div>
        </div>
        <div v-for="item in filteredComments" :key="item.id" class="table-row">
          <div class="table-cell table-cell-author">
            <div class="cell-author-wrapper">
              <img
                v-if="item.avatar"
                :src="item.avatar"
                class="cell-avatar"
                :alt="item.author"
              />
              <div class="cell-author-main">
                <div class="cell-author-name">{{ item.author }}</div>
                <div class="cell-author-email">{{ item.email }}</div>
                <span class="cell-time">{{ formatDate(item.pubDate) }}</span>
              </div>
            </div>
          </div>
          <div class="table-cell table-cell-content">
            <div class="cell-content-text">{{ item.contentText }}</div>
          </div>
          <div class="table-cell table-cell-path">
            <span class="cell-path" :title="item.postSlug">{{ item.postSlug }}</span>
          </div>

          <div class="table-cell table-cell-status">
            <span class="cell-status" :class="`cell-status-${item.status}`">
              {{ formatStatus(item.status) }}
            </span>
          </div>
          <div class="table-cell table-cell-actions">
            <div class="table-actions">
              <button
                class="table-action"
                @click="changeStatus(item, 'approved')"
                :disabled="item.status === 'approved'"
              >
                通过
              </button>
              <button
                class="table-action"
                @click="changeStatus(item, 'pending')"
                :disabled="item.status === 'pending'"
              >
                待审
              </button>
              <button
                class="table-action"
                @click="changeStatus(item, 'rejected')"
                :disabled="item.status === 'rejected'"
              >
                拒绝
              </button>
              <button
                class="table-action table-action-danger"
                @click="removeComment(item)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
        <div v-if="filteredComments.length === 0" class="table-empty">暂无数据</div>
      </div>
      <div v-if="pagination.total > 1" class="pagination">
        <button
          class="pagination-button"
          :disabled="pagination.page <= 1"
          @click="goPage(pagination.page - 1)"
        >
          上一页
        </button>
        <span class="pagination-info"
          >{{ pagination.page }} / {{ pagination.total }}</span
        >
        <button
          class="pagination-button"
          :disabled="pagination.page >= pagination.total"
          @click="goPage(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import {
  CommentItem,
  CommentListResponse,
  fetchComments,
  deleteComment,
  updateCommentStatus,
} from "../api/admin";

const comments = ref<CommentItem[]>([]);
const pagination = ref<{ page: number; total: number }>({ page: 1, total: 1 });
const loading = ref(false);
const error = ref("");
const statusFilter = ref("");

const filteredComments = computed(() => {
  if (!statusFilter.value) {
    return comments.value;
  }
  return comments.value.filter((item) => item.status === statusFilter.value);
});

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleString();
}

function formatStatus(status: string) {
  if (status === "approved") {
    return "已通过";
  }
  if (status === "pending") {
    return "待审核";
  }
  if (status === "rejected") {
    return "已拒绝";
  }
  return status;
}

async function loadComments(page?: number) {
  const targetPage = typeof page === "number" ? page : 1;
  loading.value = true;
  error.value = "";
  try {
    const res = await fetchComments(targetPage);
    comments.value = res.data;
    pagination.value = { page: res.pagination.page, total: res.pagination.total };
  } catch (e: any) {
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

async function goPage(page: number) {
  if (page < 1 || page > pagination.value.total) {
    return;
  }
  await loadComments(page);
}

async function changeStatus(item: CommentItem, status: string) {
  try {
    await updateCommentStatus(item.id, status);
    item.status = status;
  } catch (e: any) {
    error.value = e.message || "更新状态失败";
  }
}

async function removeComment(item: CommentItem) {
  if (!window.confirm(`确认删除评论 ${item.id} 吗`)) {
    return;
  }
  try {
    await deleteComment(item.id);
    comments.value = comments.value.filter((c) => c.id !== item.id);
  } catch (e: any) {
    error.value = e.message || "删除失败";
  }
}

onMounted(() => {
  loadComments();
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  color: #24292f;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.toolbar-select {
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  background-color: #ffffff;
}

.toolbar-button {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  background-color: #f6f8fa;
  cursor: pointer;
  font-size: 13px;
}

.page-hint {
  font-size: 14px;
  color: #57606a;
}

.page-error {
  font-size: 14px;
  color: #d1242f;
}

.comment-table {
  background-color: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
}

.table-header {
  display: flex;
  background-color: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #eaeae0;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-cell {
  padding: 10px 12px;
  font-size: 13px;
  color: #24292f;
  display: flex;
  align-items: center;
}

.table-cell-id {
  width: 120px;
  flex-shrink: 0;
  white-space: nowrap;
}

.table-cell-author {
  width: 180px;
  flex-shrink: 0;
}

.table-cell-content {
  flex: 1;
  min-width: 200px;
}

.table-cell-path {
  width: 160px;
  flex-shrink: 0;
}

.table-cell-time {
  width: 150px;
  flex-shrink: 0;
}

.table-cell-status {
  width: 80px;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
}

.table-cell-actions {
  white-space: nowrap;
  flex-shrink: 0;
  justify-content: flex-start;
  align-items: center;
}

.table-header .table-cell {
  font-weight: 500;
  color: #57606a;
  align-items: center;
}

.cell-id {
  font-size: 12px;
  color: #57606a;
}

.cell-author-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

.cell-author-email {
  font-size: 11px;
  color: #57606a;
  word-break: break-all;
  margin-bottom: 2px;
}

.cell-content-text {
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.cell-path {
  font-size: 12px;
  color: #57606a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-time {
  font-size: 12px;
  color: #57606a;
}

.cell-author-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.cell-author-main {
  display: flex;
  flex-direction: column;
}

.cell-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cell-status {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
}

.cell-status-approved {
  color: #1a7f37;
  background-color: #e7f5eb;
}

.cell-status-pending {
  color: #9a6700;
  background-color: #fff8c5;
}

.cell-status-rejected {
  color: #d1242f;
  background-color: #ffebe9;
}

.table-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.table-action {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  background-color: #ffffff;
  font-size: 11px;
  cursor: pointer;
}

.table-action:hover {
  background-color: #f6f8fa;
}

.table-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.table-action-danger {
  border-color: #d1242f;
  color: #d1242f;
}

.table-action-danger:hover {
  background-color: #ffebe9;
}

.table-empty {
  padding: 32px;
  text-align: center;
  color: #57606a;
  font-size: 13px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-button {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  background-color: #f6f8fa;
  font-size: 12px;
  cursor: pointer;
}

.pagination-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 13px;
  color: #57606a;
}
</style>
