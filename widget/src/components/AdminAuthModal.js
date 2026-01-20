import { Component } from './Component.js';

export class AdminAuthModal extends Component {
  constructor(container, props = {}) {
    super(container, props);
    this.state = {
      key: '',
      error: '',
      loading: false
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
    
    // Focus input
    const input = overlay.querySelector('input');
    if (input) setTimeout(() => input.focus(), 50);
  }
  
  setState(newState) {
      this.state = { ...this.state, ...newState };
      this.render();
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
