import { Hono } from 'hono';
import { Bindings } from './bindings';
import { customCors } from './utils/cors';
import { adminAuth } from './utils/auth';
import {
	isValidEmail,
	loadEmailNotificationSettings,
	saveEmailNotificationSettings
} from './utils/email';
import packageJson from '../package.json';

import { getComments } from './api/public/getComments';
import { postComment } from './api/public/postComment';
import { verifyAdminKey } from './api/public/verifyAdminKey';
import { adminLogin } from './api/admin/login';
import { deleteComment } from './api/admin/deleteComment';
import { listComments } from './api/admin/listComments';
import { exportComments } from './api/admin/exportComments';
import { importComments } from './api/admin/importComments';
import { updateStatus } from './api/admin/updateStatus';
import { getAdminEmail } from './api/admin/getAdminEmail';
import { setAdminEmail } from './api/admin/setAdminEmail';
import { testEmail } from './api/admin/testEmail';

const app = new Hono<{ Bindings: Bindings }>();
const VERSION = `v${packageJson.version}`;

const COMMENT_ADMIN_EMAIL_KEY = 'comment_admin_email';
const COMMENT_ADMIN_BADGE_KEY = 'comment_admin_badge';
const COMMENT_AVATAR_PREFIX_KEY = 'comment_avatar_prefix';
const COMMENT_ADMIN_ENABLED_KEY = 'comment_admin_enabled';
const COMMENT_ALLOWED_DOMAINS_KEY = 'comment_allowed_domains';
const COMMENT_ADMIN_KEY_HASH_KEY = 'comment_admin_key_hash';


async function loadCommentSettings(env: Bindings) {
	await env.CWD_DB.prepare(
		'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
	).run();
	const keys = [
		COMMENT_ADMIN_EMAIL_KEY,
		COMMENT_ADMIN_BADGE_KEY,
		COMMENT_AVATAR_PREFIX_KEY,
		COMMENT_ADMIN_ENABLED_KEY,
		COMMENT_ALLOWED_DOMAINS_KEY,
		COMMENT_ADMIN_KEY_HASH_KEY
	];
	const { results } = await env.CWD_DB.prepare(
		'SELECT key, value FROM Settings WHERE key IN (?, ?, ?, ?, ?, ?)'
	)
		.bind(...keys)
		.all<{ key: string; value: string }>();

	const map = new Map<string, string>();
	for (const row of results) {
		if (row && row.key) {
			map.set(row.key, row.value);
		}
	}

	const enabledRaw = map.get(COMMENT_ADMIN_ENABLED_KEY) ?? null;
	const adminEnabled = enabledRaw === '1';

	// 解析允许的域名列表
	const allowedDomainsRaw = map.get(COMMENT_ALLOWED_DOMAINS_KEY) ?? '';
	const allowedDomains = allowedDomainsRaw
		? allowedDomainsRaw.split(',').map((d) => d.trim()).filter(Boolean)
		: [];

	return {
		adminEmail: map.get(COMMENT_ADMIN_EMAIL_KEY) ?? null,
		adminBadge: map.get(COMMENT_ADMIN_BADGE_KEY) ?? null,
		avatarPrefix: map.get(COMMENT_AVATAR_PREFIX_KEY) ?? null,
		adminEnabled,
		allowedDomains,
		adminKey: map.get(COMMENT_ADMIN_KEY_HASH_KEY) ?? null,
		adminKeySet: !!map.get(COMMENT_ADMIN_KEY_HASH_KEY)
	};
}

async function saveCommentSettings(
	env: Bindings,
	settings: {
		adminEmail?: string;
		adminBadge?: string;
		avatarPrefix?: string;
		adminEnabled?: boolean;
		allowedDomains?: string[];
		adminKey?: string;
	}
) {
	await env.CWD_DB.prepare(
		'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
	).run();

	let adminKeyValue: string | undefined;
	if (settings.adminKey !== undefined) {
		adminKeyValue = settings.adminKey;
	}

	const entries: { key: string; value: string | null | undefined }[] = [
		{ key: COMMENT_ADMIN_EMAIL_KEY, value: settings.adminEmail },
		{ key: COMMENT_ADMIN_BADGE_KEY, value: settings.adminBadge },
		{ key: COMMENT_AVATAR_PREFIX_KEY, value: settings.avatarPrefix },
		{
			key: COMMENT_ADMIN_ENABLED_KEY,
			value:
				typeof settings.adminEnabled === 'boolean'
					? settings.adminEnabled
						? '1'
						: '0'
					: undefined
		},
		{
			key: COMMENT_ALLOWED_DOMAINS_KEY,
			value: settings.allowedDomains ? settings.allowedDomains.join(',') : undefined
		},
		{
			key: COMMENT_ADMIN_KEY_HASH_KEY,
			value: adminKeyValue
		}
	];

	for (const entry of entries) {
		if (entry.value !== undefined) {
			const value = entry.value === null ? '' : entry.value;
			const trimmed = typeof value === 'string' ? value.trim() : value;
			if (trimmed) {
				await env.CWD_DB.prepare('REPLACE INTO Settings (key, value) VALUES (?, ?)')
					.bind(entry.key, trimmed)
					.run();
			} else {
				await env.CWD_DB.prepare('DELETE FROM Settings WHERE key = ?').bind(entry.key).run();
			}
		}
	}
}

app.use('*', async (c, next) => {
	console.log('Request:start', {
		method: c.req.method,
		path: c.req.path,
		url: c.req.url,
		hasDb: !!c.env.CWD_DB,
		hasAuthKv: !!c.env.CWD_AUTH_KV
	});
	const res = await next();
	console.log('Request:end', {
		method: c.req.method,
		path: c.req.path
	});
	return res;
});

app.use('/api/*', async (c, next) => {
	const corsMiddleware = customCors();
	return corsMiddleware(c, next);
});
app.use('/admin/*', async (c, next) => {
	const corsMiddleware = customCors();
	return corsMiddleware(c, next);
});

app.get('/', (c) => {
	return c.html(
		`CWD 评论部署成功，当前版本 ${VERSION}，<a href="https://github.com/anghunk/cwd-comments" target="_blank" rel="noreferrer">查看文档</a>`
	);
});

app.get('/api/comments', getComments);
app.post('/api/comments', postComment);
app.post('/api/verify-admin', verifyAdminKey);
app.get('/api/config/comments', async (c) => {
	try {
		const settings = await loadCommentSettings(c.env);
		return c.json(settings);
	} catch (e: any) {
		return c.json({ message: e.message || '加载评论配置失败' }, 500);
	}
});

app.post('/admin/login', adminLogin);
app.use('/admin/*', adminAuth);
app.delete('/admin/comments/delete', deleteComment);
app.get('/admin/comments/list', listComments);
app.get('/admin/comments/export', exportComments);
app.post('/admin/comments/import', importComments);
app.put('/admin/comments/status', updateStatus);
app.get('/admin/settings/email', getAdminEmail);
app.put('/admin/settings/email', setAdminEmail);
app.get('/admin/settings/email-notify', async (c) => {
	try {
		const settings = await loadEmailNotificationSettings(c.env);
		return c.json(settings);
	} catch (e: any) {
		return c.json({ message: e.message || '加载邮件通知配置失败' }, 500);
	}
});
app.put('/admin/settings/email-notify', async (c) => {
	try {
		const body = await c.req.json();
		const globalEnabled =
			typeof body.globalEnabled === 'boolean' ? body.globalEnabled : undefined;
		const smtp = body.smtp && typeof body.smtp === 'object' ? body.smtp : undefined;
		const templates = body.templates && typeof body.templates === 'object' ? body.templates : undefined;

		await saveEmailNotificationSettings(c.env, {
			globalEnabled,
			smtp,
			templates
		});

		return c.json({ message: '保存成功' });
	} catch (e: any) {
		return c.json({ message: e.message || '保存失败' }, 500);
	}
});

app.post('/admin/settings/email-test', testEmail);
app.get('/admin/settings/comments', async (c) => {
	try {
		const settings = await loadCommentSettings(c.env);
		return c.json(settings);
	} catch (e: any) {
		return c.json({ message: e.message || '加载评论配置失败' }, 500);
	}
});
app.put('/admin/settings/comments', async (c) => {
	try {
		const body = await c.req.json();
		const rawAdminEmail = typeof body.adminEmail === 'string' ? body.adminEmail : '';
		const rawAdminBadge = typeof body.adminBadge === 'string' ? body.adminBadge : '';
		const rawAvatarPrefix = typeof body.avatarPrefix === 'string' ? body.avatarPrefix : '';
		const rawAdminEnabled = body.adminEnabled;
		const rawAllowedDomains = Array.isArray(body.allowedDomains) ? body.allowedDomains : [];
		const rawAdminKey = typeof body.adminKey === 'string' ? body.adminKey : undefined;

		const adminEmail = rawAdminEmail.trim();
		const adminBadge = rawAdminBadge.trim();
		const avatarPrefix = rawAvatarPrefix.trim();
		const adminEnabled =
			typeof rawAdminEnabled === 'boolean'
				? rawAdminEnabled
				: rawAdminEnabled === '1' || rawAdminEnabled === 1;
		const allowedDomains = rawAllowedDomains
			.map((d: any) => (typeof d === 'string' ? d.trim() : ''))
			.filter(Boolean);
		const adminKey = rawAdminKey; // Can be undefined or empty string

		if (adminEmail && !isValidEmail(adminEmail)) {
			return c.json({ message: '邮箱格式不正确' }, 400);
		}

		await saveCommentSettings(c.env, {
			adminEmail,
			adminBadge,
			avatarPrefix,
			adminEnabled,
			allowedDomains,
			adminKey
		});

		return c.json({ message: '保存成功' });
	} catch (e: any) {
		return c.json({ message: e.message || '保存失败' }, 500);
	}
});

export default app;
