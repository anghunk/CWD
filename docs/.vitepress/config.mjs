import { defineConfig } from 'vitepress';

export default defineConfig({
	title: 'CWD 评论系统文档',
	description: '基于 Cloudflare Workers 的轻量级评论系统',
	lang: 'zh-CN',
	outline: {
		level: [2, 3, 4],
		label: 'On this page',
	},
	head: [
		[
			'link',
			{
				rel: 'icon',
				href: 'https://github.com/anghunk/cwd-comments/blob/main/icon.png?raw=true',
			},
		],
	],
	themeConfig: {
		nav: [
			{ text: '首页', link: '/' },
			{ text: '配置', link: '/guide/getting-started' },
			{ text: 'API', link: '/api/overview' },
		],

		sidebar: [
			{
				text: '快速开始',
				items: [
					{ text: '项目介绍', link: '/guide/getting-started' },
					{ text: '后端配置', link: '/guide/backend-config' },
					{ text: '前端配置', link: '/guide/frontend-config' },
				],
			},
			{
				text: '功能',
				items: [
					{ text: '管理后台', link: '/function/admin-panel' },
					{ text: '数据迁移', link: '/function/data-migration' },
				],
			},
			{
				text: 'API 文档',
				items: [
					{ text: '概览', link: '/api/overview' },
					{ text: '公开 API', link: '/api/public' },
					{ text: '管理员 API', link: '/api/admin' },
				],
			},
		],

		socialLinks: [{ icon: 'github', link: 'https://github.com/anghunk/cwd-comments' }],

		footer: {
			message: '基于 Cloudflare Workers 构建',
			copyright: 'Copyright © 2026',
		},
	},
});
