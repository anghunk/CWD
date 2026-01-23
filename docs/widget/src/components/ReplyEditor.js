/**
 * ReplyEditor 回复编辑器组件
 */

import { Component } from './Component.js';

export class ReplyEditor extends Component {
  /**
   * @param {HTMLElement|string} container - 容器元素或选择器
   * @param {Object} props - 组件属性
   * @param {string} props.replyToAuthor - 被回复的作者名
   * @param {string} props.content - 回复内容
   * @param {string|null} props.error - 错误信息
   * @param {boolean} props.submitting - 是否正在提交
   * @param {Function} props.onUpdate - 内容更新回调
   * @param {Function} props.onSubmit - 提交回调
   * @param {Function} props.onCancel - 取消回调
   * @param {Function} props.onClearError - 清除错误回调
   */
  constructor(container, props = {}) {
    super(container, props);
    const { currentUser } = props;
    this.state = {
      content: props.content || '',
      // 如果没有昵称或邮箱，显示用户信息输入框。且一旦显示，在当前编辑器生命周期内保持显示，避免输入过程中消失
      showUserInfo: !currentUser || !currentUser.name || !currentUser.email
    };
  }

  render() {
    const { currentUser } = this.props;
    const { showUserInfo } = this.state;

    const root = this.createElement('div', {
      className: 'cwd-reply-editor',
      children: [
        // 头部
        this.createElement('div', {
          className: 'cwd-reply-header',
          children: [
            this.createTextElement('span', `回复 @${this.props.replyToAuthor}`, 'cwd-reply-to'),
            this.createElement('button', {
              className: 'cwd-btn-close',
              attributes: {
                type: 'button',
                onClick: () => this.handleCancel()
              },
              text: '✕'
            })
          ]
        }),

        // 用户信息输入框（当缺少信息时显示）
        ...(showUserInfo ? [
          this.createElement('div', {
            className: 'cwd-form-row',
            attributes: {
              style: 'margin-bottom: 12px;'
            },
            children: [
              this.createFormField('昵称 *', 'text', 'name', currentUser?.name),
              this.createFormField('邮箱 *', 'email', 'email', currentUser?.email),
              this.createFormField('网址', 'url', 'url', currentUser?.url)
            ]
          })
        ] : []),

        // 文本框
        this.createElement('textarea', {
          className: 'cwd-reply-textarea',
          attributes: {
            rows: 3,
            placeholder: '写下你的回复...',
            disabled: this.props.submitting,
            onInput: (e) => this.handleInput(e)
          }
        }),

        // 错误提示
        ...(this.props.error ? [
          this.createElement('div', {
            className: 'cwd-error-inline cwd-error-small',
            children: [
              this.createTextElement('span', this.props.error),
              this.createElement('button', {
                className: 'cwd-error-close',
                attributes: {
                  type: 'button',
                  onClick: () => this.handleClearError()
                },
                text: '✕'
              })
            ]
          })
        ] : []),

        // 操作按钮
        this.createElement('div', {
          className: 'cwd-reply-actions',
          children: [
            this.createElement('button', {
              className: 'cwd-btn cwd-btn-primary cwd-btn-small',
              attributes: {
                type: 'button',
                disabled: this.props.submitting || !this.state.content.trim(),
                onClick: () => this.handleSubmit()
              },
              text: this.props.submitting ? '提交中...' : '提交回复'
            }),
            this.createElement('button', {
              className: 'cwd-btn cwd-btn-secondary cwd-btn-small',
              attributes: {
                type: 'button',
                disabled: this.props.submitting,
                onClick: () => this.handleCancel()
              },
              text: '取消'
            })
          ]
        })
      ]
    });

    // 设置文本框内容
    const textarea = root.querySelector('textarea');
    if (textarea) {
      textarea.value = this.state.content;
    }

    this.elements.root = root;
    this.empty(this.container);
    this.container.appendChild(root);
  }

  updateProps(prevProps) {
    // 如果外部传入的 content 变化，更新内部状态
    if (this.props.content !== this.state.content && this.props.content !== prevProps?.content) {
      this.state.content = this.props.content;
      this.render();
      return;
    }

    // 如果用户信息变化，重新渲染
    if (JSON.stringify(this.props.currentUser) !== JSON.stringify(prevProps?.currentUser)) {
      this.render();
      return;
    }

    // 如果有错误显示/隐藏变化，重新渲染
    if (this.props.error !== prevProps?.error) {
      this.render();
      return;
    }

    // 如果 submitting 状态变化，重新渲染
    if (this.props.submitting !== prevProps?.submitting) {
      this.render();
      return;
    }
  }

  handleInput(e) {
    this.state.content = e.target.value;
    // 更新提交按钮的禁用状态
    const submitBtn = this.elements.root?.querySelector('.cwd-btn-primary');
    if (submitBtn) {
      submitBtn.disabled = this.props.submitting || !this.state.content.trim();
    }
    if (this.props.onUpdate) {
      this.props.onUpdate(this.state.content);
    }
  }

  handleSubmit() {
    if (this.props.onSubmit) {
      this.props.onSubmit();
    }
  }

  handleCancel() {
    if (this.props.onCancel) {
      this.props.onCancel();
    }
  }

  handleClearError() {
    if (this.props.onClearError) {
      this.props.onClearError();
    }
  }

  /**
   * 设置内容
   * @param {string} content - 新内容
   */
  setContent(content) {
    this.state.content = content;
    const textarea = this.elements.root?.querySelector('textarea');
    if (textarea) {
      textarea.value = content;
    }
  }

  /**
   * 获取内容
   * @returns {string}
   */
  getContent() {
    return this.state.content;
  }

  /**
   * 聚焦文本框
   */
  focus() {
    const textarea = this.elements.root?.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  }

  handleUserInfoChange(field, value) {
    if (this.props.onUpdateUserInfo) {
      this.props.onUpdateUserInfo(field, value);
    }
  }

  createFormField(placeholder, type, field, value) {
    return this.createElement('div', {
      className: 'cwd-form-field',
      children: [
        this.createElement('input', {
          className: 'cwd-form-input',
          attributes: {
            type,
            placeholder,
            value: value || '',
            disabled: this.props.submitting,
            onInput: (e) => this.handleUserInfoChange(field, e.target.value)
          }
        })
      ]
    });
  }
}
