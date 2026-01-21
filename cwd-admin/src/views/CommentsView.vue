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
        <select v-model="domainFilter" class="toolbar-select">
          <option value="">全部域名</option>
          <option v-for="item in domainOptions" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-button" @click="goPage(1)">刷新</button>
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
                :alt="item.name"
              />
              <div class="cell-author-main">
                <div class="cell-author-name">{{ item.name }}</div>
                <div class="cell-author-email">
                  <span
                    class="cell-email-text"
                    @click="handleBlockEmail(item)"
                    title="屏蔽该邮箱"
                  >
                    {{ item.email }}
                  </span>
                </div>
                <span class="cell-time">{{ formatDate(item.created) }}</span>
                <div v-if="item.ipAddress" class="cell-author-ip">
                  <span
                    class="cell-ip-text"
                    @click="handleBlockIp(item)"
                    title="屏蔽该 IP"
                    >{{ item.ipAddress }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="table-cell table-cell-content">
            <div class="cell-content-text">{{ item.contentText }}</div>
          </div>
          <div class="table-cell table-cell-path">
            <a
              :href="item.postSlug"
              target="_blank"
              class="cell-path"
              :title="item.postSlug"
              >{{ item.postSlug }}</a
            >
          </div>
          <div class="table-cell table-cell-status">
            <span class="cell-status" :class="`cell-status-${item.status}`">
              {{ formatStatus(item.status) }}
            </span>
          </div>
          <div class="table-cell table-cell-actions">
            <div class="table-actions">
              <select
                class="status-select"
                :value="item.status"
                @change="handleStatusChange(item, $event)"
              >
                <option value="approved">通过</option>
                <option value="pending">待审</option>
                <option value="rejected">拒绝</option>
              </select>
              <button class="table-action" @click="openEdit(item)">编辑</button>
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
        <button
          class="pagination-button"
          :class="{ 'pagination-button-active': pagination.page === 1 }"
          :disabled="pagination.page === 1"
          @click="goPage(1)"
        >
          1
        </button>
        <span
          v-if="visiblePages.length && visiblePages[0] > 2"
          class="pagination-ellipsis"
        >
          ...
        </span>
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== 1 && page !== pagination.total"
            class="pagination-button"
            :class="{ 'pagination-button-active': page === pagination.page }"
            :disabled="page === pagination.page"
            @click="goPage(page)"
          >
            {{ page }}
          </button>
        </template>
        <span
          v-if="
            visiblePages.length &&
            visiblePages[visiblePages.length - 1] < pagination.total - 1
          "
          class="pagination-ellipsis"
        >
          ...
        </span>
        <button
          v-if="pagination.total > 1"
          class="pagination-button"
          :class="{ 'pagination-button-active': pagination.page === pagination.total }"
          :disabled="pagination.page === pagination.total"
          @click="goPage(pagination.total)"
        >
          {{ pagination.total }}
        </button>
        <button
          class="pagination-button"
          :disabled="pagination.page >= pagination.total"
          @click="goPage(pagination.page + 1)"
        >
          下一页
        </button>
        <div class="pagination-jump">
          <span>跳转到</span>
          <input
            v-model="jumpPageInput"
            class="pagination-input"
            type="number"
            min="1"
            :max="pagination.total"
            @keyup.enter="handleJumpPage"
          />
          <span>页</span>
          <button class="pagination-button" @click="handleJumpPage">确定</button>
        </div>
      </div>
    </div>
    <div v-if="editVisible" class="modal-overlay" @click.self="closeEdit">
      <div class="modal">
        <h3 class="modal-title">编辑评论</h3>
        <div v-if="editForm" class="modal-body">
          <div class="form-item">
            <label class="form-label">访客昵称</label>
            <input v-model="editForm.name" class="form-input" type="text" />
          </div>
          <div class="form-item">
            <label class="form-label">访客邮箱</label>
            <input v-model="editForm.email" class="form-input" type="email" />
          </div>
          <div class="form-item">
            <label class="form-label">访客网址</label>
            <input v-model="editForm.url" class="form-input" type="text" />
          </div>
          <div class="form-item">
            <label class="form-label">评论地址</label>
            <input v-model="editForm.postSlug" class="form-input" type="text" />
          </div>
          <div class="form-item">
            <label class="form-label">评论内容</label>
            <textarea
              v-model="editForm.contentText"
              class="form-input"
              rows="4"
            ></textarea>
          </div>
          <div class="form-item">
            <label class="form-label">评论状态</label>
            <select v-model="editForm.status" class="form-input">
              <option value="approved">已通过</option>
              <option value="pending">待审核</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" type="button" @click="closeEdit">
            取消
          </button>
          <button
            class="modal-btn primary"
            type="button"
            :disabled="editSaving"
            @click="submitEdit"
          >
            <span v-if="editSaving">保存中...</span>
            <span v-else>保存</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  CommentItem,
  CommentListResponse,
  fetchComments,
  fetchCommentStats,
  deleteComment,
  updateCommentStatus,
  updateComment,
  blockIp,
  blockEmail,
} from "../api/admin";

const route = useRoute();
const router = useRouter();

const comments = ref<CommentItem[]>([]);
const pagination = ref<{ page: number; total: number }>({ page: 1, total: 1 });
const loading = ref(false);
const error = ref("");
const statusFilter = ref("");
const domainFilter = ref("");
const jumpPageInput = ref("");
const editVisible = ref(false);
const editSaving = ref(false);
const editForm = ref<{
  id: number;
  name: string;
  email: string;
  url: string;
  postSlug: string;
  contentText: string;
  status: string;
} | null>(null);

const domainOptions = ref<string[]>([]);

const filteredComments = computed(() => {
  if (!statusFilter.value) {
    return comments.value;
  }
  return comments.value.filter((item) => item.status === statusFilter.value);
});

const visiblePages = computed(() => {
  const total = pagination.value.total;
  const current = pagination.value.page;
  const maxVisible = 5;
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  let start = current - Math.floor(maxVisible / 2);
  let end = current + Math.floor(maxVisible / 2);
  if (start < 1) {
    start = 1;
    end = maxVisible;
  } else if (end > total) {
    end = total;
    start = total - maxVisible + 1;
  }
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  return pages;
});

function formatDate(value: number) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
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
    const res = await fetchComments(targetPage, domainFilter.value || undefined);
    comments.value = res.data;
    pagination.value = { page: res.pagination.page, total: res.pagination.total };
  } catch (e: any) {
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

function updateRoutePage(page: number) {
  const query: Record<string, any> = { ...route.query };
  if (page <= 1) {
    delete query.p;
  } else {
    query.p = String(page);
  }
  if (domainFilter.value) {
    query.domain = domainFilter.value;
  } else {
    delete query.domain;
  }
  router.push({ query });
}

async function goPage(page: number) {
  if (page < 1 || page > pagination.value.total) {
    return;
  }
  updateRoutePage(page);
  await loadComments(page);
}

function handleJumpPage() {
  const value = Number(jumpPageInput.value);
  if (!Number.isFinite(value)) {
    return;
  }
  const page = Math.floor(value);
  if (page < 1 || page > pagination.value.total) {
    return;
  }
  jumpPageInput.value = "";
  updateRoutePage(page);
  loadComments(page);
}

async function changeStatus(item: CommentItem, status: string) {
  try {
    await updateCommentStatus(item.id, status);
    item.status = status;
  } catch (e: any) {
    error.value = e.message || "更新状态失败";
  }
}

function handleStatusChange(item: CommentItem, event: Event) {
  const target = event.target as HTMLSelectElement;
  const status = target.value;
  if (!status || status === item.status) {
    return;
  }
  changeStatus(item, status);
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

async function handleBlockIp(item: CommentItem) {
  if (!item.ipAddress) {
    return;
  }
  if (!window.confirm(`确认将 IP ${item.ipAddress} 加入黑名单吗？`)) {
    return;
  }
  try {
    const res = await blockIp(item.ipAddress);
    window.alert(res.message || "已加入 IP 黑名单");
  } catch (e: any) {
    error.value = e.message || "屏蔽 IP 失败";
  }
}

async function handleBlockEmail(item: CommentItem) {
  if (!item.email) {
    return;
  }
  if (!window.confirm(`确认将邮箱 ${item.email} 加入黑名单吗？`)) {
    return;
  }
  try {
    const res = await blockEmail(item.email);
    window.alert(res.message || "已加入邮箱黑名单");
  } catch (e: any) {
    error.value = e.message || "屏蔽邮箱失败";
  }
}

function openEdit(item: CommentItem) {
  editForm.value = {
    id: item.id,
    name: item.name,
    email: item.email,
    url: item.url || "",
    postSlug: item.postSlug || "",
    contentText: item.contentText,
    status: item.status,
  };
  editVisible.value = true;
}

function closeEdit() {
  if (editSaving.value) {
    return;
  }
  editVisible.value = false;
  editForm.value = null;
}

async function submitEdit() {
  if (!editForm.value || editSaving.value) {
    return;
  }
  const current = editForm.value;
  const trimmedName = current.name.trim();
  const trimmedEmail = current.email.trim();
  const trimmedContent = current.contentText.trim();
  const trimmedUrl = current.url.trim();
  const trimmedPostSlug = current.postSlug.trim();
  const commentIndex = comments.value.findIndex((c) => c.id === current.id);
  const existingComment = commentIndex !== -1 ? comments.value[commentIndex] : null;
  const newPostSlug = trimmedPostSlug || existingComment?.postSlug || "";
  if (!trimmedName || !trimmedEmail || !trimmedContent) {
    error.value = "昵称、邮箱和内容不能为空";
    return;
  }
  editSaving.value = true;
  error.value = "";
  try {
    await updateComment({
      id: current.id,
      name: trimmedName,
      email: trimmedEmail,
      url: trimmedUrl || null,
      postSlug: newPostSlug,
      contentText: trimmedContent,
      status: current.status,
    });
    if (commentIndex !== -1) {
      comments.value[commentIndex] = {
        ...comments.value[commentIndex],
        name: trimmedName,
        email: trimmedEmail,
        url: trimmedUrl || null,
        postSlug: newPostSlug,
        contentText: trimmedContent,
        status: current.status,
      };
    }
    closeEdit();
  } catch (e: any) {
    error.value = e.message || "更新评论失败";
  } finally {
    editSaving.value = false;
  }
}

onMounted(() => {
  const p = route.query.p;
  let initialPage = 1;
  if (typeof p === "string") {
    const value = Number(p);
    if (Number.isFinite(value) && value >= 1) {
      initialPage = Math.floor(value);
    }
  } else if (Array.isArray(p) && typeof p[0] === "string") {
    const value = Number(p[0]);
    if (Number.isFinite(value) && value >= 1) {
      initialPage = Math.floor(value);
    }
  }
  const d = route.query.domain;
  if (typeof d === "string" && d.trim()) {
    domainFilter.value = d.trim();
  }

  fetchCommentStats()
    .then((res: CommentListResponse | any) => {
      const domains = Array.isArray(res.domains) ? res.domains.map((item: any) => item.domain) : [];
      domainOptions.value = Array.from(new Set(domains));
    })
    .catch(() => {
      domainOptions.value = [];
    });

  loadComments(initialPage);
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
  gap: 8px;
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
  padding: 8px 8px;
  box-sizing: border-box;
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
  font-size: 14px;
  min-width: 70px;
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
  overflow-x: auto;
}

.table-header {
  display: flex;
  background-color: #f6f8fa;
}

.table-row {
  display: flex;
  /* border-bottom: 1px solid #eaeae0; */
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover .table-cell {
  background-color: #f8f9fa;
}

.table-cell {
  padding: 10px 12px;
  font-size: 13px;
  color: #24292f;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
  border-bottom: 1px solid #eaeae0;
}

.table-cell-id {
  width: 120px;
  flex-shrink: 0;
  white-space: nowrap;
}

.table-cell-author {
  width: 220px;
  flex-shrink: 0;
}

.table-cell-content {
  flex-direction: column;
  flex: 1;
  align-items: flex-start !important;
  justify-content: center;
  min-width: 200px;
}

.table-cell-path {
  width: 240px;
  flex-shrink: 0;
}

.table-cell-time {
  width: 150px;
  flex-shrink: 0;
}

.table-cell-status {
  width: 100px;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
}

.table-cell-actions {
  white-space: nowrap;
  flex-shrink: 0;
  justify-content: flex-start;
  align-items: center;
  width: 250px;
}

.table-header .table-cell {
  font-weight: 500;
  color: #57606a;
  align-items: center;
  background-color: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
}

.cell-id {
  font-size: 12px;
  color: #57606a;
}

.cell-author-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.cell-author-email {
  font-size: 12px;
  color: #57606a;
  word-break: break-all;
  margin-bottom: 2px;
}

.cell-email-text {
  cursor: pointer;
}

.cell-email-text:hover {
  text-decoration: underline;
}

.cell-content-text {
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 5px;
}

.cell-path {
  font-size: 13px;
  color: #2774cb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
}

.cell-path:hover {
  text-decoration: underline;
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
  border-radius: 5px;
  flex-shrink: 0;
}

.cell-status {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
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

.status-select {
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  font-size: 13px;
  cursor: pointer;
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
  font-size: 13px;
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
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.pagination-button {
  height: 28px;
  min-width: 28px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  background-color: #f6f8fa;
  font-size: 12px;
  cursor: pointer;
  box-sizing: border-box;
}

.pagination-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-button-active {
  background-color: #0969da;
  color: #ffffff;
  border-color: #0969da;
}

.pagination-ellipsis {
  padding: 0 2px;
  font-size: 12px;
  color: #57606a;
}

.pagination-jump {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #57606a;
}

.pagination-input {
  width: 60px;
  height: 28px;
  box-sizing: border-box;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  font-size: 12px;
}

.cell-ip-text {
  cursor: pointer;
}

.cell-ip-text:hover {
  text-decoration: underline;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  z-index: 2000;
}

.modal {
  background-color: #ffffff;
  border-radius: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  height: 100vh;
  padding: 20px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transform: translateX(0);
  animation: drawer-in 0.2s ease-out;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292f;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.modal-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
}

.modal-btn.primary {
  background-color: #0969da;
  color: #ffffff;
}

.modal-btn.secondary {
  background-color: #f6f8fa;
  border-color: #d0d7de;
  color: #24292f;
}

.modal-btn:hover {
  opacity: 0.9;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  color: #57606a;
}

.form-input {
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid #d0d7de;
  font-size: 13px;
  outline: none;
}

.form-input:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 1px rgba(9, 105, 218, 0.2);
}

@keyframes drawer-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
