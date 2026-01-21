import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import FooterDoc from '../components/footerDoc.vue';

export default {
	...DefaultTheme,
	Layout() {
		const Layout = DefaultTheme.Layout;

		return h(Layout, null, {
			'doc-footer-before': () => h(FooterDoc),
			'home-features-after': () => h('div', { class: 'extra-class' }, [h(FooterDoc)]),
		});
	},
};
