> [!WARNING]  
> ~~目前仍处于 Beta 测试阶段，欢迎反馈测试结果。~~
> 
> 目前处于内测阶段，欢迎参与测试。

# Cloudflare Workers Discuss

CWD 评论系统。

是基于 Cloudflare Workers 与全球边缘网络的免服务器、极速安全、即插即用评论系统。

[使用文档](https://cwd-docs.zishu.me)

**评论端**
![](https://github.com/user-attachments/assets/6ac091d8-e349-4d40-9d68-485817f63236)

**后台管理**
![](https://github.com/user-attachments/assets/d2cd1d4d-f592-4ff5-9915-7ed0e2a0304b)
![](https://github.com/user-attachments/assets/6c3586d8-a111-4c35-a099-91d670b9c04b)
![](https://github.com/user-attachments/assets/97f35f06-a346-40ed-8ed4-24a9457bee33)

## 特性

- ⚡️ **极速响应**：基于 Cloudflare 全球边缘网络
- 🔒 **安全可靠**：内置管理员认证、CORS 保护等
- 🎨 **易于集成**：提供完整的 REST API，支持定制前端评论组件
- 🔧 **管理后台**：提供完善的后台管理界面，方便评论管理
- 🔄 **评论审核**：支持手动审核评论，防止垃圾评论
- 🔒 **禁止评论**：支持屏蔽 IP 和拉黑邮箱
- 📧 **邮件通知**：集成各大邮箱厂商（逐步接入），支持自定义通知模板
- 🔄 **评论迁移**：支持将其他评论系统的评论迁移到 CWD

## 前置要求

- Node.js 20+
- Cloudflare 账号
- Wrangler CLI

## 安装

```bash
# 克隆项目
git clone https://github.com/anghunk/cwd

# API 项目
cd cwd-api
# 部署请查看文档

# 前端项目
cd cwd-admin
npm install

```

## 配置

- [后端配置](https://cwd-docs.zishu.me/guide/backend-config.html)
- [前端配置](https://cwd-docs.zishu.me/guide/frontend-config.html)
