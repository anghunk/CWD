# 管理员 API

管理员接口用于登录后台、查看和管理评论、配置邮件通知和评论显示设置。

除登录接口外，所有管理员接口都需要在请求头中携带 Bearer Token。

```http
Authorization: Bearer <token>
```

Token 通过登录接口获取，有效期为 24 小时。

## 管理员登录

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

## 获取评论列表

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

## 更新评论状态

```
PUT /admin/comments/status
```

更新评论状态（例如通过 / 拒绝）。

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

## 删除指定评论

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

## 导出所有评论数据

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

## 导入评论数据

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

## 获取当前通知邮箱配置

```
GET /admin/settings/email
```

获取当前通知邮箱配置。

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

## 设置通知邮箱

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

## 获取评论配置

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
| `adminEmail`     | string          | 博主邮箱地址，用于显示“博主”标识以及管理员身份验证        |
| `adminBadge`     | string          | 博主标识文字，例如 `"博主"`                               |
| `avatarPrefix`   | string          | 头像地址前缀，如 Gravatar 或 Cravatar 镜像地址            |
| `adminEnabled`   | boolean         | 是否启用博主标识相关展示                                  |
| `allowedDomains` | Array\<string\> | 允许调用组件的域名列表，留空则不限制                      |
| `adminKey`       | string\|null    | 管理员评论密钥（明文），仅通过管理后台接口返回            |
| `adminKeySet`    | boolean         | 是否已经设置过管理员评论密钥                              |
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

## 更新评论配置

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

## 将指定 IP 加入评论黑名单

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

## 将指定邮箱加入评论黑名单

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

## 获取评论统计数据（数据看板）

```
GET /admin/stats/comments
```

用于管理后台「数据看板」展示评论整体统计、按域名统计以及最近 7 天评论趋势。

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
| `last7Days`          | Array\<DailyStat\>  | 最近 7 天的每日评论数（按自然日聚合） |
| `last7Days[].date`   | string (YYYY-MM-DD) | 日期，UTC 时间格式化后的自然日        |
| `last7Days[].total`  | number              | 当日评论总数                          |

**错误响应**

- 状态码：`500`

```json
{
	"message": "获取统计数据失败"
}
```
