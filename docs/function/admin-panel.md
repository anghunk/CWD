# 后台设置

管理后台用于审核评论、删除评论和管理评论设置。

## 域名筛选（多站点管理）

管理后台顶部导航栏提供了全局域名下拉选择器，用于在多域名站点之间切换数据视图。

## 设置

### 头像服务前缀

常用的 Gravatar 镜像服务：

| 服务            | 前缀地址                         |
| --------------- | -------------------------------- |
| Gravatar 官方   | `https://gravatar.com/avatar`    |
| Cravatar (国内) | `https://cravatar.cn/avatar`     |
| 自定义镜像      | `https://your-mirror.com/avatar` |

### 显示博主标签

开启是否显示博主标签，配置博主邮箱，即可在评论中显示博主标签；关闭为不显示。

标签文字可选填，留空则使用默认图标。

![](https://github.com/user-attachments/assets/91e05939-de59-4941-a416-ce5d518e262d)

### 评论置顶

在评论管理页面，点击"编辑"按钮可修改评论的置顶权重：

- `1`：不置顶（默认值）
- `2` 或更高：数值越大，该评论在列表中排序越靠前

置顶后的评论会在前台评论列表中优先显示。

## 使用官方管理后台

使用官方提供的管理后台（最新版本）https://cwd.zishu.me

登陆时填入你的 api 地址、账号和密码。

## 评论数据修改

支持单条评论的修改，包括状态、内容等。

> [!WARNING]
> 如若批量修改评论信息，请前往 Cloudflare D1 SQL 控制台执行 SQL 语句。
>
> 高危操作，请保证你熟悉 SQL 语句，避免对评论数据造成不可逆的损失。建议使用前先导出评论数据备份。

## 自部署

```bash
cd cwd-admin

# 安装依赖
npm install

# 开发环境启动（默认端口见 vite.config.ts，一般为 1226）
npm run dev

# 生产环境构建
npm run build

# 本地预览生产构建结果
npm run preview
```

将 `/cwd-admin/dist` 目录部署到任意静态站点托管服务（如 Cloudflare Pages、Vercel、Netlify 等），并确保浏览器可以访问到后端 API 地址。

- 管理后台（admin）：基于 Vite + Vue 3 的单页应用，用于管理评论和系统配置。

- `/cwd-admin`：管理后台源码
  - 运行环境：浏览器
  - 构建工具：Vite + Vue 3

### 环境变量与多环境配置

评论组件本身不依赖打包时的环境变量，只需要在运行时传入 `apiBaseUrl` 即可。  
管理后台使用 Vite 环境变量进行多环境配置，推荐按以下方式区分开发 / 测试 / 生产环境：

在 `/cwd-admin` 目录下创建对应的环境文件：

```bash
# 开发环境
cp .env.example .env
```

每个环境文件中可配置以下变量：

| 变量名                | 说明                                            | 示例                       |
| --------------------- | ----------------------------------------------- | -------------------------- |
| `VITE_API_BASE_URL`   | 后端 API 地址（Cloudflare Worker 域名或自定义） | `https://cwd-api.test.com` |
| `VITE_ADMIN_NAME`     | 登录页默认管理员账号占位值                      | `admin@example.com`        |
| `VITE_ADMIN_PASSWORD` | 登录页默认密码占位值                            | `123456`                   |

说明：

- `VITE_API_BASE_URL` 会作为管理后台的默认 API 地址，实际请求地址可以在登录页修改，并持久化到 `localStorage`。
- `VITE_ADMIN_NAME` 和 `VITE_ADMIN_PASSWORD` 仅用于自动填充登录表单，真正的认证信息以后端环境变量 `ADMIN_NAME`、`ADMIN_PASSWORD` 为准。
