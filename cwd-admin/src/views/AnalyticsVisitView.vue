<template>
  <div class="page">
    <div style="display: flex; align-items: center; gap: 20px">
      <h2 class="page-title">访问统计</h2>
      <div class="toolbar">
        <div class="toolbar-left">
          <select v-model="domainFilter" class="toolbar-select">
            <option value="">全部域名</option>
            <option v-for="item in domainOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
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
            <div class="stats-label">有访问记录的页面数</div>
            <div class="stats-value">{{ overview.totalPages }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">最近 30 天访问趋势</h3>
      <div v-if="loading" class="page-hint">加载中...</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div v-else class="chart-wrapper">
        <div ref="chartEl" class="chart"></div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">页面访问明细（按 PV 排序）</h3>
      <div v-if="loading" class="page-hint">加载中...</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div v-else-if="items.length === 0" class="page-hint">暂无访问数据</div>
      <div v-else class="domain-table">
        <div class="domain-table-header">
          <div class="domain-cell domain-cell-domain">页面标题</div>
          <div class="domain-cell">访问量</div>
          <div class="domain-cell">最后访问时间</div>
          <div class="domain-cell">页面地址</div>
        </div>
        <div v-for="item in items" :key="item.postSlug" class="domain-table-row">
          <div class="domain-cell domain-cell-domain">
            {{ item.postTitle || item.postSlug }}
          </div>
          <div class="domain-cell">
            {{ item.pv }}
          </div>
          <div class="domain-cell">
            {{ formatTime(item.lastVisitAt) }}
          </div>
          <div class="domain-cell">
            <a v-if="item.postUrl" :href="item.postUrl" target="_blank" rel="noreferrer">
              {{ item.postUrl }}
            </a>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick, watch } from "vue";
import * as echarts from "echarts";
import {
  fetchVisitOverview,
  fetchVisitPages,
  type VisitOverviewResponse,
  type VisitPageItem,
} from "../api/admin";

const DOMAIN_STORAGE_KEY = "cwd_admin_domain_filter";

const loading = ref(false);
const error = ref("");
const overview = ref<VisitOverviewResponse>({
  totalPv: 0,
  totalPages: 0,
  last30Days: [],
});
const items = ref<VisitPageItem[]>([]);

const storedDomain =
  typeof window !== "undefined"
    ? window.localStorage.getItem(DOMAIN_STORAGE_KEY) || ""
    : "";
const domainFilter = ref(storedDomain);
const domainOptions = ref<string[]>([]);
const last30Days = ref<{ date: string; total: number }[]>([]);

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

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const domain = domainFilter.value || undefined;
    const [overviewRes, pagesRes] = await Promise.all([
      fetchVisitOverview(domain),
      fetchVisitPages(domain),
    ]);
    overview.value = {
      totalPv: overviewRes.totalPv,
      totalPages: overviewRes.totalPages,
      last30Days: Array.isArray(overviewRes.last30Days)
        ? overviewRes.last30Days
        : [],
    };
    items.value = pagesRes.items || [];
    last30Days.value = Array.isArray(overviewRes.last30Days)
      ? overviewRes.last30Days
      : [];

    const domains = new Set<string>();
    for (const item of items.value) {
      const domainFromUrl =
        extractDomain(item.postUrl) || extractDomain(item.postSlug);
      if (domainFromUrl) {
        domains.add(domainFromUrl);
      }
    }
    const options = Array.from(domains);
    if (domainFilter.value && !options.includes(domainFilter.value)) {
      options.unshift(domainFilter.value);
    }
    domainOptions.value = options;
  } catch (e: any) {
    const msg = e.message || "加载访问统计数据失败";
    error.value = msg;
    showToast(msg, "error");
  } finally {
    loading.value = false;
    await nextTick();
    if (!error.value && last30Days.value.length > 0) {
      renderChart();
    } else if (chartInstance) {
      chartInstance.clear();
    }
  }
}

function renderChart() {
  const el = chartEl.value;
  if (!el) {
    return;
  }
  if (!chartInstance) {
    chartInstance = echarts.init(el);
  }
  const dates = last30Days.value.map((item) => item.date.slice(5));
  const values = last30Days.value.map((item) => item.total);
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
        symbolSize: 6,
      },
    ],
  };
  chartInstance.setOption(option);
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize();
  }
}

onMounted(() => {
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

watch(
  domainFilter,
  (value) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DOMAIN_STORAGE_KEY, value || "");
    }
    loadData();
  }
);
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
  border: 1px solid #d0d7de;
  border-radius: 4px;
  background-color: #ffffff;
}

.card {
  background-color: #ffffff;
  border-radius: 6px;
  border: 1px solid #d0d7de;
  padding: 16px 18px;
}

.card-title {
  margin: 0 0 12px;
  font-size: 16px;
}

.page-hint {
  font-size: 14px;
  color: #57606a;
}

.page-error {
  font-size: 14px;
  color: #d1242f;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stats-item {
  padding: 10px 12px;
  border-radius: 6px;
  background-color: #f6f8fa;
  border: 1px solid #d0d7de;
}

.stats-label {
  font-size: 14px;
  color: #57606a;
  margin-bottom: 4px;
}

.stats-value {
  font-size: 26px;
  font-weight: 600;
  color: #24292f;
}

.domain-table {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
}

.domain-table-header {
  display: flex;
  background-color: #f6f8fa;
}

.domain-table-row {
  display: flex;
  border-top: 1px solid #eaeae0;
}

.domain-cell {
  flex: 1;
  padding: 10px 10px;
  font-size: 14px;
  color: #24292f;
  box-sizing: border-box;
}

.domain-cell a {
  color: #57606a;
}

.domain-cell-domain {
  flex: 2;
  font-weight: 500;
}

.chart-wrapper {
  margin-top: 4px;
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
