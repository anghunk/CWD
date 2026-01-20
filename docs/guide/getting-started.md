> [!WARNING]  
> 目前仍处于 Beta 测试阶段，欢迎反馈测试结果。

# CWD 评论系统

Cloudflare Worker 版本基于 Cloudflare Workers + D1 + KV 实现，无需服务器即可部署运行的评论组件。

[文档地址](https://cwd-comments-docs.zishu.me)

## 特性

- ⚡️ **极速响应**：基于 Cloudflare 全球边缘网络
- 🔒 **安全可靠**：内置管理员认证、CORS 保护
- 🎨 **易于集成**：提供完整的 REST API
- 📧 **邮件通知**：集成各大邮箱厂商（逐步接入）

**开发中：**

- 表情符号支持：用户可以在评论中使用表情符号。
- 图片上传：用户可以上传图片到评论中。

## 前置要求

- Node.js 16+
- Cloudflare 账号
- Wrangler CLI

## 安装

```bash
# 克隆项目
git clone https://github.com/anghunk/cwd-comments

# API 项目
cd cwd-comments-api
# 部署请查看文档

# 前端项目
cd cwd-comments-web
npm install

```

## 配置

- [后端配置](https://cwd-comments-docs.zishu.me/guide/backend-config.html)
- [前端配置](https://cwd-comments-docs.zishu.me/guide/frontend-config.html)
