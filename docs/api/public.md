# 公开 API

本节描述无需认证即可访问的公开接口，包括评论获取、评论提交以及评论设置获取。

遵循 OpenAPI 风格进行组织，包含路径、方法、参数、请求体和响应示例。

## GET /api/comments

获取指定文章的评论列表。

- 方法：`GET`
- 路径：`/api/comments`
- 鉴权：不需要

### 查询参数

| 名称            | 位置  | 类型    | 必填 | 说明                                                |
| --------------- | ----- | ------- | ---- | --------------------------------------------------- |
| `post_slug`     | query | string  | 是   | `window.location.origin + window.location.pathname` |
| `page`          | query | integer | 否   | 页码，默认 `1`                                      |
| `limit`         | query | integer | 否   | 每页数量，默认 `20`，最大 `50`                      |
| `nested`        | query | string  | 否   | 是否返回嵌套结构，默认 `'true'`                     |

### 成功响应

- 状态码：`200`

```json
{
  "data": [
    {
      "id": 1,
      "author": "张三",
      "email": "zhangsan@example.com",
      "url": "https://example.com",
      "contentText": "很棒的文章！",
      "contentHtml": "很棒的文章！",
      "pubDate": "2026-01-13T10:00:00Z",
      "postSlug": "/blog/hello-world",
      "avatar": "https://gravatar.com/avatar/...",
      "replies": [
        {
          "id": 2,
          "author": "李四",
          "email": "lisi@example.com",
          "url": null,
          "contentText": "同感！",
          "contentHtml": "同感！",
          "pubDate": "2026-01-13T11:00:00Z",
          "postSlug": "/blog/hello-world",
          "avatar": "https://gravatar.com/avatar/...",
          "parentId": 1,
          "replyToAuthor": "张三"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalCount": 2
  }
}
```

说明：

- 当 `nested=true`（默认）时，接口返回的是“根评论列表”，每条根评论包含其 `replies`。
- 当 `nested=false` 时，接口返回扁平列表，所有评论都在 `data` 中，`replies` 为空。

### 错误响应

- 缺少 `post_slug`：

  - 状态码：`400`

  ```json
  {
    "message": "post_slug is required"
  }
  ```

- 服务器内部错误：

  - 状态码：`500`

  ```json
  {
    "message": "错误信息"
  }
  ```

## POST /api/comments

提交新评论或回复。

- 方法：`POST`
- 路径：`/api/comments`
- 鉴权：不需要

### 请求头

| 名称           | 必填 | 示例                         |
| -------------- | ---- | ---------------------------- |
| `Content-Type` | 是   | `application/json`          |

### 请求体（Request Body）

```json
{
  "post_slug": "/blog/hello-world",
  "post_title": "博客标题，可选",
  "post_url": "https://example.com/blog/hello-world",
  "author": "张三",
  "email": "zhangsan@example.com",
  "url": "https://zhangsan.me",
  "content": "很棒的文章！",
  "parent_id": 1
}
```

#### 字段说明

| 字段名       | 类型   | 必填 | 说明                                                         |
| ------------ | ------ | ---- | ------------------------------------------------------------ |
| `post_slug`  | string | 是   | 文章唯一标识符，应与前端组件初始化时的 `postSlug` 值一致    |
| `post_title` | string | 否   | 文章标题，用于邮件通知内容                                   |
| `post_url`   | string | 否   | 文章 URL，用于邮件通知中的跳转链接                           |
| `author`     | string | 是   | 评论者昵称                                                   |
| `email`      | string | 是   | 评论者邮箱，需为合法邮箱格式                                 |
| `url`        | string | 否   | 评论者个人主页或站点地址                                     |
| `content`    | string | 是   | 评论内容，内部会过滤 `<script>...</script>` 片段             |
| `parent_id`  | number | 否   | 父评论 ID，用于回复功能；缺省或 `null` 表示根评论           |

### 成功响应

- 状态码：`200`

```json
{
  "message": "Comment submitted. Awaiting moderation."
}
```

当前实现中评论会直接以 `approved` 状态写入数据库，后续如引入人工审核可在实现中调整为“待审核”状态。

### 错误响应与限流

- 请求体缺失或字段类型错误：

  - 状态码：`400`

  ```json
  {
    "message": "无效的请求体"
  }
  ```

- 缺少必填字段示例：

  - `post_slug` 为空：

    ```json
    {
      "message": "post_slug 必填"
    }
    ```

  - `content` 为空：

    ```json
    {
      "message": "评论内容不能为空"
    }
    ```

  - `author` 为空：

    ```json
    {
      "message": "昵称不能为空"
    }
    ```

  - `email` 为空或格式不正确：

    ```json
    {
      "message": "邮箱不能为空"
    }
    ```

    或

    ```json
    {
      "message": "邮箱格式不正确"
    }
    ```

- 评论频率限制：

  - 状态码：`429`
  - 逻辑：同一 IP 最近一条评论时间在 10 秒内，则拒绝此次请求。

  ```json
  {
    "message": "评论频繁，等10s后再试"
  }
  ```

- 服务器内部错误：

  - 状态码：`500`

  ```json
  {
    "message": "Internal Server Error"
  }
  ```

## GET /api/config/comments

获取评论相关的公开配置，用于前端组件读取博主邮箱、徽标等信息。

- 方法：`GET`
- 路径：`/api/config/comments`
- 鉴权：不需要

### 成功响应

- 状态码：`200`

```json
{
  "adminEmail": "admin@example.com",
  "adminBadge": "博主",
  "avatarPrefix": "https://gravatar.com/avatar",
  "adminEnabled": true
}
```

字段说明：

| 字段名         | 类型    | 说明                                             |
| -------------- | ------- | ------------------------------------------------ |
| `adminEmail`   | string  | 博主邮箱地址，用于在前端展示“博主”标识          |
| `adminBadge`   | string  | 博主标识文字，例如 `"博主"`                      |
| `avatarPrefix` | string  | 头像地址前缀，如 Gravatar 或 Cravatar 镜像地址  |
| `adminEnabled` | boolean | 是否启用博主标识相关功能                         |

### 错误响应

- 状态码：`500`

```json
{
  "message": "加载评论配置失败"
}
```
