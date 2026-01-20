/**
 * 开发调试脚本
 */

import { CWDComments } from './index.js';

// 本地存储的 key
const STORAGE_KEY = 'cwd-dev-config';

// 默认配置
const DEFAULT_CONFIG = {
	el: '#comments',
	apiBaseUrl: 'http://localhost:8788',
	theme: 'light', // 默认 light / dark
};

let widgetInstance = null;

/**
 * 从本地存储加载配置
 */
function loadConfigFromStorage() {
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
		}
	} catch (e) {}
	return DEFAULT_CONFIG;
}

/**
 * 保存配置到本地存储
 */
function saveConfigToStorage(config) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
	} catch (e) {}
}

/**
 * 将配置填充到输入框
 */
function populateInputs(config) {
	const apiBaseUrlInput = document.getElementById('apiBaseUrl');
	const themeSelect = document.getElementById('theme');
	const avatarPrefixInput = document.getElementById('avatarPrefix');

	if (apiBaseUrlInput) apiBaseUrlInput.value = config.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl;
	if (themeSelect) themeSelect.value = config.theme || DEFAULT_CONFIG.theme;
	if (avatarPrefixInput) avatarPrefixInput.value = config.avatarPrefix || DEFAULT_CONFIG.avatarPrefix;
}

/**
 * 从输入框获取当前配置
 */
function getConfigFromInputs() {
	const apiBaseUrl = document.getElementById('apiBaseUrl')?.value || DEFAULT_CONFIG.apiBaseUrl;
	const theme = document.getElementById('theme')?.value || DEFAULT_CONFIG.theme;
	return { apiBaseUrl, theme };
}

/**
 * 初始化 widget
 */
async function initWidget() {
	const config = getConfigFromInputs();

	// 保存到本地存储
	saveConfigToStorage(config);

	// 如果已存在实例，先卸载
	if (widgetInstance) {
		widgetInstance.unmount();
		widgetInstance = null;
	}

	// 清空容器
	const container = document.getElementById('comments');
	if (container) {
		container.innerHTML = '';
	}

	// 创建新实例
	try {
		widgetInstance = new CWDComments({
			el: '#comments',
			apiBaseUrl: config.apiBaseUrl,
			theme: config.theme,
			pageSize: 20,
		});
		widgetInstance.mount();
	} catch (error) {}
}

/**
 * 切换主题
 */
function toggleTheme() {
	if (!widgetInstance) {
		return;
	}

	const currentConfig = widgetInstance.getConfig();
	const newTheme = currentConfig.theme === 'light' ? 'dark' : 'light';
	widgetInstance.updateConfig({ theme: newTheme });

	// 更新下拉框
	const themeSelect = document.getElementById('theme');
	if (themeSelect) {
		themeSelect.value = newTheme;
	}

	// 保存到本地存储
	const config = getConfigFromInputs();
	config.theme = newTheme;
	saveConfigToStorage(config);
}

/**
 * 清除本地存储的配置
 */
function clearConfig() {
	try {
		localStorage.removeItem(STORAGE_KEY);
		populateInputs(DEFAULT_CONFIG);
	} catch (e) {}
}

// 将函数挂载到 window 对象，使其在 HTML 中可访问
window.initWidget = initWidget;
window.toggleTheme = toggleTheme;
window.clearConfig = clearConfig;

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', () => {
	// 从本地存储加载配置并填充到输入框
	const savedConfig = loadConfigFromStorage();
	populateInputs(savedConfig);

	// 初始化 widget
	initWidget();
});

// 监听输入框变化，实时保存
document.addEventListener('DOMContentLoaded', () => {
	const inputs = ['apiBaseUrl', 'theme'];
	inputs.forEach((id) => {
		const element = document.getElementById(id);
		if (element) {
			element.addEventListener('change', () => {
				const config = getConfigFromInputs();
				saveConfigToStorage(config);
			});
		}
	});
});

// 导出类型（用于调试）
window.CWDComments = CWDComments;
