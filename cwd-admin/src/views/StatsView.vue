<template>
  <div class="page">
    <div style="display: flex; align-items: center; gap: 20px">
      <h2 class="page-title">数据看板</h2>
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
      <div v-if="statsLoading" class="page-hint">加载中...</div>
      <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
      <div v-else>
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-label">总评论数</div>
            <div class="stats-value">{{ statsSummary.total }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">已通过</div>
            <div class="stats-value stats-value-approved">
              {{ statsSummary.approved }}
            </div>
          </div>
          <div class="stats-item">
            <div class="stats-label">待审核</div>
            <div class="stats-value stats-value-pending">{{ statsSummary.pending }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">已拒绝</div>
            <div class="stats-value stats-value-rejected">
              {{ statsSummary.rejected }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">评论数趋势</h3>
        <div class="chart-tabs">
          <button
            class="chart-tab"
            :class="{ 'chart-tab-active': chartRange === '7' }"
            type="button"
            @click="changeChartRange('7')"
          >
            最近 7 天
          </button>
          <button
            class="chart-tab"
            :class="{ 'chart-tab-active': chartRange === '30' }"
            type="button"
            @click="changeChartRange('30')"
          >
            最近 30 天
          </button>
        </div>
      </div>
      <div v-if="statsLoading" class="page-hint">加载中...</div>
      <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
      <div class="chart-wrapper">
        <div ref="chartEl" class="chart"></div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">按域名统计</h3>
      <div v-if="statsLoading" class="page-hint">加载中...</div>
      <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
      <div v-else-if="domainStats.length === 0" class="page-hint">暂无评论数据</div>
      <div v-else class="domain-table-wrapper">
        <div class="domain-table">
          <div class="domain-table-header">
            <div class="domain-cell domain-cell-domain">域名</div>
            <div class="domain-cell">总数</div>
            <div class="domain-cell">已通过</div>
            <div class="domain-cell">待审核</div>
            <div class="domain-cell">已拒绝</div>
          </div>
          <div
            v-for="item in domainStats"
            :key="item.domain"
            class="domain-table-row"
          >
            <div class="domain-cell domain-cell-domain">{{ item.domain }}</div>
            <div class="domain-cell">{{ item.total }}</div>
            <div class="domain-cell">{{ item.approved }}</div>
            <div class="domain-cell">{{ item.pending }}</div>
            <div class="domain-cell">{{ item.rejected }}</div>
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
import { fetchCommentStats } from "../api/admin";

type DomainStat = {
  domain: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

const statsLoading = ref(false);
const statsError = ref("");
const statsSummary = ref({
  total: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
});
const domainStats = ref<DomainStat[]>([]);
const last7Days = ref<{ date: string; total: number }[]>([]);
const chartRange = ref<"7" | "30">("7");
const chartRangeStorageKey = "cwd-stats-chart-range";

const injectedDomainFilter = inject<Ref<string> | null>("domainFilter", null);
const domainFilter = injectedDomainFilter ?? ref("");

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);

const chartEl = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

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

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg;
  toastType.value = type;
  toastVisible.value = true;
  window.setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
}

async function loadStats() {
  statsLoading.value = true;
  statsError.value = "";
  try {
    const res = await fetchCommentStats(domainFilter.value || undefined);
    statsSummary.value = {
      total: res.summary.total,
      approved: res.summary.approved,
      pending: res.summary.pending,
      rejected: res.summary.rejected,
    };
    domainStats.value = res.domains;
    last7Days.value = Array.isArray(res.last7Days) ? res.last7Days : [];
  } catch (e: any) {
    const msg = e.message || "加载统计数据失败";
    statsError.value = msg;
    showToast(msg, "error");
  } finally {
    statsLoading.value = false;
    await nextTick();
    if (!statsError.value) {
      renderChart();
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
  const source = last7Days.value;
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
  loadChartRangeFromStorage();
  loadStats();
  window.addEventListener("resize", handleResize);
});

watch(domainFilter, () => {
  loadStats();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
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

.chart-tabs {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.chart-tab {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  background-color: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
}

.chart-tab + .chart-tab {
  border-left: 1px solid var(--border-color);
}

.chart-tab-active {
  background-color: var(--primary-color);
  color: var(--text-inverse);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  font-size: 30px;
  font-weight: 600;
  color: var(--text-primary);
}

.stats-value-approved {
  color: var(--color-success);
}

.stats-value-pending {
  color: var(--color-warning);
}

.stats-value-rejected {
  color: var(--color-danger);
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
