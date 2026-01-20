/**
 * API 请求封装
 */

/**
 * 创建 API 客户端
 * @param {Object} config - 配置对象
 * @param {string} config.apiBaseUrl - API 基础地址
 * @param {string} config.postSlug - 文章标识符
 * @param {string} config.postTitle - 文章标题（可选）
 * @param {string} config.postUrl - 文章 URL（可选）
 * @returns {Object}
 */
export function createApiClient(config) {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, '');

  /**
   * 获取评论列表
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>}
   */
  async function fetchComments(page = 1, limit = 20) {
    const params = new URLSearchParams({
      post_slug: config.postSlug,
      page: page.toString(),
      limit: limit.toString(),
      nested: 'true'
    });

    const response = await fetch(`${baseUrl}/api/comments?${params}`);
    if (!response.ok) {
      throw new Error(`获取评论失败: ${response.status} ${response.statusText}`);
    }
    console.log('[API] fetchComments response:', response);
    return response.json();
  }

  /**
   * 提交评论
   * @param {Object} data - 评论数据
   * @param {string} data.name - 昵称
   * @param {string} data.email - 邮箱
   * @param {string} data.url - 网址（可选）
   * @param {string} data.content - 评论内容
   * @param {number} data.parentId - 父评论 ID（可选，用于回复）
   * @returns {Promise<Object>}
   */
  async function submitComment(data) {
    const response = await fetch(`${baseUrl}/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_slug: config.postSlug,
        post_title: config.postTitle,
        post_url: config.postUrl,
        name: data.name,
        email: data.email,
        url: data.url || undefined,
        content: data.content,
        parent_id: data.parentId
      })
    });

    if (!response.ok) {
      throw new Error(`提交评论失败: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  return {
    fetchComments,
    submitComment
  };
}
