<template>
  <div class="layout">
    <header class="layout-header">
      <div class="layout-title">CWD 评论后台</div>
      <div class="layout-actions">
        <a
          class="layout-button"
          href="https://cwd-comments-docs.zishu.me"
          target="_blank"
        >
          使用文档
        </a>
        <a
          class="layout-button"
          href="https://github.com/anghunk/cwd-comments"
          target="_blank"
        >
          Github
        </a>
        <button class="layout-button" @click="handleLogout">退出</button>
      </div>
    </header>
    <div class="layout-body">
      <nav class="layout-sider">
        <ul class="menu">
          <li
            class="menu-item"
            :class="{ active: isRouteActive('comments') }"
            @click="goComments"
          >
            评论管理
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('data') }"
            @click="goData"
          >
            数据管理
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('settings') }"
            @click="goSettings"
          >
            系统设置
          </li>
        </ul>
      </nav>
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { logoutAdmin } from "../api/admin";

const router = useRouter();
const route = useRoute();

function isRouteActive(name: string) {
  return route.name === name;
}

function goComments() {
  router.push({ name: "comments" });
}

function goData() {
  router.push({ name: "data" });
}

function goSettings() {
  router.push({ name: "settings" });
}

function handleLogout() {
  logoutAdmin();
  router.push({ name: "login" });
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.layout-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background-color: #24292f;
  color: #ffffff;
}

.layout-title {
  font-size: 18px;
  font-weight: 600;
}

.layout-actions {
  display: flex;
  gap: 8px;
}

.layout-button {
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #57606a;
  background-color: #24292f;
  color: #ffffff;
  cursor: pointer;
  font-size: 13px;
}

.layout-button:hover {
  background-color: #32383f;
}

.layout-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.layout-sider {
  width: 180px;
  background-color: #f6f8fa;
  border-right: 1px solid #d0d7de;
}

.menu {
  list-style: none;
  margin: 0;
  padding: 12px 0;
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #24292f;
}

.menu-item:hover {
  background-color: #eaeef2;
}

.menu-item.active {
  background-color: #d0ebff;
  font-weight: 600;
}

.layout-content {
  flex: 1;
  padding: 16px 20px;
  overflow: auto;
}
</style>
