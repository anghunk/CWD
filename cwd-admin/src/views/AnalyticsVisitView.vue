<template>
  <div class="page">
    <div style="display: flex; align-items: center; gap: 20px">
      <h2 class="page-title">访问统计</h2>
    </div>
    <div
      v-if="toastVisible"
      class="toast"
      :class="toastType === 'error' ? 'toast-error' : 'toast-success'"
    >
      {{ toastMessage }}
    </div>

    <div class="card">
      <h3 class="card-title">整体概览</h3>
      <div v-if="loading" class="page-hint">加载中...</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div v-else>
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-label">全站总访问量</div>
            <div class="stats-value">{{ overview.totalPv }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">今日访问量</div>
            <div class="stats-value">{{ overview.todayPv }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">本周访问量</div>
            <div class="stats-value">{{ overview.weekPv }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">本月访问量</div>
            <div class="stats-value">{{ overview.monthPv }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">有访问记录的页面数</div>
            <div class="stats-value">{{ overview.totalPages }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">访问趋势</h3>
        <div class="visit-tabs">
          <button
            class="visit-tab"
            :class="{ 'visit-tab-active': chartRange === '7' }"
            type="button"
            @click="changeChartRange('7')"
          >
            最近 7 天
          </button>
          <button
            class="visit-tab"
            :class="{ 'visit-tab-active': chartRange === '30' }"
            type="button"
            @click="changeChartRange('30')"
          >
            最近 30 天
          </button>
        </div>
      </div>
      <div v-if="loading" class="page-hint">加载中...</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div class="chart-wrapper">
        <div ref="chartEl" class="chart"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">页面访问明细</h3>
        <div class="visit-tabs">
          <button
            class="visit-tab"
            :class="{ 'visit-tab-active': visitTab === 'pv' }"
            type="button"
            @click="changeVisitTab('pv')"
          >
            按 PV 排序
          </button>
          <button
            class="visit-tab"
            :class="{ 'visit-tab-active': visitTab === 'latest' }"
            type="button"
            @click="changeVisitTab('latest')"
          >
            最新访问
          </button>
        </div>
      </div>
      <div v-if="listLoading" class="page-hint">加载中...</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div v-else-if="items.length === 0" class="page-hint">暂无访问数据</div>
      <div v-else class="domain-table-wrapper">
        <div class="domain-table">
          <div class="domain-table-header">
            <div class="domain-cell domain-cell-title">页面标题</div>
            <div class="domain-cell domain-cell-pv">访问量</div>
            <div class="domain-cell domain-cell-time">最后访问时间</div>
            <div class="domain-cell domain-cell-url">页面地址</div>
          </div>
          <div v-for="item in items" :key="item.postSlug" class="domain-table-row">
            <div class="domain-cell domain-cell-title">
              {{ item.postTitle || item.postSlug }}
            </div>
            <div class="domain-cell domain-cell-pv">
              {{ item.pv }}
            </div>
            <div class="domain-cell domain-cell-time">
              {{ formatTime(item.lastVisitAt) }}
            </div>
            <div class="domain-cell domain-cell-url">
              <a
                v-if="item.postSlug"
                :href="item.postSlug"
                target="_blank"
                rel="noreferrer"
              >
                {{ item.postSlug }}
              </a>
              <span v-else>-</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">点赞页面排行榜</h3>
      <div v-if="loading" class="page-hint">加载中...</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div v-else-if="likeStatsItems.length === 0" class="page-hint">暂无点赞数据</div>
      <div v-else class="domain-table-wrapper">
        <div class="domain-table">
          <div class="domain-table-header">
            <div class="domain-cell domain-cell-rank">排名</div>
            <div class="domain-cell domain-cell-title">页面标题</div>
            <div class="domain-cell domain-cell-like">点赞数</div>
            <div class="domain-cell domain-cell-url">页面地址</div>
          </div>
          <div
            v-for="(item, index) in likeStatsItems"
            :key="item.pageSlug"
            class="domain-table-row"
          >
            <div class="domain-cell domain-cell-rank">
              {{ index + 1 }}
            </div>
            <div class="domain-cell domain-cell-title">
              {{ item.pageTitle || item.pageSlug }}
            </div>
            <div class="domain-cell domain-cell-like">
              {{ item.likes }}
            </div>
            <div class="domain-cell domain-cell-url">
              <a
                v-if="item.pageSlug"
                :href="item.pageSlug"
                target="_blank"
                rel="noreferrer"
              >
                {{ item.pageSlug }}
              </a>
              <span v-else>-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick, watch, inject } from "vue";
import type { Ref } from "vue";
import * as echarts from "echarts";
import {
  fetchVisitOverview,
  fetchVisitPages,
  type VisitOverviewResponse,
  type VisitPageItem,
  fetchLikeStats,
  type LikeStatsItem,
} from "../api/admin";

const loading = ref(false);
const listLoading = ref(false);
const error = ref("");
const overview = ref<VisitOverviewResponse>({
  totalPv: 0,
  totalPages: 0,
  todayPv: 0,
  weekPv: 0,
  monthPv: 0,
  last30Days: [],
});

const items = ref<VisitPageItem[]>([]);
const visitTab = ref<"pv" | "latest">("pv");
const visitTabStorageKey = "cwd-analytics-visit-tab";
const chartRangeStorageKey = "cwd-analytics-visit-chart-range";

const injectedDomainFilter = inject<Ref<string> | null>("domainFilter", null);
const domainFilter = injectedDomainFilter ?? ref("");
const last30Days = ref<{ date: string; total: number }[]>([]);
const likeStatsItems = ref<LikeStatsItem[]>([]);
const chartRange = ref<"7" | "30">("7");

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);

const chartEl = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  window.setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
}

function formatTime(value: string | number | null | undefined): string {
  if (!value) {
    return "-";
  }
  let date: Date;
  if (typeof value === "number") {
    date = new Date(value);
  } else {
    const trimmed = value.trim();
    if (!trimmed) {
      return "-";
    }
    if (/^\d+$/.test(trimmed)) {
      const ts = Number(trimmed);
      date = new Date(ts);
    } else {
      date = new Date(trimmed);
    }
  }
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${mm}`;
}

function extractDomain(source: string | null | undefined): string | null {
  if (!source) {
    return null;
  }
  const value = source.trim();
  if (!value) {
    return null;
  }
  if (!/^https?:\/\//i.test(value)) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function getVisitOrderParam(): "pv" | "latest" | undefined {
  if (visitTab.value === "latest") {
    return "latest";
  }
  return undefined;
}

function filterLikeStatsByDomain(list: LikeStatsItem[], domain: string | undefined): LikeStatsItem[] {
  if (!domain) {
    return list;
  }
  return list.filter((item) => {
    const source = item.pageUrl || item.pageSlug;
    const d = extractDomain(source);
    if (!d) {
      return false;
    }
    return d === domain;
  });
}

function loadVisitTabFromStorage() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const value = window.localStorage.getItem(visitTabStorageKey);
    if (value === "pv" || value === "latest") {
      visitTab.value = value;
    }
  } catch {
  }
}

function saveVisitTabToStorage(value: "pv" | "latest") {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(visitTabStorageKey, value);
  } catch {
  }
}

function loadChartRangeFromStorage() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const value = window.localStorage.getItem(chartRangeStorageKey);
    if (value === "7" || value === "30") {
      chartRange.value = value;
    }
  } catch {
  }
}

function saveChartRangeToStorage(value: "7" | "30") {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(chartRangeStorageKey, value);
  } catch {
  }
}

async function loadData() {
  loading.value = true;
  listLoading.value = true;
  error.value = "";
  try {
    const domain = domainFilter.value || undefined;
    const order = getVisitOrderParam();
    const [overviewRes, pagesRes, likeStatsRes] = await Promise.all([
      fetchVisitOverview(domain),
      fetchVisitPages(domain, order),
      fetchLikeStats(),
    ]);
    overview.value = {
      totalPv: overviewRes.totalPv,
      totalPages: overviewRes.totalPages,
      todayPv: overviewRes.todayPv ?? 0,
      weekPv: overviewRes.weekPv ?? 0,
      monthPv: overviewRes.monthPv ?? 0,
      last30Days: Array.isArray(overviewRes.last30Days)
        ? overviewRes.last30Days
        : [],
    };
    const likeItemsRaw = Array.isArray(likeStatsRes.items) ? likeStatsRes.items : [];
    likeStatsItems.value = filterLikeStatsByDomain(likeItemsRaw, domain);
    const pageItems = Array.isArray(pagesRes.items) ? pagesRes.items : [];
    items.value = pageItems;
    last30Days.value = Array.isArray(overviewRes.last30Days)
      ? overviewRes.last30Days
      : [];
  } catch (e: any) {
    const msg = e.message || "加载访问统计数据失败";
    error.value = msg;
    showToast(msg, "error");
  } finally {
    loading.value = false;
    listLoading.value = false;
    await nextTick();
    if (!error.value) {
      renderChart();
    }
  }
}

async function loadVisitPagesOnly() {
  listLoading.value = true;
  error.value = "";
  try {
    const domain = domainFilter.value || undefined;
    const order = getVisitOrderParam();
    const pagesRes = await fetchVisitPages(domain, order);
    const pageItems = Array.isArray(pagesRes.items) ? pagesRes.items : [];
    items.value = pageItems;
  } catch (e: any) {
    const msg = e.message || "加载访问统计数据失败";
    error.value = msg;
    showToast(msg, "error");
  } finally {
    listLoading.value = false;
  }
}

function changeVisitTab(tab: "pv" | "latest") {
  if (visitTab.value === tab) {
    return;
  }
  visitTab.value = tab;
  saveVisitTabToStorage(tab);
  loadVisitPagesOnly();
}

function renderChart() {
  const el = chartEl.value;
  if (!el) {
    return;
  }
  if (!chartInstance) {
    chartInstance = echarts.init(el);
  }
  const source = last30Days.value;
  const seriesData =
    chartRange.value === "7" ? source.slice(-7) : source;
  const dates = seriesData.map((item) => item.date.slice(5));
  const values = seriesData.map((item) => item.total);
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: 40,
      right: 16,
      top: 24,
      bottom: 32,
    },
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
    },
    series: [
      {
        type: "line",
        smooth: true,
        data: values,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(56, 189, 248, 0.80)" },
            { offset: 1, color: "rgba(56, 189, 248, 0.2)" },
          ]),
        },
        lineStyle: {
          width: 2,
          color: "#0ea5e9",
        },
        symbol: "circle",
        symbolSize: 3,
      },
    ],
  };
  chartInstance.setOption(option);
}

function changeChartRange(range: "7" | "30") {
  if (chartRange.value === range) {
    return;
  }
  chartRange.value = range;
  saveChartRangeToStorage(range);
  renderChart();
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize();
  }
}

onMounted(() => {
  loadVisitTabFromStorage();
  loadChartRangeFromStorage();
  loadData();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});

watch(domainFilter, () => {
  loadData();
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
  color: var(--text-primary);
}

.toolbar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin: 0;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-select {
  padding: 8px 8px;
  box-sizing: border-box;
  font-size: 13px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-input);
  color: var(--text-primary);
}

.card {
  background-color: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  padding: 16px 18px;
}

.card-title {
  margin: 0 0 12px;
  font-size: 16px;
  color: var(--text-primary);
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.page-hint {
  font-size: 14px;
  color: var(--text-secondary);
}

.page-error {
  font-size: 14px;
  color: var(--color-danger);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.stats-item {
  padding: 10px 12px;
  border-radius: 6px;
  background-color: var(--bg-sider);
  border: 1px solid var(--border-color);
}

.stats-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stats-value {
  font-size: 26px;
  font-weight: 600;
  color: var(--text-primary);
}

.domain-table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.domain-table {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  min-width: 520px;
  overflow: hidden;
}

.domain-table-header {
  display: flex;
  background-color: var(--bg-sider);
  color: var(--text-secondary);
}

.domain-table-row {
  display: flex;
  border-top: 1px solid var(--border-color);
}

.domain-cell {
  flex: 1;
  padding: 10px 10px;
  font-size: 14px;
  color: var(--text-primary);
  box-sizing: border-box;
}

.domain-cell a {
  color: var(--text-link);
  text-decoration: none;
}

.domain-cell a:hover {
  text-decoration: underline;
}

.domain-cell-title {
  font-weight: 500;
}

.domain-cell-pv {
  text-align: center;
}

.domain-cell-rank {
  flex: 0 0 60px;
  text-align: center;
}

.domain-cell-like {
  flex: 0 0 80px;
  text-align: center;
}

.domain-cell-like-rate {
  flex: 0 0 90px;
  text-align: center;
}

.domain-cell-time {
  flex: 0 0 170px;
}

.domain-cell-url {
  word-break: break-all;
}

@media (max-width: 768px) {
  .domain-table {
    width: 610px;
  }

  .domain-cell {
    flex: none;
  }

  .domain-cell-title {
    width: 160px;
  }

  .domain-cell-pv {
    width: 100px;
  }

  .domain-cell-rank {
    width: 60px;
  }

  .domain-cell-like {
    width: 80px;
  }

  .domain-cell-like-rate {
    width: 90px;
  }

  .domain-cell-time {
    width: 150px;
  }

  .domain-cell-url {
    width: 200px;
  }
}

.chart {
  width: 100%;
  height: 260px;
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
  box-shadow: var(--shadow-card);
  z-index: 1000;
}

.toast-success {
  background-color: var(--color-success);
  color: var(--text-inverse);
}

.toast-error {
  background-color: var(--color-danger);
  color: var(--text-inverse);
}

.visit-tabs {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.visit-tab {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  background-color: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
}

.visit-tab + .visit-tab {
  border-left: 1px solid var(--border-color);
}

.visit-tab-active {
  background-color: var(--primary-color);
  color: var(--text-inverse);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
