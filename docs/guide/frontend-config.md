# 前端配置

**这里仅提供一套开箱即用的方案，如果是个人开发者可以根据 [API 文档](../api/overview) 自行编写前端评论组件。**

## 评论组件初始化

在初始化 `CWDComments` 实例时，可以传入以下配置参数：

```html
<div id="comments"></div>
<script src="https://cwd-comments.zishu.me/cwd-comments.js"></script>
<script>
	const comments = new CWDComments({
		el: '#comments',
		apiBaseUrl: 'https://your-api.example.com', // 你部署的后端接口地址
	});
	comments.mount();
</script>
```

### 参数说明

| 参数         | 类型                    | 必填 | 默认值    | 说明                      |
| ------------ | ----------------------- | ---- | --------- | ------------------------- |
| `el`         | `string \| HTMLElement` | 是   | -         | 挂载元素选择器或 DOM 元素 |
| `apiBaseUrl` | `string`                | 是   | -         | API 基础地址              |
| `theme`      | `'light' \| 'dark'`     | 否   | `'light'` | 主题模式                  |
| `pageSize`   | `number`                | 否   | `20`      | 每页显示评论数            |

头像前缀、博主邮箱和标识等信息由后端接口 `/api/config/comments` 提供，无需在前端进行配置。

## 实例方法

| 方法                   | 说明                           |
| ---------------------- | ------------------------------ |
| `mount()`              | 挂载组件到 DOM                 |
| `unmount()`            | 卸载组件                       |
| `updateConfig(config)` | 更新配置（支持动态切换主题等） |
| `getConfig()`          | 获取当前配置                   |

## 使用示例

```javascript
// 动态切换主题
comments.updateConfig({ theme: 'dark' });
```

### 博客程序使用示例

### HTML

```html
<div id="comments"></div>
<script src="https://cwd-comments.zishu.me/cwd-comments.js"></script>
<script>
	const comments = new CWDComments({
		el: '#comments',
		apiBaseUrl: 'https://your-api.example.com', // 你部署的后端接口地址
	});
	comments.mount();
</script>
```

### Astro

```astro
<div id="comments"></div>
<script src="https://cwd-comments.zishu.me/cwd-comments.js" is:inline></script>
<script is:inline>
  document.addEventListener('DOMContentLoaded', () => {
    const comments = new window.CWDComments({
      el: '#comments',
      apiBaseUrl: 'https://your-api.example.com',
    });
    comments.mount();
  });
</script>
```
