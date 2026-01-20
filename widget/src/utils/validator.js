/**
 * 表单验证工具
 */

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证 URL 格式
 * @param {string} url - URL 地址
 * @returns {boolean}
 */
export function isValidUrl(url) {
  if (!url) return true; // URL 是可选的
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证评论内容
 * @param {string} content - 评论内容
 * @returns {{valid: boolean, error?: string}}
 */
export function validateCommentContent(content) {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '请输入评论内容' };
  }
  if (content.length > 1000) {
    return { valid: false, error: '评论内容不能超过 1000 字' };
  }
  return { valid: true };
}

/**
 * 验证评论表单
 * @param {Object} data - 表单数据
 * @param {string} data.name - 昵称
 * @param {string} data.email - 邮箱
 * @param {string} data.url - 网址
 * @param {string} data.content - 评论内容
 * @returns {{valid: boolean, errors: Object<string, string>}}
 */
export function validateCommentForm(data) {
  const errors = {};

  // 验证昵称
  if (!data.name || data.name.trim().length === 0) {
    errors.name = '请输入昵称';
  } else if (data.name.length > 50) {
    errors.name = '昵称不能超过 50 字';
  }

  // 验证邮箱
  if (!data.email || data.email.trim().length === 0) {
    errors.email = '请输入邮箱';
  } else if (!isValidEmail(data.email)) {
    errors.email = '邮箱格式不正确';
  }

  // 验证网址（可选）
  if (data.url && !isValidUrl(data.url)) {
    errors.url = '网址格式不正确';
  }

  // 验证评论内容
  const contentValidation = validateCommentContent(data.content);
  if (!contentValidation.valid) {
    errors.content = contentValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 验证回复所需的用户信息
 * @param {Object} data - 用户信息
 * @param {string} data.name - 昵称
 * @param {string} data.email - 邮箱
 * @param {string} data.url - 网址
 * @returns {{valid: boolean, errors: Object<string, string>}}
 */
export function validateReplyUserInfo(data) {
  const errors = {};

  // 验证昵称
  if (!data.name || data.name.trim().length === 0) {
    errors.name = '请输入昵称';
  } else if (data.name.length > 50) {
    errors.name = '昵称不能超过 50 字';
  }

  // 验证邮箱
  if (!data.email || data.email.trim().length === 0) {
    errors.email = '请输入邮箱';
  } else if (!isValidEmail(data.email)) {
    errors.email = '邮箱格式不正确';
  }

  // 验证网址（可选）
  if (data.url && !isValidUrl(data.url)) {
    errors.url = '网址格式不正确';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
