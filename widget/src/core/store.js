/**
 * 状态管理 - 使用发布-订阅模式
 */

// localStorage 键名
const STORAGE_KEY = 'cwd_user_info';

/**
 * 从 localStorage 读取用户信息
 * @returns {Object}
 */
function loadUserInfo() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        name: parsed.name || '',
        email: parsed.email || '',
        url: parsed.url || ''
      };
    }
  } catch (e) {
    console.error('读取用户信息失败:', e);
  }
  return { name: '', email: '', url: '' };
}

/**
 * 保存用户信息到 localStorage
 * @param {string} name - 昵称
 * @param {string} email - 邮箱
 * @param {string} url - 网址
 */
function saveUserInfo(name, email, url) {
  try {
    const data = { name, email, url };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存用户信息失败:', e);
  }
}

/**
 * 简单的 Store 类
 */
class Store {
  constructor(initialState) {
    this.state = { ...initialState };
    this.listeners = [];
  }

  /**
   * 获取当前状态
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * 更新状态
   * @param {Object} updates - 要更新的属性
   */
  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // 通知所有监听器
    this.listeners.forEach(listener => {
      listener(this.state, prevState);
    });
  }

  /**
   * 订阅状态变化
   * @param {Function} listener - 监听器函数
   * @returns {Function} - 取消订阅的函数
   */
  subscribe(listener) {
    this.listeners.push(listener);

    // 返回取消订阅的函数
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

/**
 * 创建评论状态管理 Store
 * @param {Object} config - 配置对象
 * @param {Function} fetchComments - 获取评论的函数
 * @param {Function} submitComment - 提交评论的函数
 * @returns {Object}
 */
export function createCommentStore(config, fetchComments, submitComment) {
  // 从 localStorage 加载用户信息
  const savedInfo = loadUserInfo();

  // 创建 store 实例
  const store = new Store({
    // 评论数据
    comments: [],
    loading: true,
    error: null,

    // 分页
    pagination: {
      page: 1,
      limit: config.pageSize || 20,
      total: 0,
      totalCount: 0
    },

    // 表单数据
    form: {
      name: savedInfo.name || '',
      email: savedInfo.email || '',
      url: savedInfo.url || '',
      content: ''
    },
    formErrors: {},
    submitting: false,

    // 回复状态
    replyingTo: null,
    replyContent: '',
    replyError: null
  });

  // 监听用户信息变化，自动保存到 localStorage
  store.subscribe((state) => {
    if (state.form.name || state.form.email || state.form.url) {
      saveUserInfo(state.form.name, state.form.email, state.form.url);
    }
  });

  /**
   * 加载评论列表
   * @param {number} page - 页码
   */
  async function loadComments(page = 1) {
    store.setState({
      loading: true,
      error: null
    });

    try {
      const response = await fetchComments(page, store.getState().pagination.limit);
      console.log('[Store] loadComments response:', response);
      console.log('[Store] comments data:', response.data);
      store.setState({
        comments: response.data,
        pagination: {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalCount: response.pagination.totalCount
        },
        loading: false
      });
    } catch (e) {
      store.setState({
        error: e instanceof Error ? e.message : '加载评论失败',
        loading: false
      });
    }
  }

  /**
   * 提交评论
   */
  async function submitNewComment() {
    const state = store.getState();
    const form = state.form;

    // 验证表单
    const { validateCommentForm } = await import('@/utils/validator.js');
    const validation = validateCommentForm(form);
    if (!validation.valid) {
      store.setState({
        formErrors: validation.errors
      });
      return false;
    }

    // 清空错误
    store.setState({
      formErrors: {},
      submitting: true,
      error: null
    });

    try {
      await submitComment({
        name: form.name,
        email: form.email,
        url: form.url,
        content: form.content
      });

      // 清空评论内容
      store.setState({
        form: { ...form, content: '' },
        submitting: false
      });

      // 重新加载评论
      await loadComments(state.pagination.page);
      return true;
    } catch (e) {
      store.setState({
        error: e instanceof Error ? e.message : '提交评论失败',
        submitting: false
      });
      return false;
    }
  }

  /**
   * 提交回复
   * @param {number} parentId - 父评论 ID
   */
  async function submitReply(parentId) {
    const state = store.getState();

    // 验证回复内容
    if (!state.replyContent.trim()) {
      return false;
    }

    // 验证用户信息
    const { validateReplyUserInfo } = await import('@/utils/validator.js');
    const validation = validateReplyUserInfo(state.form);
    if (!validation.valid) {
      const errorMessages = Object.values(validation.errors).join('；');
      store.setState({
        replyError: errorMessages
      });
      return false;
    }

    store.setState({
      formErrors: {},
      submitting: true,
      replyError: null
    });

    try {
      await submitComment({
        name: state.form.name,
        email: state.form.email,
        url: state.form.url,
        content: state.replyContent,
        parentId
      });

      // 清空回复内容并关闭回复框
      store.setState({
        replyContent: '',
        replyingTo: null,
        submitting: false
      });

      // 重新加载评论
      await loadComments(state.pagination.page);
      return true;
    } catch (e) {
      store.setState({
        error: e instanceof Error ? e.message : '提交回复失败',
        submitting: false
      });
      return false;
    }
  }

  /**
   * 开始回复
   * @param {number} commentId - 评论 ID
   */
  function startReply(commentId) {
    console.log('[Store] startReply called with commentId:', commentId);
    store.setState({
      replyingTo: commentId,
      replyContent: '',
      replyError: null
    });
    console.log('[Store] New state:', store.getState());
  }

  /**
   * 取消回复
   */
  function cancelReply() {
    store.setState({
      replyingTo: null,
      replyContent: '',
      replyError: null
    });
  }

  /**
   * 更新表单字段
   * @param {string} field - 字段名
   * @param {string} value - 值
   */
  function updateFormField(field, value) {
    const form = { ...store.getState().form };
    form[field] = value;
    store.setState({ form });
  }

  /**
   * 更新回复内容
   * @param {string} content - 回复内容
   */
  function updateReplyContent(content) {
    store.setState({
      replyContent: content
    });
  }

  /**
   * 清除回复错误
   */
  function clearReplyError() {
    store.setState({
      replyError: null
    });
  }

  /**
   * 清除错误
   */
  function clearError() {
    store.setState({
      error: null
    });
  }

  /**
   * 切换页码
   * @param {number} page - 页码
   */
  function goToPage(page) {
    const totalPages = store.getState().pagination.total;
    if (page >= 1 && page <= totalPages) {
      loadComments(page);
    }
  }

  return {
    // Store 实例
    store,

    // 计算属性方法
    getTotalPages: () => {
      const state = store.getState();
      return state.pagination.total;
    },

    // 操作方法
    loadComments,
    submitNewComment,
    submitReply,
    startReply,
    cancelReply,
    updateFormField,
    updateReplyContent,
    clearReplyError,
    clearError,
    goToPage
  };
}
