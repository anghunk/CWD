<template>
  <div class="page">
    <div style="display: flex; align-items: center; gap: 20px">
      <h2 class="page-title">数据看板</h2>
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
      <h3 class="card-title">最近 30 天评论数趋势</h3>
      <div v-if="statsLoading" class="page-hint">加载中...</div>
      <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
      <div v-else class="chart-wrapper">
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
import { onMounted, onBeforeUnmount, ref, nextTick, watch } from "vue";
import * as echarts from "echarts";
import { fetchCommentStats } from "../api/admin";

type DomainStat = {
  domain: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

const DOMAIN_STORAGE_KEY = "cwd_admin_domain_filter";

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

const storedDomain =
  typeof window !== "undefined"
    ? window.localStorage.getItem(DOMAIN_STORAGE_KEY) || ""
    : "";
const domainFilter = ref(storedDomain);
const domainOptions = ref<string[]>([]);

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
    const domains = Array.isArray(res.domains)
      ? res.domains.map((item) => item.domain)
      : [];
    const set = new Set(domains);
    if (domainFilter.value && !set.has(domainFilter.value)) {
      set.add(domainFilter.value);
    }
    domainOptions.value = Array.from(set);
    last7Days.value = Array.isArray(res.last7Days) ? res.last7Days : [];
  } catch (e: any) {
    const msg = e.message || "加载统计数据失败";
    statsError.value = msg;
    showToast(msg, "error");
  } finally {
    statsLoading.value = false;
    await nextTick();
    if (!statsError.value && last7Days.value.length > 0) {
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
  const dates = last7Days.value.map((item) => item.date.slice(5));
  const values = last7Days.value.map((item) => item.total);
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

function handleResize() {
  if (chartInstance) {
    chartInstance.resize();
  }
}

onMounted(() => {
  loadStats();
  window.addEventListener("resize", handleResize);
});

watch(domainFilter, (value) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DOMAIN_STORAGE_KEY, value || "");
  }
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  font-size: 30px;
  font-weight: 600;
  color: #24292f;
}

.stats-value-approved {
  color: #1a7f37;
}

.stats-value-pending {
  color: #9a6700;
}

.stats-value-rejected {
  color: #d1242f;
}

.domain-table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.domain-table {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  min-width: 520px;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
