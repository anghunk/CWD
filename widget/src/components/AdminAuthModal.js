import { Component } from './Component.js';

export class AdminAuthModal extends Component {
  constructor(container, props = {}) {
    super(container, props);
    this.state = {
      key: '',
      error: '',
      loading: false
    };
    this.elements = {
      input: null,
      error: null,
      submitBtn: null
    };
  }

  render() {
    const { key, error, loading } = this.state;

    const overlay = this.createElement('div', {
      className: 'cwd-modal-overlay',
      children: [
        this.createElement('div', {
          className: 'cwd-modal',
          children: [
            this.createTextElement('h3', '管理员身份验证', 'cwd-modal-title'),
            this.createElement('div', {
              className: 'cwd-modal-body',
              children: [
                this.createTextElement('p', '检测到管理员邮箱，请输入密钥以继续。', 'cwd-modal-desc'),
                this.createElement('input', {
                  className: `cwd-form-input ${error ? 'cwd-input-error' : ''}`,
                  attributes: {
                    type: 'password',
                    placeholder: '请输入管理员密钥',
                    value: key,
                    disabled: loading,
                    onInput: (e) => this.setState({ key: e.target.value, error: '' }),
                    onKeydown: (e) => {
                        if (e.key === 'Enter') this.handleSubmit();
                    }
                  }
                }),
                error ? this.createTextElement('div', error, 'cwd-error-text') : null
              ]
            }),
            this.createElement('div', {
              className: 'cwd-modal-actions',
              children: [
                this.createElement('button', {
                  className: 'cwd-btn cwd-btn-secondary',
                  text: '取消',
                  attributes: {
                    type: 'button',
                    disabled: loading,
                    onClick: () => this.props.onCancel && this.props.onCancel()
                  }
                }),
                this.createElement('button', {
                  className: 'cwd-btn cwd-btn-primary',
                  text: loading ? '验证中...' : '验证',
                  attributes: {
                    type: 'button',
                    disabled: loading || !key,
                    onClick: () => this.handleSubmit()
                  }
                })
              ]
            })
          ]
        })
      ]
    });

    this.empty(this.container);
    this.container.appendChild(overlay);
    
    this.elements.input = overlay.querySelector('input');
    this.elements.error = overlay.querySelector('.cwd-error-text');
    this.elements.submitBtn = overlay.querySelector('.cwd-btn-primary');

    this.update();

    const input = this.elements.input;
    if (input) setTimeout(() => input.focus(), 50);
  }
  
  setState(newState) {
      this.state = { ...this.state, ...newState };
      this.update();
  }

  update() {
    const { key, error, loading } = this.state;

    if (this.elements.input) {
      this.elements.input.value = key;
      this.elements.input.disabled = loading;
      if (error) {
        this.elements.input.classList.add('cwd-input-error');
      } else {
        this.elements.input.classList.remove('cwd-input-error');
      }
    }

    if (this.elements.error) {
      if (error) {
        this.elements.error.textContent = error;
        this.elements.error.style.display = '';
      } else {
        this.elements.error.textContent = '';
        this.elements.error.style.display = 'none';
      }
    }

    if (this.elements.submitBtn) {
      this.elements.submitBtn.disabled = loading || !key;
      this.elements.submitBtn.textContent = loading ? '验证中...' : '验证';
    }
  }

  handleSubmit() {
    if (!this.state.key) return;
    if (this.props.onSubmit) {
      this.setState({ loading: true });
      this.props.onSubmit(this.state.key)
        .catch(err => {
            this.setState({ error: err.message || '验证失败', loading: false });
        });
    }
  }
  
  destroy() {
      this.empty(this.container);
  }
}
