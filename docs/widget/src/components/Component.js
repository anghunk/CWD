/**
 * 基础组件类
 */

/**
 * 基础组件类
 */
export class Component {
  /**
   * @param {HTMLElement|string} container - 容器元素或选择器
   * @param {Object} props - 组件属性
   */
  constructor(container, props = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.props = props;
    this.state = {};
    this.elements = {};
    this.destroyed = false;
  }

  /**
   * 设置状态并触发更新
   * @param {Object|Function} newState - 新状态或状态更新函数
   */
  setState(newState) {
    if (this.destroyed) return;

    const prevState = { ...this.state };
    if (typeof newState === 'function') {
      this.state = { ...this.state, ...newState(prevState) };
    } else {
      this.state = { ...this.state, ...newState };
    }
    this.update(prevState);
  }

  /**
   * 更新属性
   * @param {Object} newProps - 新属性
   */
  setProps(newProps) {
    if (this.destroyed) return;

    const prevProps = { ...this.props };
    this.props = { ...this.props, ...newProps };
    this.updateProps(prevProps);
  }

  /**
   * 渲染组件 - 子类实现
   */
  render() {
    // 子类实现
  }

  /**
   * 更新视图 - 子类可重写
   * @param {Object} prevState - 之前的状态
   */
  update(prevState) {
    // 子类可重写以实现增量更新
    this.render();
  }

  /**
   * 更新属性后的回调 - 子类可重写
   * @param {Object} prevProps - 之前的属性
   */
  updateProps(prevProps) {
    // 子类可重写
  }

  /**
   * 销毁组件
   */
  destroy() {
    this.destroyed = true;
    if (this.container && this.elements.root && this.elements.root.parentNode) {
      this.elements.root.parentNode.removeChild(this.elements.root);
    }
    this.elements = {};
  }

  // ==================== DOM 创建工具方法 ====================

  /**
   * 创建元素
   * @param {string} tag - 标签名
   * @param {Object} options - 选项
   * @param {string} options.className - 类名
   * @param {Object} options.attributes - 属性
   * @param {string} options.text - 文本内容
   * @param {string} options.html - HTML 内容
   * @param {HTMLElement|Array<HTMLElement>} options.children - 子元素
   * @returns {HTMLElement}
   */
  createElement(tag, options = {}) {
    const el = document.createElement(tag);

    if (options.className) {
      el.className = options.className;
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        if (key.startsWith('on')) {
          const event = key.slice(2).toLowerCase();
          el.addEventListener(event, value);
        } else if (key === 'dataset') {
          Object.entries(value).forEach(([dataKey, dataValue]) => {
            el.dataset[dataKey] = dataValue;
          });
        } else if (['disabled', 'checked', 'readonly', 'required', 'autofocus'].includes(key)) {
          // 布尔属性：只有值为 true 时才设置
          if (value) {
            el.setAttribute(key, '');
          }
        } else {
          el.setAttribute(key, value);
        }
      });
    }

    if (options.text !== undefined) {
      el.textContent = options.text;
    }

    if (options.html !== undefined) {
      el.innerHTML = options.html;
    }

    if (options.children) {
      const children = Array.isArray(options.children) ? options.children : [options.children];
      children.forEach(child => {
        if (child instanceof Node) {
          el.appendChild(child);
        }
      });
    }

    return el;
  }

  /**
   * 创建带文本的元素
   * @param {string} tag - 标签名
   * @param {string} text - 文本内容
   * @param {string} className - 类名
   * @returns {HTMLElement}
   */
  createTextElement(tag, text, className = '') {
    return this.createElement(tag, {
      className,
      text
    });
  }

  /**
   * 清空元素
   * @param {HTMLElement} el - 目标元素
   */
  empty(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
}
