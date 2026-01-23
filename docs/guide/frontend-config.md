# 前端配置

**这里仅提供一套开箱即用的方案，如果是个人开发者可以根据 [API 文档](../api/overview) 自行编写前端评论组件。**

## 组件特性

CWD 评论组件采用 **Shadow DOM** 技术构建，基于独立根节点渲染，具备以下优势：

- **样式隔离**：组件样式完全独立，不会与宿主页面的样式产生冲突
- **DOM 隔离**：组件内部 DOM 结构与外部页面完全隔离，互不干扰
- **即插即用**：无需担心现有网站的样式框架（如 Bootstrap、Tailwind 等）影响组件显示
- **自定义样式**：通过 `customCssUrl` 参数注入自定义样式表，灵活调整外观

## 评论组件初始化

在初始化 `CWDComments` 实例时，可以传入以下配置参数：

```html
<div id="comments"></div>
<script src="https://cwd.js.org/cwd.js"></script>
<script>
	const comments = new CWDComments({
		el: '#comments',
		apiBaseUrl: 'https://your-api.example.com', // 换成你的 API 地址
	});
	comments.mount();
</script>
```

### 参数说明

| 参数           | 类型                    | 必填 | 默认值    | 说明                                       |
| -------------- | ----------------------- | ---- | --------- | ------------------------------------------ |
| `el`           | `string \| HTMLElement` | 是   | -         | 挂载元素选择器或 DOM 元素                  |
| `apiBaseUrl`   | `string`                | 是   | -         | API 基础地址                               |
| `theme`        | `'light' \| 'dark'`     | 否   | `'light'` | 主题模式                                   |
| `pageSize`     | `number`                | 否   | `20`      | 每页显示评论数                             |
| `customCssUrl` | `string`                | 否   | -         | 自定义样式表 URL，追加到 Shadow DOM 底部   |

头像前缀、博主邮箱和标识等信息由后端接口 `/api/config/comments` 提供，无需在前端进行配置。

当 `/admin/settings/comments` 中配置了“评论博主邮箱”时：

- 前台组件会将该邮箱视为“管理员邮箱”；
- 使用该邮箱发表评论时，会在邮箱输入框失焦后触发“管理员身份验证”弹窗；
- 验证通过后，会在浏览器本地保存一次管理员密钥（仅用于本机后续请求携带 `adminToken`）；
- 后端会在 `/api/comments` 中校验此密钥，确保管理员身份的评论需要额外验证。

## 实例方法

| 方法                   | 说明                           |
| ---------------------- | ------------------------------ |
| `mount()`              | 挂载组件到 DOM                 |
| `unmount()`            | 卸载组件                       |
| `updateConfig(config)` | 更新配置（支持动态切换主题等） |
| `getConfig()`          | 获取当前配置                   |

**使用示例**

```javascript
// 动态切换主题
comments.updateConfig({ theme: 'dark' });

// 配置自定义样式（会以 <link> 形式注入到 Shadow DOM 底部）
comments.updateConfig({
	customCssUrl: 'https://your-cdn.example.com/cwd-custom.css',
});
```

## 其他框架示例

如果你有其他博客框架的需求，欢迎在下方评论区留言。

### HTML

此方法适用于绝大多数博客框架，包括 Hexo、Hugo、Jekyll、WordPress 等。

```html
<div id="comments"></div>
<script src="https://cwd.js.org/cwd.js"></script>

<!-- 实例调用 -->
<script>
	const comments = new CWDComments({
		el: '#comments',
		apiBaseUrl: 'https://your-api.example.com', // 换成你的 API 地址
	});
	comments.mount();

	// 或者
	// document.addEventListener('DOMContentLoaded', () => {
	// 	const comments = new window.CWDComments({
	// 		el: '#comments',
	// 		apiBaseUrl: 'https://your-api.example.com',
	// 	});
	// 	comments.mount();
	// });
</script>
```

### Astro

```astro
<div id="comments"></div>
<script src="https://cwd.js.org/cwd.js" is:inline></script>
<script is:inline>
  document.addEventListener('DOMContentLoaded', () => {
    const comments = new window.CWDComments({
      el: '#comments',
      apiBaseUrl: 'https://your-api.example.com', // 换成你的 API 地址
    });
    comments.mount();
  });
</script>
```

### Vue

在 Vue 单文件组件里封装。

`CommentsWidget.vue`:

```html
<template>
	<div ref="comments"></div>
</template>

<script setup>
	import { onMounted, onBeforeUnmount, ref } from 'vue';

	const comments = ref(null);
	let instance = null;

	onMounted(async () => {
		if (!window.CWDComments) {
			await loadScript('https://cwd.js.org/cwd.js');
		}

		instance = new window.CWDComments({
			el: comments.value,
			apiBaseUrl: 'https://your-api.example.com', // 换成你的 API 地址
		});
		instance.mount();
	});

	onBeforeUnmount(() => {
		instance = null;
	});

	function loadScript(src) {
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = src;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = (e) => reject(e);
			document.head.appendChild(script);
		});
	}
</script>
```
