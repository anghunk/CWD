/**
 * CommentItem 评论项组件
 */

import { Component } from './Component.js';
import { ReplyEditor } from './ReplyEditor.js';
import { formatRelativeTime } from '@/utils/date.js';

export class CommentItem extends Component {
  /**
   * @param {HTMLElement|string} container - 容器元素或选择器
   * @param {Object} props - 组件属性
   * @param {Object} props.comment - 评论数据
   * @param {boolean} props.isReply - 是否为回复
   * @param {number|null} props.replyingTo - 当前正在回复的评论 ID
   * @param {string} props.replyContent - 回复内容
   * @param {string|null} props.replyError - 回复错误
   * @param {boolean} props.submitting - 是否正在提交
   * @param {string} props.adminEmail - 博主邮箱（可选）
   * @param {string} props.adminBadge - 博主标识文字（可选）
   * @param {Function} props.onReply - 回复回调
   * @param {Function} props.onSubmitReply - 提交回复回调
   * @param {Function} props.onCancelReply - 取消回复回调
   * @param {Function} props.onUpdateReplyContent - 更新回复内容回调
   * @param {Function} props.onClearReplyError - 清除回复错误回调
   */
  constructor(container, props = {}) {
    super(container, props);
    this.replyEditor = null;
    this.childCommentItems = []; // 缓存嵌套回复的 CommentItem 实例
  }

		render() {
    const { comment, isReply, adminEmail, adminBadge } = this.props;
    const isPinned = typeof comment.priority === 'number' && comment.priority > 1;
    const isReplying = this.props.replyingTo === comment.id;
    const isAdmin = adminEmail && adminBadge && comment.email === adminEmail;

    const root = this.createElement('div', {
      className: `cwd-comment-item ${isReply ? 'cwd-comment-reply' : ''}`,
      children: [
        // 头像
        this.createElement('div', {
          className: 'cwd-comment-avatar',
          children: [
            this.createElement('img', {
              attributes: {
                src: comment.avatar,
                alt: comment.name,
                loading: 'lazy'
              }
            })
          ]
        }),

        // 主体内容
        this.createElement('div', {
          className: 'cwd-comment-body',
          children: [
            // 头部（作者名、操作按钮、时间）
            this.createElement('div', {
              className: 'cwd-comment-header',
              children: [
                // 作者信息
                this.createElement('div', {
                  className: 'cwd-comment-author',
                  children: [
                    comment.url
                      ? this.createElement('span', {
                          className: 'cwd-author-name',
                          children: [
                            this.createElement('a', {
                              attributes: {
                                href: comment.url,
                                target: '_blank',
                                rel: 'noopener noreferrer'
                              },
                              text: comment.name
                            })
                          ]
                        })
                      : this.createTextElement('span', comment.name, 'cwd-author-name'),
                    ...(isAdmin ? [
                      this.createTextElement('span', `${adminBadge}`, 'cwd-admin-badge')
                    ] : []),
                    ...(isPinned ? [
                      this.createTextElement('span', '置顶', 'cwd-pin-badge')
                    ] : []),
                    // 显示回复目标
                    ...(comment.replyToAuthor ? [
                      this.createTextElement('span', ' 回复 ', 'cwd-reply-to-separator'),
                      this.createTextElement('span', comment.replyToAuthor, 'cwd-reply-to-author')
                    ] : [])
                  ]
                }),

                // 操作区域
                this.createElement('div', {
                  className: 'cwd-comment-actions',
                  children: [
                    this.createElement('span', {
                      className: 'cwd-action-btn',
                      attributes: {
                        onClick: () => this.handleReply()
                      },
                      text: '回复'
                    }),
                    this.createElement('div', {
                      className: 'cwd-comment-like',
                      children: [
                        this.createElement('button', {
                          className: 'cwd-comment-like-button',
                          attributes: {
                            type: 'button',
                            'aria-label': '点赞',
                            onClick: () => this.handleLikeComment()
                          },
                          children: [
                            this.createElement('span', {
                              className: 'cwd-comment-like-icon-wrapper',
                              children: [
                                this.createElement('svg', {
                                  className: 'cwd-comment-like-icon',
                                  attributes: {
                                    viewBox: '0 0 24 24',
                                    'aria-hidden': 'true'
                                  },
                                  children: [
                                    this.createElement('path', {
                                      attributes: {
                                        d: 'M12 21c-.4 0-.8-.1-1.1-.4L4.5 15C3 13.6 2 11.7 2 9.6 2 6.5 4.5 4 7.6 4c1.7 0 3.3.8 4.4 2.1C13.1 4.8 14.7 4 16.4 4 19.5 4 22 6.5 22 9.6c0 2.1-1 4-2.5 5.4l-6.4 5.6c-.3.3-.7.4-1.1.4z'
                                      }
                                    })
                                  ]
                                })
                              ]
                            }),
                            this.createTextElement(
                              'span',
                              String(
                                typeof comment.likes === 'number' && Number.isFinite(comment.likes) && comment.likes >= 0
                                  ? comment.likes
                                  : 0
                              ),
                              'cwd-comment-like-count'
                            )
                          ]
                        })
                      ]
                    }),
                    this.createTextElement('span', formatRelativeTime(comment.created), 'cwd-comment-time')
                  ]
                })
              ]
            }),

            // 评论内容
            this.createElement('div', {
              className: 'cwd-comment-content'
            }),

            // 回复编辑器容器
            this.createElement('div', {
              className: 'cwd-reply-editor-container'
            }),

            // 嵌套回复容器
            ...(comment.replies && comment.replies.length > 0 ? [
              this.createElement('div', {
                className: 'cwd-replies'
              })
            ] : [])
          ]
        })
      ]
    });

    // 设置评论内容的 HTML
    const contentEl = root.querySelector('.cwd-comment-content');
    if (contentEl) {
      contentEl.innerHTML = comment.contentHtml;
    }

    // 创建回复编辑器
    if (isReplying) {
      const replyContainer = root.querySelector('.cwd-reply-editor-container');
      if (replyContainer) {
        this.replyEditor = new ReplyEditor(replyContainer, {
          replyToAuthor: comment.name,
          content: this.props.replyContent,
          error: this.props.replyError,
          submitting: this.props.submitting,
          onUpdate: (content) => this.handleUpdateReplyContent(content),
          onSubmit: () => this.handleSubmitReply(),
          onCancel: () => this.handleCancelReply(),
          onClearError: () => this.handleClearReplyError()
        });
        this.replyEditor.render();
        this.replyEditor.focus();
      }
    } else {
      this.replyEditor = null;
    }

    // 渲染嵌套回复
    this.childCommentItems = [];
    if (comment.replies && comment.replies.length > 0) {
      const repliesContainer = root.querySelector('.cwd-replies');
      if (repliesContainer) {
        comment.replies.forEach(reply => {
          const replyItem = new CommentItem(repliesContainer, {
            comment: reply,
            isReply: true,
            replyingTo: this.props.replyingTo,
            replyContent: this.props.replyContent,
            replyError: this.props.replyError,
            submitting: this.props.submitting,
            adminEmail: this.props.adminEmail,
            adminBadge: this.props.adminBadge,
            onReply: this.props.onReply,
            onSubmitReply: this.props.onSubmitReply,
            onCancelReply: this.props.onCancelReply,
            onUpdateReplyContent: this.props.onUpdateReplyContent,
            onClearReplyError: this.props.onClearReplyError
          });
          replyItem.render();
          this.childCommentItems.push(replyItem);
        });
      }
    }

    this.elements.root = root;

    // 只在首次渲染时清空容器（当还没有 root 元素时）
    if (this.container.contains(root)) {
      // 如果 root 已存在，替换它
      this.container.replaceChild(root, this.elements.root);
    } else {
      // 否则直接添加
      this.container.appendChild(root);
    }
  }

  updateProps(prevProps) {
    const { comment } = this.props;
    const wasReplying = prevProps.replyingTo === comment.id;
    const isReplying = this.props.replyingTo === comment.id;

    // 如果评论数据本身变化，需要完全重新渲染
    if (this.props.comment !== prevProps.comment) {
      this.render();
      return;
    }

    // 处理回复编辑器的显示/隐藏
    if (isReplying !== wasReplying) {
      const replyContainer = this.elements.root?.querySelector(':scope > .cwd-comment-body > .cwd-reply-editor-container');
      if (isReplying && replyContainer) {
        // 显示回复编辑器
        this.replyEditor = new ReplyEditor(replyContainer, {
          replyToAuthor: comment.name,
          content: this.props.replyContent,
          error: this.props.replyError,
          submitting: this.props.submitting,
          onUpdate: (content) => this.handleUpdateReplyContent(content),
          onSubmit: () => this.handleSubmitReply(),
          onCancel: () => this.handleCancelReply(),
          onClearError: () => this.handleClearReplyError()
        });
        this.replyEditor.render();
        this.replyEditor.focus();
      } else if (!isReplying && replyContainer) {
        // 隐藏回复编辑器
        replyContainer.innerHTML = '';
        this.replyEditor = null;
      }
    } else if (isReplying && this.replyEditor) {
      // 更新回复编辑器的 props
      this.replyEditor.setProps({
        content: this.props.replyContent,
        error: this.props.replyError,
        submitting: this.props.submitting
      });
    }

    // 递归更新嵌套回复
    if (this.childCommentItems && this.childCommentItems.length > 0) {
      this.childCommentItems.forEach((childItem) => {
        childItem.setProps({
          replyingTo: this.props.replyingTo,
          replyContent: this.props.replyContent,
          replyError: this.props.replyError,
          submitting: this.props.submitting
        });
      });
    }
  }

  handleReply() {
    if (this.props.onReply) {
      this.props.onReply(this.props.comment.id);
    }
  }

  handleLikeComment() {
    if (this.props.onLikeComment) {
      this.props.onLikeComment(this.props.comment.id);
    }
  }

  handleSubmitReply() {
    if (this.props.onSubmitReply) {
      this.props.onSubmitReply(this.props.comment.id);
    }
  }

  handleCancelReply() {
    if (this.props.onCancelReply) {
      this.props.onCancelReply();
    }
  }

  handleUpdateReplyContent(content) {
    if (this.props.onUpdateReplyContent) {
      this.props.onUpdateReplyContent(content);
    }
  }

  handleClearReplyError() {
    if (this.props.onClearReplyError) {
      this.props.onClearReplyError();
    }
  }
}
