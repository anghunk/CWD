/**
 * CWDComments 主类
 * 使用 Shadow DOM 隔离样式
 */

import { createApiClient } from './api.js';
import { createCommentStore } from './store.js';
import { CommentForm } from '@/components/CommentForm.js';
import { CommentList } from '@/components/CommentList.js';
import styles from '@/styles/main.css?inline';

/**
 * CWDComments 评论组件主类
 */
export class CWDComments {
	/**
	 * @param {Object} config - 配置对象
	 * @param {string|HTMLElement} config.el - 挂载元素选择器或 DOM 元素
	 * @param {string} config.apiBaseUrl - API 基础地址
	 * @param {'light'|'dark'} [config.theme] - 主题（可选）
	 * @param {number} [config.pageSize] - 每页评论数（可选，默认 20）
	 *
	 * 以下字段由组件自动推导或从后端读取，无需通过 config 传入：
	 * - postSlug：window.location.origin + window.location.pathname
	 * - postTitle：document.title 或 postSlug
	 * - postUrl：window.location.href
	 * - avatarPrefix/adminEmail/adminBadge：通过 /api/config/comments 接口获取
	 */
	constructor(config) {
		this.config = { ...config };
		if (typeof window !== 'undefined') {
			this.config.postSlug = window.location.origin + window.location.pathname;
		}
		if (typeof document !== 'undefined') {
			this.config.postTitle = document.title || this.config.postSlug;
		}
		if (typeof window !== 'undefined') {
			this.config.postUrl = window.location.href;
		}
		this.hostElement = this._resolveElement(config.el);
		this.shadowRoot = null;
		this.mountPoint = null;
		this.commentForm = null;
		this.commentList = null;
		this.store = null;
		this.unsubscribe = null;

		// 初始加载标志
		this._mounted = false;
	}

	/**
	 * 解析挂载元素
	 * @private
	 */
	_resolveElement(el) {
		if (typeof el === 'string') {
			const element = document.querySelector(el);
			if (!element) {
				throw new Error(`元素未找到: ${el}`);
			}
			if (!(element instanceof HTMLElement)) {
				throw new Error(`目标不是 HTMLElement: ${el}`);
			}
			return element;
		}
		return el;
	}

	async _loadServerConfig() {
		try {
			const base = this.config.apiBaseUrl;
			if (!base) {
				return {};
			}
			const apiBaseUrl = base.replace(/\/$/, '');
			const res = await fetch(`${apiBaseUrl}/api/config/comments`);
			if (!res.ok) {
				return {};
			}
			const data = await res.json();
			return {
				adminEmail: data.adminEmail || '',
				adminBadge: data.adminBadge || '',
				adminEnabled: !!data.adminEnabled,
				avatarPrefix: data.avatarPrefix || '',
			};
		} catch (e) {
			return {};
		}
	}

	/**
	 * 挂载组件
	 */
	mount() {
		if (this._mounted) {
			return;
		}

		// 创建 Shadow DOM
		this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });

		// 注入样式
		const styleElement = document.createElement('style');
		if (typeof styles === 'string') {
			styleElement.textContent = styles;
		} else if (styles && typeof styles === 'object' && 'default' in styles) {
			styleElement.textContent = styles.default;
		}
		this.shadowRoot.appendChild(styleElement);

		// 创建容器
		this.mountPoint = document.createElement('div');
		this.mountPoint.className = 'cwd-comments-container';
		this.shadowRoot.appendChild(this.mountPoint);

		// 设置主题
		if (this.config.theme) {
			this.mountPoint.setAttribute('data-theme', this.config.theme);
		}

		(async () => {
			const serverConfig = await this._loadServerConfig();
			if (!this._mounted) {
				return;
			}
			if (serverConfig.avatarPrefix) {
				this.config.avatarPrefix = serverConfig.avatarPrefix;
			}
			if (serverConfig.adminEnabled && serverConfig.adminEmail) {
				this.config.adminEmail = serverConfig.adminEmail;
			}
			if (serverConfig.adminEnabled && serverConfig.adminBadge) {
				this.config.adminBadge = serverConfig.adminBadge;
			}

			const api = createApiClient(this.config);
			this.store = createCommentStore(this.config, api.fetchComments.bind(api), api.submitComment.bind(api));

			this.unsubscribe = this.store.store.subscribe((state) => {
				this._onStateChange(state);
			});

			this._render();
			this.store.loadComments();
		})();

		this._mounted = true;
	}

	/**
	 * 卸载组件
	 */
	unmount() {
		if (!this._mounted) {
			return;
		}

		// 销毁组件
		if (this.commentForm) {
			this.commentForm.destroy();
			this.commentForm = null;
		}

		if (this.commentList) {
			this.commentList.destroy();
			this.commentList = null;
		}

		// 取消订阅
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}

		// 移除 Shadow DOM - 通过替换所有子节点
		if (this.hostElement) {
			// Shadow DOM 会在清空子节点时自动移除
			while (this.hostElement.firstChild) {
				this.hostElement.removeChild(this.hostElement.firstChild);
			}
		}

		this.shadowRoot = null;
		this.mountPoint = null;
		this.store = null;
		this._mounted = false;
	}

	/**
	 * 渲染组件
	 * @private
	 */
	_render() {
		if (!this.mountPoint) {
			return;
		}

		const state = this.store.store.getState();

		// 创建评论表单
		if (!this.commentForm) {
			this.commentForm = new CommentForm(this.mountPoint, {
				form: state.form,
				formErrors: state.formErrors,
				submitting: state.submitting,
				onSubmit: () => this._handleSubmit(),
				onFieldChange: (field, value) => this.store.updateFormField(field, value),
			});
			this.commentForm.render();
		}

		// 创建错误提示
		const existingError = this.mountPoint.querySelector('.cwd-error-inline');
		if (state.error) {
			if (!existingError) {
				const errorEl = document.createElement('div');
				errorEl.className = 'cwd-error-inline';
				errorEl.innerHTML = `
          <span>${state.error}</span>
          <button type="button" class="cwd-error-close" data-action="clear-error">✕</button>
        `;
				errorEl.querySelector('[data-action="clear-error"]').addEventListener('click', () => {
					this.store.clearError();
				});
				this.mountPoint.insertBefore(errorEl, this.mountPoint.firstChild);
			}
		} else if (existingError) {
			existingError.remove();
		}

		// 创建头部统计
		let header = this.mountPoint.querySelector('.cwd-comments-header');
		if (!header) {
			header = document.createElement('div');
			header.className = 'cwd-comments-header';
			header.innerHTML = `
        <h3 class="cwd-comments-count">
          共 <span class="cwd-comments-count-number">0</span> 条评论
        </h3>
      `;
			this.mountPoint.appendChild(header);
		}
		const countEl = header.querySelector('.cwd-comments-count-number');
		if (countEl) {
			countEl.textContent = state.pagination.totalCount;
		}

		// 创建评论列表
		if (!this.commentList) {
			const listContainer = document.createElement('div');
			this.mountPoint.appendChild(listContainer);

			this.commentList = new CommentList(listContainer, {
				comments: state.comments,
				loading: state.loading,
				error: null,
				currentPage: state.pagination.page,
				totalPages: this.store.getTotalPages(),
				replyingTo: state.replyingTo,
				replyContent: state.replyContent,
				replyError: state.replyError,
				submitting: state.submitting,
				adminEmail: this.config.adminEmail,
				adminBadge: this.config.adminBadge || '博主',
				onRetry: () => this.store.loadComments(),
				onReply: (commentId) => this.store.startReply(commentId),
				onSubmitReply: (commentId) => this.store.submitReply(commentId),
				onCancelReply: () => this.store.cancelReply(),
				onUpdateReplyContent: (content) => this.store.updateReplyContent(content),
				onClearReplyError: () => this.store.clearReplyError(),
				onPrevPage: () => this.store.goToPage(state.pagination.page - 1),
				onNextPage: () => this.store.goToPage(state.pagination.page + 1),
				onGoToPage: (page) => this.store.goToPage(page),
			});
			this.commentList.render();
		}
	}

	/**
	 * 状态变化处理
	 * @private
	 */
	_onStateChange(state, prevState) {
		if (!this._mounted) {
			return;
		}

		// 根据回复状态显示/隐藏主评论表单
		if (this.commentForm?.elements?.root) {
			const formRoot = this.commentForm.elements.root;
			if (state.replyingTo !== null) {
				formRoot.style.display = 'none';
			} else {
				formRoot.style.display = '';
			}
		}

		// 更新评论表单
		if (this.commentForm) {
			this.commentForm.setProps({
				form: state.form,
				formErrors: state.formErrors,
				submitting: state.submitting,
			});
		}

		// 更新错误提示
		const existingError = this.mountPoint?.querySelector('.cwd-error-inline');
		if (state.error) {
			if (!existingError) {
				const errorEl = document.createElement('div');
				errorEl.className = 'cwd-error-inline';
				errorEl.innerHTML = `
          <span>${state.error}</span>
          <button type="button" class="cwd-error-close" data-action="clear-error">✕</button>
        `;
				errorEl.querySelector('[data-action="clear-error"]').addEventListener('click', () => {
					this.store.clearError();
				});
				this.mountPoint?.insertBefore(errorEl, this.mountPoint.firstChild);
			}
		} else if (existingError) {
			existingError.remove();
		}

		// 更新头部统计
		const header = this.mountPoint?.querySelector('.cwd-comments-header');
		const countEl = header?.querySelector('.cwd-comments-count-number');
		if (countEl) {
			countEl.textContent = state.pagination.totalCount;
		}

		// 更新评论列表
		if (this.commentList) {
			this.commentList.setProps({
				comments: state.comments,
				loading: state.loading,
				currentPage: state.pagination.page,
				totalPages: this.store.getTotalPages(),
				replyingTo: state.replyingTo,
				replyContent: state.replyContent,
				replyError: state.replyError,
				submitting: state.submitting,
			});
		}
	}

	/**
	 * 处理评论提交
	 * @private
	 */
	async _handleSubmit() {
		const success = await this.store.submitNewComment();
		if (success) {
			// 表单内容已在 store 中清空
			// 更新表单组件
			if (this.commentForm) {
				this.commentForm.state.localForm = { ...this.store.store.getState().form };
			}
		}
	}

	/**
	 * 更新配置
	 * @param {Object} newConfig - 新配置
	 */
	updateConfig(newConfig) {
		const prevConfig = { ...this.config };

		Object.assign(this.config, newConfig);
		if (typeof window !== 'undefined') {
			this.config.postSlug = window.location.origin + window.location.pathname;
		}
		if (typeof document !== 'undefined') {
			this.config.postTitle = document.title || this.config.postSlug;
		}
		if (typeof window !== 'undefined') {
			this.config.postUrl = window.location.href;
		}

		// 更新主题
		if (newConfig.theme && this.mountPoint) {
			this.mountPoint.setAttribute('data-theme', newConfig.theme);
		}

		const shouldReload =
			this.config.apiBaseUrl !== prevConfig.apiBaseUrl ||
			this.config.pageSize !== prevConfig.pageSize ||
			this.config.postSlug !== prevConfig.postSlug;

		if (shouldReload) {
			const api = createApiClient(this.config);

			if (this.unsubscribe) {
				this.unsubscribe();
			}

			this.store = createCommentStore(this.config, api.fetchComments.bind(api), api.submitComment.bind(api));

			this.unsubscribe = this.store.store.subscribe((state) => {
				this._onStateChange(state);
			});

			this.store.loadComments();
		}
	}

	/**
	 * 获取当前配置
	 * @returns {Object}
	 */
	getConfig() {
		return { ...this.config };
	}
}
