# 管理员 API

管理员接口用于登录后台、查看和管理评论、配置邮件通知和评论显示设置。

除登录接口外，所有管理员接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

Token 通过登录接口获取，有效期为 24 小时。

## 1. 身份认证相关

### 1.1 管理员登录

```
POST /admin/login
```

管理员登录，获取后续调用其他管理员接口所需的临时 Token。

- 方法：`POST`
- 路径：`/admin/login`
- 鉴权：不需要

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
	"name": "admin@example.com",
	"password": "your_password"
}
```

字段说明：

| 字段名     | 类型   | 必填 | 说明           |
| ---------- | ------ | ---- | -------------- |
| `name`     | string | 是   | 管理员登录名   |
| `password` | string | 是   | 管理员登录密码 |

管理员登录名和密码由后端环境变量控制，字段为：

- `ADMIN_NAME`
- `ADMIN_PASSWORD`

**成功响应**

- 状态码：`200`

```json
{
	"data": {
		"key": "f6e1e0e3-3c9b-4a24-9e88-3b1f709f1e4a"
	}
}
```

前端需要将 `data.key` 作为 Token 存储（例如 LocalStorage），并在后续请求中通过 `Authorization: Bearer <key>` 携带。

**错误与风控**

- 登录失败（用户名或密码错误）：
  - 状态码：`401`

  ```json
  {
  	"message": "Invalid username or password",
  	"failedAttempts": 3
  }
  ```

- 登录失败次数过多导致 IP 被封禁：
  - 状态码：`403`

  ```json
  {
  	"message": "IP is blocked due to multiple failed login attempts"
  }
  ```

- 内部错误：
  - 状态码：`500`

  ```json
  {
  	"message": "错误信息"
  }
  ```

## 2. 评论管理相关

### 2.1 获取评论列表

```
GET /admin/comments/list
```

获取评论列表，用于后台管理页面展示。

- 方法：`GET`
- 路径：`/admin/comments/list`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称     | 位置  | 类型    | 必填 | 说明                                       |
| -------- | ----- | ------- | ---- | ------------------------------------------ |
| `page`   | query | integer | 否   | 页码，默认 `1`                             |
| `domain` | query | string  | 否   | 按域名筛选评论，传入域名，如 `example.com` |

说明：

- 当前实现中每页固定大小为 `10`，暂不支持 `pageSize` 或状态过滤；
- 当提供 `domain` 参数时，会匹配该域名下的评论，例如 `https://example.com/...`、`http://example.com/...`。

**成功响应**

- 状态码：`200`

```json
{
	"data": [
		{
			"id": 1,
			"created": 1736762400000,
			"name": "张三",
			"email": "zhangsan@example.com",
			"postSlug": "https://your-blog.example.com/blog/hello-world",
			"url": "https://zhangsan.me",
			"ipAddress": "127.0.0.1",
			"contentText": "很棒的文章！",
			"contentHtml": "很棒的文章！",
			"status": "approved",
			"priority": 2,
			"ua": "Mozilla/5.0 ...",
			"avatar": "https://gravatar.com/avatar/..."
		}
	],
	"pagination": {
		"page": 1,
		"limit": 10,
		"total": 1
	}
}
```

**鉴权错误**

- 未携带 Token 或 Token 失效：
  - 状态码：`401`

  ```json
  {
  	"message": "Unauthorized"
  }
  ```

### 2.2 更新评论状态

```
PUT /admin/comments/status
```

更新评论状态（例如通过 / 拒绝）。

**注意**：此接口仅用于更新评论状态，如需修改评论内容、置顶权重等，请使用 `/admin/comments/update` 接口。

- 方法：`PUT`
- 路径：`/admin/comments/status`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称     | 位置  | 类型   | 必填 | 说明                                  |
| -------- | ----- | ------ | ---- | ------------------------------------- |
| `id`     | query | number | 是   | 评论 ID                               |
| `status` | query | string | 是   | 评论状态，例如 `approved`、`rejected` |

当前实现中未对 `status` 值进行枚举校验，但推荐仅使用：

- `approved`：已通过
- `rejected`：已拒绝

**成功响应**

- 状态码：`200`

```json
{
	"message": "Comment status updated, id: 1, status: approved."
}
```

**错误响应**

- 缺少参数：
  - 状态码：`400`

  ```json
  {
  	"message": "Missing id or status"
  }
  ```

- 更新失败：
  - 状态码：`500`

  ```json
  {
  	"message": "Update failed"
  }
  ```

### 2.3 更新评论内容

```
PUT /admin/comments/update
```

更新评论的详细信息，包括昵称、邮箱、网址、评论地址、内容、状态和置顶权重等。

- 方法：`PUT`
- 路径：`/admin/comments/update`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
  "id": 1,
  "name": "张三",
  "email": "zhangsan@example.com",
  "url": "https://zhangsan.me",
  "postSlug": "https://example.com/blog/hello-world",
  "contentText": "更新后的评论内容",
  "status": "approved",
  "priority": 2
}
```

字段说明：

| 字段名      | 类型   | 必填 | 说明                                   |
| ----------- | ------ | ---- | -------------------------------------- |
| `id`        | number | 是   | 评论 ID                                |
| `name`      | string | 是   | 评论者昵称                             |
| `email`     | string | 是   | 评论者邮箱                             |
| `url`       | string | 否   | 评论者个人主页或站点地址                 |
| `postSlug`  | string | 否   | 评论地址（文章 URL），不传则保持原值   |
| `contentText` | string | 是   | 评论内容（纯文本）                     |
| `status`    | string | 否   | 评论状态，可选 `approved`、`pending`、`rejected` |
| `priority`  | number | 否   | 置顶权重，默认为 1，数值越大越靠前   |

**置顶权重说明**：

- `1`：不置顶（默认值）
- `2` 或更高：数值越大，该评论在列表中排序越靠前
- 公开 API 获取评论时，会按照 `priority DESC` 进行排序

**成功响应**

- 状态码：`200`

```json
{
  "message": "Comment updated, id: 1."
}
```

**错误响应**

- ID 无效：
  - 状态码：`400` 或 `404`

  ```json
  {
    "message": "Missing or invalid id"
  }
  ```

  或

  ```json
  {
    "message": "Comment not found"
  }
  ```

- 必填字段为空：
  - 状态码：`400`

  ```json
  {
    "message": "昵称不能为空"
  }
  ```

- 更新失败：
  - 状态码：`500`

  ```json
  {
    "message": "Update failed"
  }
  ```

### 2.4 删除指定评论

```
DELETE /admin/comments/delete
```

删除指定评论。

- 方法：`DELETE`
- 路径：`/admin/comments/delete`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称 | 位置  | 类型   | 必填 | 说明    |
| ---- | ----- | ------ | ---- | ------- |
| `id` | query | number | 是   | 评论 ID |

**成功响应**

- 状态码：`200`

```json
{
	"message": "Comment deleted, id: 1."
}
```

**错误响应**

- 缺少 ID：
  - 状态码：`400`

  ```json
  {
  	"message": "Missing id"
  }
  ```

- 删除失败：
  - 状态码：`500`

  ```json
  {
  	"message": "Delete operation failed"
  }
  ```

### 2.5 将指定 IP 加入评论黑名单

```
POST /admin/comments/block-ip
```

通过接口将指定 IP 地址加入评论黑名单，后续该 IP 提交评论将被拒绝。

- 方法：`POST`
- 路径：`/admin/comments/block-ip`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
	"ip": "1.1.1.1"
}
```

字段说明：

| 字段名 | 类型   | 必填 | 说明                                             |
| ------ | ------ | ---- | ------------------------------------------------ |
| `ip`   | string | 是   | 要加入黑名单的 IP 地址，多个 IP 用逗号或换行分隔 |

**成功响应**

- 状态码：`200`

```json
{
	"message": "已加入 IP 黑名单"
}
```

**错误响应**

- IP 为空：
  - 状态码：`400`

  ```json
  {
  	"message": "IP 地址不能为空"
  }
  ```

- 内部错误：
  - 状态码：`500`

  ```json
  {
  	"message": "操作失败"
  }
  ```

### 2.6 将指定邮箱加入评论黑名单

```
POST /admin/comments/block-email
```

通过接口将指定邮箱地址加入评论黑名单，后续该邮箱提交评论将被拒绝。

- 方法：`POST`
- 路径：`/admin/comments/block-email`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
	"email": "spam@example.com"
}
```

字段说明：

| 字段名  | 类型   | 必填 | 说明                                             |
| ------- | ------ | ---- | ------------------------------------------------ |
| `email` | string | 是   | 要加入黑名单的邮箱地址，多个邮箱用逗号或换行分隔 |

**成功响应**

- 状态码：`200`

```json
{
	"message": "已加入邮箱黑名单"
}
```

**错误响应**

- 邮箱为空：
  - 状态码：`400`

  ```json
  {
  	"message": "邮箱不能为空"
  }
  ```

- 邮箱格式不正确：
  - 状态码：`400`

  ```json
  {
  	"message": "邮箱格式不正确"
  }
  ```

- 内部错误：
  - 状态码：`500`

  ```json
  {
  	"message": "操作失败"
  }
  ```

## 3. 评论数据导入导出

### 3.1 导出所有评论数据

```
GET /admin/comments/export
```

导出所有评论数据，返回格式为 JSON，字段与数据库结构一致。

- 方法：`GET`
- 路径：`/admin/comments/export`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
[
	{
		"id": 1,
		"pub_date": "2026-01-13 10:00:00",
		"post_slug": "/blog/hello-world",
		"author": "张三",
		"email": "zhangsan@example.com",
		"url": "https://zhangsan.me",
		"ip_address": "127.0.0.1",
		"device": "Desktop",
		"os": "Windows 10",
		"browser": "Chrome 90",
		"user_agent": "Mozilla/5.0 ...",
		"content_text": "很棒的文章！",
		"content_html": "很棒的文章！",
		"parent_id": null,
		"status": "approved"
	}
]
```

**错误响应**

- 导出失败：
  - 状态码：`500`

  ```json
  {
  	"message": "导出失败"
  }
  ```

### 3.2 导入评论数据

```
POST /admin/comments/import
```

导入评论数据，支持 JSON 格式，可以是单个对象或数组。

- 方法：`POST`
- 路径：`/admin/comments/import`
- 鉴权：需要（Bearer Token）

**请求体**

```json
[
	{
		"id": 5,
		"pub_date": "2026-01-20T04:36:57.636Z",
		"post_slug": "",
		"author": "1024605422",
		"email": "1024605422@qq.com",
		"url": null,
		"ip_address": "15.235.156.27",
		"device": "Desktop",
		"os": "Windows 10",
		"browser": "Chrome 143.0.0.0",
		"user_agent": "Mozilla/5.0 ...",
		"content_text": "试一下",
		"content_html": "试一下",
		"parent_id": null,
		"status": "approved"
	}
]
```

字段说明：与导出格式一致。如果不提供 `id`，则会自动生成。

**成功响应**

- 状态码：`200`

```json
{
	"message": "成功导入 1 条评论"
}
```

**错误响应**

- 导入数据为空：
  - 状态码：`400`

  ```json
  {
  	"message": "导入数据为空"
  }
  ```

- 导入失败：
  - 状态码：`500`

  ```json
  {
  	"message": "导入失败"
  }
  ```

## 4. 评论设置相关

### 4.1 获取评论配置

```
GET /admin/settings/comments
```

获取评论配置，例如博主邮箱、徽标、头像前缀、管理员密钥等。

- 方法：`GET`
- 路径：`/admin/settings/comments`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
	"adminEmail": "admin@example.com",
	"adminBadge": "博主",
	"avatarPrefix": "https://gravatar.com/avatar",
	"adminEnabled": true,
	"allowedDomains": [],
	"adminKey": "your-admin-key",
	"adminKeySet": true,
	"requireReview": false,
	"blockedIps": ["1.1.1.1", "2.2.2.2"],
	"blockedEmails": ["spam@example.com", "bot@test.com"]
}
```

字段说明（相比公开接口 `/api/config/comments` 增加了管理员密钥相关字段）：

| 字段名           | 类型            | 说明                                                      |
| ---------------- | --------------- | --------------------------------------------------------- |
| `adminEmail`     | string          | 博主邮箱地址，用于显示"博主"标识以及管理员身份验证        |
| `adminBadge`     | string          | 博主标识文字，例如 `"博主"`                               |
| `avatarPrefix`   | string          | 头像地址前缀，如 Gravatar 或 Cravatar 镜像地址            |
| `adminEnabled`   | boolean         | 是否启用博主标识相关展示                                  |
| `allowedDomains` | Array\<string\> | 允许调用组件的域名列表，留空则不限制                      |
| `adminKey`       | string\|null    | 管理员评论密钥（明文），仅通过管理后台接口返回            |
| `adminKeySet`    | boolean         | 是否已经设置过管理员管理员评论密钥                              |
| `requireReview`  | boolean         | 是否开启新评论先审核再显示（true 表示新评论默认为待审核） |
| `blockedIps`     | Array\<string\> | IP 黑名单列表，匹配到的 IP 提交评论将被拒绝               |
| `blockedEmails`  | Array\<string\> | 邮箱黑名单列表，匹配到的邮箱提交评论将被拒绝              |

**错误响应**

- 状态码：`500`

```json
{
	"message": "加载评论配置失败"
}
```

### 4.2 更新评论配置

```
PUT /admin/settings/comments
```

更新评论配置。

- 方法：`PUT`
- 路径：`/admin/settings/comments`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
	"adminEmail": "admin@example.com",
	"adminBadge": "站长",
	"avatarPrefix": "https://cravatar.cn/avatar",
	"adminEnabled": true,
	"allowedDomains": [],
	"adminKey": "your-admin-key",
	"requireReview": false,
	"blockedIps": ["1.1.1.1", "2.2.2.2"],
	"blockedEmails": ["spam@example.com", "bot@test.com"]
}
```

字段说明：

| 字段名           | 类型    | 必填 | 说明                                                               |
| ---------------- | ------- | ---- | ------------------------------------------------------------------ |
| `adminEmail`     | string  | 否   | 博主邮箱地址，需为合法邮箱                                         |
| `adminBadge`     | string  | 否   | 博主标识文字，例如 `"博主"`                                        |
| `avatarPrefix`   | string  | 否   | 头像地址前缀，如 Gravatar 或 Cravatar 镜像地址                     |
| `adminEnabled`   | boolean | 否   | 是否启用博主标识相关展示                                           |
| `allowedDomains` | Array   | 否   | 允许前端调用组件的域名列表                                         |
| `adminKey`       | string  | 否   | 管理员评论密钥，留空则表示清除密钥；设置后前台管理员评论需输入密钥 |
| `requireReview`  | boolean | 否   | 是否开启新评论先审核再显示（不传则保持不变）                       |
| `blockedIps`     | Array   | 否   | IP 黑名单列表，多个 IP 用逗号或换行分隔                            |
| `blockedEmails`  | Array   | 否   | 邮箱黑名单列表，多个邮箱用逗号或换行分隔                           |

**成功响应**

- 状态码：`200`

```json
{
	"message": "保存成功"
}
```

**错误响应**

- 邮箱格式错误：
  - 状态码：`400`

  ```json
  {
  	"message": "邮箱格式不正确"
  }
  ```

- 内部错误：
  - 状态码：`500`

  ```json
  {
  	"message": "保存失败"
  }
  ```

### 4.3 获取通知邮箱配置（已废弃）

```
GET /admin/settings/email
```

获取当前通知邮箱配置。

> [!NOTE]
> 此接口已被 `/admin/settings/email-notify` 替代，建议使用新接口获取完整的邮件通知配置。

- 方法：`GET`
- 路径：`/admin/settings/email`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
	"email": "admin@example.com"
}
```

**错误响应**

- 状态码：`500`

```json
{
	"message": "错误信息"
}
```

### 4.4 设置通知邮箱（已废弃）

```
PUT /admin/settings/email
```

设置通知邮箱，用于接收新评论提醒。

- 方法：`PUT`
- 路径：`/admin/settings/email`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
	"email": "admin@example.com"
}
```

**成功响应**

- 状态码：`200`

```json
{
	"message": "保存成功"
}
```

**错误响应**

- 邮箱格式不正确：
  - 状态码：`400`

  ```json
  {
  	"message": "邮箱格式不正确"
  }
  ```

- 服务器错误：
  - 状态码：`500`

  ```json
  {
  	"message": "错误信息"
  }
  ```

## 5. 邮件通知配置相关

### 5.1 获取邮件通知配置

```
GET /admin/settings/email-notify
```

获取邮件通知配置，包括 SMTP 配置和邮件模板。

- 方法：`GET`
- 路径：`/admin/settings/email-notify`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
  "globalEnabled": true,
  "smtp": {
    "host": "smtp.qq.com",
    "port": 465,
    "user": "noreply@qq.com",
    "pass": "",
    "secure": true
  },
  "templates": {
    "reply": "回复评论的邮件模板 HTML",
    "admin": "新评论通知的邮件模板 HTML"
  }
}
```

字段说明：

| 字段名         | 类型    | 说明                                                         |
| -------------- | ------- | ------------------------------------------------------------ |
| `globalEnabled` | boolean | 是否全局启用邮件通知                                           |
| `smtp.host`    | string  | SMTP 服务器地址，默认 `smtp.qq.com`                            |
| `smtp.port`    | number  | SMTP 服务器端口，默认 `465`                                  |
| `smtp.user`    | string  | SMTP 用户名（发件邮箱）                                      |
| `smtp.pass`    | string  | SMTP 密码（脱敏显示，不返回完整密码）                         |
| `smtp.secure`  | boolean | 是否使用 SSL/TLS，默认 `true`                                |
| `templates.reply` | string | 回复评论时的邮件模板，支持变量占位符                          |
| `templates.admin` | string | 新评论通知的邮件模板，支持变量占位符                          |

**邮件模板变量**

回复评论模板（`templates.reply`）支持的变量：

| 变量名            | 说明         |
| ----------------- | ------------ |
| `${toEmail}`      | 收件人邮箱   |
| `${toName}`       | 收件人昵称   |
| `${postTitle}`     | 文章标题     |
| `${parentComment}` | 被回复的评论内容 |
| `${replyAuthor}`   | 回复者昵称   |
| `${replyContent}`  | 回复内容     |
| `${postUrl}`      | 文章链接     |

新评论通知模板（`templates.admin`）支持的变量：

| 变量名            | 说明         |
| ----------------- | ------------ |
| `${postTitle}`     | 文章标题     |
| `${postUrl}`      | 文章链接     |
| `${commentAuthor}` | 评论者昵称   |
| `${commentContent}` | 评论内容     |

**错误响应**

- 状态码：`500`

```json
{
  "message": "错误信息"
}
```

### 5.2 更新邮件通知配置

```
PUT /admin/settings/email-notify
```

更新邮件通知配置，包括 SMTP 配置和邮件模板。

- 方法：`PUT`
- 路径：`/admin/settings/email-notify`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
  "globalEnabled": true,
  "smtp": {
    "host": "smtp.qq.com",
    "port": 465,
    "user": "noreply@qq.com",
    "pass": "your_password",
    "secure": true
  },
  "templates": {
    "reply": "<div>...</div>",
    "admin": "<div>...</div>"
  }
}
```

字段说明：

| 字段名         | 类型    | 必填 | 说明                                                         |
| -------------- | ------- | ---- | ------------------------------------------------------------ |
| `globalEnabled` | boolean | 否   | 是否全局启用邮件通知                                           |
| `smtp`        | object  | 否   | SMTP 配置对象                                                 |
| `smtp.host`    | string  | 否   | SMTP 服务器地址                                               |
| `smtp.port`    | number  | 否   | SMTP 服务器端口                                               |
| `smtp.user`       | string  | 否   | SMTP 用户名（发件邮箱）                                       |
| `smtp.pass`    | string  | 否   | SMTP 密码                                                     |
| `smtp.secure`  | boolean | 否   | 是否使用 SSL/TLS                                              |
| `templates`    | object  | 否   | 邮件模板对象                                                 |
| `templates.reply` | string | 否   | 回复评论的邮件模板 HTML                                        |
| `templates.admin` | string | 否   | 新评论通知的邮件模板 HTML                                      |

**成功响应**

- 状态码：`200`

```json
{
  "message": "保存成功"
}
```

**错误响应**

- 状态码：`500`

```json
{
  "message": "保存失败"
}
```

### 5.3 测试邮件发送

```
POST /admin/settings/email-test
```

测试邮件通知配置是否正确，发送一封测试邮件到指定邮箱。

- 方法：`POST`
- 路径：`/admin/settings/email-test`
- 鉴权：需要（Bearer Token）

**请求头**

| 名称           | 必填 | 示例               |
| -------------- | ---- | ------------------ |
| `Content-Type` | 是   | `application/json` |

**请求体**

```json
{
  "toEmail": "test@example.com",
  "smtp": {
    "host": "smtp.qq.com",
    "port": 465,
    "user": "noreply@qq.com",
    "pass": "your_password",
    "secure": true
  }
}
```

字段说明：

| 字段名      | 类型   | 必填 | 说明                                 |
| ----------- | ------ | ---- | ------------------------------------ |
| `toEmail`   | string | 是   | 接收测试邮件的邮箱地址              |
| `smtp`      | object  | 是   | SMTP 配置对象（与更新配置接口相同） |

**成功响应**

- 状态码：`200`

```json
{
  "message": "邮件发送成功"
}
```

**错误响应**

- 接收邮箱无效：
  - 状态码：`400`

  ```json
  {
    "message": "请输入有效的接收邮箱"
  }
  ```

- SMTP 配置不完整：
  - 状态码：`400`

  ```json
  {
    "message": "SMTP 配置不完整"
  }
  ```

- 邮件发送失败：
  - 状态码：`500`

  ```json
  {
    "message": "邮件发送失败: 具体错误信息"
  }
  ```

## 6. 统计数据相关

### 6.1 获取评论统计数据（数据看板）

```
GET /admin/stats/comments
```

用于管理后台「数据看板」展示评论整体统计、按域名统计以及最近 30 天评论趋势。

- 方法：`GET`
- 路径：`/admin/stats/comments`
- 鉴权：需要（Bearer Token）

**成功响应**

- 状态码：`200`

```json
{
	"summary": {
		"total": 123,
		"approved": 100,
		"pending": 20,
		"rejected": 3
	},
	"domains": [
		{
			"domain": "example.com",
			"total": 80,
			"approved": 70,
			"pending": 8,
			"rejected": 2
		},
		{
			"domain": "blog.example.com",
			"total": 30,
			"approved": 20,
			"pending": 9,
			"rejected": 1
		}
	],
	"last7Days": [
		{
			"date": "2026-01-15",
			"total": 10
		},
		{
			"date": "2026-01-16",
			"total": 12
		}
	]
}
```

字段说明：

| 字段名               | 类型                | 说明                                  |
| -------------------- | ------------------- | ------------------------------------- |
| `summary`            | object              | 评论整体汇总统计                      |
| `summary.total`      | number              | 评论总数                              |
| `summary.approved`   | number              | 已通过评论数                          |
| `summary.pending`    | number              | 待审核评论数                          |
| `summary.rejected`   | number              | 已拒绝评论数                          |
| `domains`            | Array\<DomainStat\> | 按域名聚合的评论统计列表              |
| `domains[].domain`   | string              | 解析后的域名（如 `example.com`）      |
| `domains[].total`    | number              | 该域名下评论总数                      |
| `domains[].approved` | number              | 该域名下已通过评论数                  |
| `domains[].pending`  | number              | 该域名下待审核评论数                  |
| `domains[].rejected` | number              | 该域名下已拒绝评论数                  |
| `last7Days`          | Array\<DailyStat\>  | 最近 30 天的每日评论数（按自然日聚合） |
| `last7Days[].date`   | string (YYYY-MM-DD) | 日期，UTC 时间格式化后的自然日        |
| `last7Days[].total`  | number              | 当日评论总数                          |

**错误响应**

- 状态码：`500`

```json
{
	"message": "获取统计数据失败"
}
```

## 7. 访问统计相关

### 7.1 获取访问统计概览

```
GET /admin/analytics/overview
```

用于管理后台「访问统计」页面展示整体访问数据，包括总 PV、总页面数以及最近 30 天的访问趋势。

- 方法：`GET`
- 路径：`/admin/analytics/overview`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称     | 位置  | 类型   | 必填 | 说明                                       |
| -------- | ----- | ------ | ---- | ------------------------------------------ |
| `domain` | query | string | 否   | 按域名筛选访问数据，传入域名，如 `example.com` |

**成功响应**

- 状态码：`200`

```json
{
  "totalPv": 1000,
  "totalPages": 50,
  "last30Days": [
    {
      "date": "2026-01-15",
      "total": 20
    },
    {
      "date": "2026-01-16",
      "total": 25
    }
  ]
}
```

字段说明：

| 字段名         | 类型                | 说明                                  |
| -------------- | ------------------- | ------------------------------------- |
| `totalPv`      | number              | 总访问量（PV）                        |
| `totalPages`   | number              | 总页面数                              |
| `last30Days`   | Array\<DailyStat\>  | 最近 30 天的每日访问数（按自然日聚合） |
| `last30Days[].date`   | string (YYYY-MM-DD) | 日期，UTC 时间格式化后的自然日        |
| `last30Days[].total`  | number              | 当日访问总数                          |

**错误响应**

- 状态码：`500`

```json
{
  "message": "获取访问统计概览失败"
}
```

### 7.2 获取页面访问统计

```
GET /admin/analytics/pages
```

用于管理后台「访问统计」页面展示各个页面的访问明细，支持按 PV 排序或最新访问排序。

- 方法：`GET`
- 路径：`/admin/analytics/pages`
- 鉴权：需要（Bearer Token）

**查询参数**

| 名称     | 位置  | 类型   | 必填 | 说明                                       |
| -------- | ----- | ------ | ---- | ------------------------------------------ |
| `domain` | query | string | 否   | 按域名筛选访问数据，传入域名，如 `example.com` |
| `order`  | query | string | 否   | 排序方式，`pv`（按访问量排序，默认）或 `latest`（最新访问） |

说明：

- 当前实现中固定返回前 20 条数据
- `order=pv`：按访问量降序排序，访问量相同时按最后访问时间降序排序
- `order=latest`：按最后访问时间降序排序，访问时间相同时按访问量降序排序

**成功响应**

- 状态码：`200`

```json
{
  "items": [
    {
      "postSlug": "https://example.com/blog/hello-world",
      "postTitle": "Hello World",
      "postUrl": "https://example.com/blog/hello-world",
      "pv": 100,
      "lastVisitAt": 1737593600000
    },
    {
      "postSlug": "https://example.com/about",
      "postTitle": "关于我",
      "postUrl": "https://example.com/about",
      "pv": 50,
      "lastVisitAt": 1737593500000
    }
  ]
}
```

字段说明：

| 字段名        | 类型   | 说明                       |
| ------------- | ------ | -------------------------- |
| `postSlug`    | string | 文章唯一标识符            |
| `postTitle`   | string \| null | 文章标题           |
| `postUrl`     | string \| null | 文章 URL          |
| `pv`          | number | 访问量（PV）              |
| `lastVisitAt` | number \| null | 最后访问时间戳（毫秒） |

**错误响应**

- 状态码：`500`

```json
{
  "message": "获取页面访问统计失败"
}
```
