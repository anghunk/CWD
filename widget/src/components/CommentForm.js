/**
 * CommentForm 评论表单组件
 */

import { Component } from './Component.js';
import { AdminAuthModal } from './AdminAuthModal.js';
import { auth } from '../utils/auth.js';

export class CommentForm extends Component {
	/**
	 * @param {HTMLElement|string} container - 容器元素或选择器
	 * @param {Object} props - 组件属性
	 * @param {Object} props.form - 表单数据
	 * @param {Object} props.formErrors - 表单错误
	 * @param {boolean} props.submitting - 是否正在提交
	 * @param {Function} props.onSubmit - 提交回调
	 * @param {Function} props.onFieldChange - 字段变化回调
	 * @param {string} props.adminEmail - 管理员邮箱
	 * @param {Function} props.onVerifyAdmin - 验证管理员回调 (returns Promise)
	 */
	constructor(container, props = {}) {
		super(container, props);
		this.state = {
			localForm: { ...props.form },
		};
		this.modal = null;
	}

	render() {
		const { formErrors, submitting } = this.props;
		const { localForm } = this.state;

		const canSubmit = localForm.name.trim() && localForm.email.trim() && localForm.content.trim();
		const isAdmin = this.props.adminEmail && localForm.email.trim() === this.props.adminEmail;
		const isVerified = isAdmin && auth.hasToken();

		const root = this.createElement('form', {
			className: 'cwd-comment-form',
			attributes: {
				novalidate: true,
				onSubmit: (e) => this.handleSubmit(e),
			},
			children: [
				// 标题
				this.createTextElement('h3', '发表评论', 'cwd-form-title'),

				// 表单字段
				this.createElement('div', {
					className: 'cwd-form-fields',
					children: [
						// 第一行：昵称和邮箱
						this.createElement('div', {
							className: 'cwd-form-row',
							children: [
								// 昵称
								this.createFormField('昵称 *', 'text', 'name', localForm.name, formErrors.name),
								// 邮箱
								this.createElement('div', {
									className: 'cwd-form-field-wrapper',
									children: [
										this.createFormField('邮箱 *', 'email', 'email', localForm.email, formErrors.email),
										isVerified
											? this.createElement('div', {
													className: 'cwd-admin-controls',
													children: [
														this.createElement('button', {
															className: 'cwd-btn-text',
															text: '退出验证',
															attributes: {
																type: 'button',
																title: '清除管理员凭证',
																onClick: () => {
																	auth.clearToken();
																	this.render();
																},
															},
														}),
													],
												})
											: null,
									],
								}),
								// 网址
								this.createFormField('网址', 'url', 'url', localForm.url, formErrors.url),
							],
						}),

						// 评论内容
						this.createElement('div', {
							className: 'cwd-form-field',
							children: [
								this.createTextElement('label', '写下你的评论...', 'cwd-form-label'),
								this.createElement('textarea', {
									className: `cwd-form-textarea ${formErrors.content ? 'cwd-input-error' : ''}`,
									attributes: {
										placeholder: '',
										rows: 4,
										disabled: submitting,
										onInput: (e) => this.handleFieldChange('content', e.target.value),
									},
								}),
								...(formErrors.content ? [this.createTextElement('span', formErrors.content, 'cwd-error-text')] : []),
							],
						}),
					],
				}),

				// 操作按钮
				this.createElement('div', {
					className: 'cwd-form-actions',
					children: [
						this.createElement('button', {
							className: 'cwd-btn cwd-btn-primary',
							attributes: {
								type: 'submit',
								disabled: submitting || !canSubmit,
							},
							text: submitting ? '提交中...' : '提交评论',
						}),
					],
				}),
			],
		});

		// 设置输入框的值
		this.setInputValues(root, localForm);

		this.elements.root = root;
		this.empty(this.container);
		this.container.appendChild(root);
	}

	updateProps(prevProps) {
		// 只在非提交状态时同步表单数据（避免覆盖用户正在输入的内容）
		if (!this.props.submitting && this.props.form !== prevProps.form) {
			// 保留当前正在输入的内容
			const currentName = this.state.localForm.name || '';
			const currentEmail = this.state.localForm.email || '';
			const currentUrl = this.state.localForm.url || '';
			const currentContent = this.state.localForm.content || '';

			this.state.localForm = {
				name: this.props.form.name || currentName,
				email: this.props.form.email || currentEmail,
				url: this.props.form.url || currentUrl,
				content: this.props.form.content !== undefined ? this.props.form.content : currentContent,
			};

			// 同步更新 DOM 值（不重新渲染）
			if (this.elements.root) {
				this.setInputValues(this.elements.root, this.state.localForm);
			}
		}

		// 更新提交按钮状态和错误提示
		if (this.elements.root) {
			this.updateFormState();
		}
	}

	/**
	 * 更新表单状态（按钮、错误提示等）
	 */
	updateFormState() {
		const { formErrors, submitting } = this.props;
		const { localForm } = this.state;

		const canSubmit = localForm.name.trim() && localForm.email.trim() && localForm.content.trim();

		// 更新提交按钮状态
		const submitBtn = this.elements.root.querySelector('button[type="submit"]');
		if (submitBtn) {
			submitBtn.disabled = submitting || !canSubmit;
			submitBtn.textContent = submitting ? '提交中...' : '提交评论';
		}

		// 更新输入框禁用状态
		const inputs = this.elements.root.querySelectorAll('input, textarea');
		inputs.forEach((input) => {
			input.disabled = submitting;
		});

		// 更新错误提示
		this.updateErrors(formErrors);
	}

	/**
	 * 更新错误提示
	 */
	updateErrors(formErrors) {
		if (!this.elements.root) return;

		const nameInput = this.elements.root.querySelector('input[name="name"]');
		this.updateFieldError(nameInput, formErrors?.name);

		const emailInput = this.elements.root.querySelector('input[name="email"]');
		this.updateFieldError(emailInput, formErrors?.email);

		const urlInput = this.elements.root.querySelector('input[name="url"]');
		this.updateFieldError(urlInput, formErrors?.url);

		const contentTextarea = this.elements.root.querySelector('textarea');
		this.updateFieldError(contentTextarea, formErrors?.content);
	}

	/**
	 * 更新单个字段的错误状态
	 */
	updateFieldError(element, error) {
		if (!element) return;

		// 移除或添加错误样式
		if (error) {
			element.classList.add('cwd-input-error');
		} else {
			element.classList.remove('cwd-input-error');
		}

		// 查找并更新/移除错误提示元素
		const parent = element.parentElement;
		let errorSpan = parent.querySelector('.cwd-error-text');
		if (error) {
			if (!errorSpan) {
				errorSpan = document.createElement('span');
				errorSpan.className = 'cwd-error-text';
				parent.appendChild(errorSpan);
			}
			errorSpan.textContent = error;
		} else if (errorSpan) {
			errorSpan.remove();
		}
	}

	/**
	 * 创建表单字段
	 */
	createFormField(label, type, fieldName, value, error, placeholder = '') {
		return this.createElement('div', {
			className: 'cwd-form-field',
			children: [
				this.createTextElement('label', label, 'cwd-form-label'),
				this.createElement('input', {
					className: `cwd-form-input ${error ? 'cwd-input-error' : ''}`,
					attributes: {
						type,
						name: fieldName,
						value: value || '',
						disabled: this.props.submitting,
						onInput: (e) => this.handleFieldChange(fieldName, e.target.value),
						onBlur: (e) => {
							if (fieldName === 'email') this.handleEmailBlur(e.target.value);
						},
					},
				}),
				...(error ? [this.createTextElement('span', error, 'cwd-error-text')] : []),
			],
		});
	}

	/**
	 * 设置输入框的值
	 */
	setInputValues(root, form) {
		const nameInput = root.querySelector('input[name="name"]');
		const emailInput = root.querySelector('input[name="email"]');
		const urlInput = root.querySelector('input[name="url"]');
		const contentTextarea = root.querySelector('textarea');

		if (nameInput) nameInput.value = form.name || '';
		if (emailInput) emailInput.value = form.email || '';
		if (urlInput) urlInput.value = form.url || '';
		if (contentTextarea) contentTextarea.value = form.content || '';
	}

	handleFieldChange(field, value) {
		this.state.localForm[field] = value;
		if (this.props.onFieldChange) {
			this.props.onFieldChange(field, value);
		}
		// 实时更新按钮状态
		if (this.elements.root) {
			this.updateFormState();
		}
	}

	handleSubmit(e) {
		e.preventDefault();
		if (this.props.onSubmit) {
			// 提交当前表单数据
			this.props.onSubmit(this.state.localForm);
		}
	}

	async handleEmailBlur(email) {
		if (!email || !this.props.adminEmail) return;
		if (email.trim() === this.props.adminEmail) {
			// Check local storage
			if (auth.hasToken()) {
				// Already valid
				return;
			}
			// Show modal
			this.showAuthModal();
		}
	}

	showAuthModal() {
		// Create modal container if not exists
		let modalContainer = this.elements.root.querySelector('.cwd-modal-container');
		if (!modalContainer) {
			modalContainer = document.createElement('div');
			modalContainer.className = 'cwd-modal-container';
			this.elements.root.appendChild(modalContainer);
		}

		this.modal = new AdminAuthModal(modalContainer, {
			onCancel: () => {
				this.modal.destroy();
				this.modal = null;
			},
			onSubmit: async (key) => {
				if (this.props.onVerifyAdmin) {
					await this.props.onVerifyAdmin(key);
					auth.saveToken(key);
					this.modal.destroy();
					this.modal = null;
				}
			},
		});
		this.modal.render();
	}
}
