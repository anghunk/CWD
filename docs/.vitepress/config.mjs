import nav from './configs/nav';
import sidebar from './configs/sidebar';
import { defineConfig } from 'vitepress';

export default defineConfig({
	title: 'CWD 评论系统文档',
	description: '基于 Cloudflare Workers 的轻量级评论系统',
	lang: 'zh-CN',
	head: [
		[
			'link',
			{
				rel: 'icon',
				href: 'https://github.com/anghunk/CWD/blob/main/icon.png?raw=true',
			},
		],
	],
	themeConfig: {
		nav,
		sidebar,
		outline: {
			level: [2,3],
			label: 'On this page',
		},
		editLink: {
			pattern: 'https://github.com/anghunk/CWD/blob/main/docs/:path',
			text: '在 GitHub 上编辑此页面',
		},
		socialLinks: [{ icon: 'github', link: 'https://github.com/anghunk/CWD' }],

		lastUpdated: true,
		lastUpdatedText: '最后更新于',
		footer: {
			message: '基于 Cloudflare Workers 构建',
			copyright: 'Copyright © 2026',
		},
		search: {
			provider: 'local',
			options: {
				locales: {
					zh: {
						translations: {
							button: {
								buttonText: '搜索文档',
								buttonAriaLabel: '搜索文档',
							},
							modal: {
								noResultsText: '无法找到相关结果',
								resetButtonTitle: '清除查询条件',
								footer: {
									selectText: '选择',
									navigateText: '切换',
								},
							},
						},
					},
				},
			},
		},
	},
});
