import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import LayoutView from '../views/LayoutView.vue';
import CommentsView from '../views/CommentsView.vue';
import SettingsView from '../views/SettingsView.vue';
import DataView from '../views/DataView.vue';

const routes: RouteRecordRaw[] = [
	{
		path: '/login',
		name: 'login',
		component: LoginView
	},
	{
		path: '/',
		component: LayoutView,
		children: [
			{
				path: '',
				redirect: '/comments'
			},
			{
				path: 'comments',
				name: 'comments',
				component: CommentsView
			},
			{
				path: 'settings',
				name: 'settings',
				component: SettingsView
			},
			{
				path: 'data',
				name: 'data',
				component: DataView
			}
		]
	}
];

export const router = createRouter({
	history: createWebHistory(),
	routes
});

router.beforeEach((to, from, next) => {
	if (to.name === 'login') {
		next();
		return;
	}
	const token = localStorage.getItem('cwd_admin_token');
	if (!token) {
		next({ name: 'login' });
		return;
	}
	next();
});

