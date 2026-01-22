<template>
  <div class="layout">
    <header class="layout-header">
      <button
        class="layout-menu-toggle"
        @click="toggleSider"
        aria-label="切换菜单"
        type="button"
      >
        <svg class="layout-menu-icon" viewBox="0 0 24 24" width="18" height="18">
          <path
            d="M4 7h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2zm0 6h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2zm0 6h16a1 1 0 0 0 0-2H4a1 1 0 0 0 0 2z"
            fill="currentColor"
          />
        </svg>
      </button>
      <div class="layout-title">CWD 评论后台</div>
      <div class="layout-actions-wrapper">
        <div class="layout-actions">
          <a class="layout-button" href="https://cwd.js.org" target="_blank">
            使用文档
          </a>
          <a class="layout-button" href="https://github.com/anghunk/cwd" target="_blank">
            Github
          </a>
          <button class="layout-button" @click="handleLogout">退出</button>
        </div>
        <button
          class="layout-actions-toggle"
          @click="toggleActions"
          aria-label="更多操作"
          type="button"
        >
          <svg class="layout-actions-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M12 5.5a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zm0 8a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zm0 8a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5z"
              fill="currentColor"
            />
          </svg>
        </button>
        <div v-if="isActionsOpen" class="layout-actions-dropdown">
          <button class="layout-actions-item" type="button" @click="openDocs">
            使用文档
          </button>
          <button class="layout-actions-item" type="button" @click="openGithub">
            Github
          </button>
          <button
            class="layout-actions-item layout-actions-item-danger"
            type="button"
            @click="handleLogoutFromActions"
          >
            退出
          </button>
        </div>
      </div>
    </header>
    <div class="layout-body">
      <nav
        class="layout-sider"
        :class="{ 'layout-sider-mobile-open': isMobileSiderOpen }"
      >
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
            :class="{ active: isRouteActive('stats') }"
            @click="goStats"
          >
            数据看板
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('analytics') }"
            @click="goAnalytics"
          >
            访问统计
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('settings') }"
            @click="goSettings"
          >
            网站设置
          </li>
          <li
            class="menu-item"
            :class="{ active: isRouteActive('data') }"
            @click="goData"
          >
            数据管理
          </li>
        </ul>
      </nav>
      <div v-if="isMobileSiderOpen" class="layout-sider-mask" @click="closeSider" />
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { logoutAdmin } from "../api/admin";

const router = useRouter();
const route = useRoute();

const isMobileSiderOpen = ref(false);
const isActionsOpen = ref(false);

function isRouteActive(name: string) {
  return route.name === name;
}

function closeSider() {
  isMobileSiderOpen.value = false;
}

function toggleSider() {
  isMobileSiderOpen.value = !isMobileSiderOpen.value;
}

function toggleActions() {
  isActionsOpen.value = !isActionsOpen.value;
}

function closeActions() {
  isActionsOpen.value = false;
}

function goComments() {
  router.push({ name: "comments" });
  closeSider();
}

function goStats() {
  router.push({ name: "stats" });
  closeSider();
}

function goAnalytics() {
  router.push({ name: "analytics" });
  closeSider();
}

function goData() {
  router.push({ name: "data" });
  closeSider();
}

function goSettings() {
  router.push({ name: "settings" });
  closeSider();
}

function openDocs() {
  window.open("https://cwd.js.org", "_blank");
  closeActions();
}

function openGithub() {
  window.open("https://github.com/anghunk/cwd", "_blank");
  closeActions();
}

function handleLogout() {
  logoutAdmin();
  router.push({ name: "login" });
  closeSider();
}

function handleLogoutFromActions() {
  closeActions();
  handleLogout();
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

.layout-actions-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
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

.layout-actions-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #57606a;
  background-color: #24292f;
  color: #ffffff;
  cursor: pointer;
}

.layout-actions-dropdown {
  display: none;
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
  font-size: 15px;
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
  padding: 16px 20px 40px;
  overflow: auto;
}

.layout-menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #57606a;
  background-color: #24292f;
  color: #ffffff;
  cursor: pointer;
  font-size: 13px;
}

.layout-sider-mask {
  display: none;
}

@media (max-width: 768px) {
  .layout {
    height: 100vh;
  }

  .layout-header {
    padding: 0 12px;
    gap: 8px;
  }

  .layout-title {
    font-size: 16px;
  }

  .layout-body {
    position: relative;
  }

  .layout-menu-toggle {
    display: inline-flex;
  }

  .layout-sider {
    position: fixed;
    top: 56px;
    left: 0;
    bottom: 0;
    width: 220px;
    max-width: 80%;
    border-right: 1px solid #d0d7de;
    transform: translateX(-100%);
    transition: transform 0.2s ease-out;
    z-index: 1000;
  }

  .layout-sider-mobile-open {
    transform: translateX(0);
  }

  .layout-sider-mask {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 900;
    display: block;
  }

  .layout-content {
    padding: 12px;
  }

  .layout-actions {
    display: none;
  }

  .layout-actions-toggle {
    display: inline-flex;
  }

  .layout-actions-dropdown {
    position: fixed;
    top: 56px;
    right: 12px;
    background-color: #ffffff;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(140, 149, 159, 0.3);
    padding: 6px 0;
    min-width: 160px;
    z-index: 1100;
    display: flex;
    flex-direction: column;
  }

  .layout-actions-item {
    padding: 8px 14px;
    font-size: 13px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    color: #24292f;
    width: 100%;
  }

  .layout-actions-item:hover {
    background-color: #f6f8fa;
  }

  .layout-actions-item-danger {
    color: #d1242f;
  }

  .layout-actions-item-danger:hover {
    background-color: #ffebe9;
  }
}
</style>
