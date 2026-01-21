import type { Context } from 'hono';
import type { Bindings } from '../../bindings';

type TrackVisitBody = {
	postSlug?: string;
	postTitle?: string;
	postUrl?: string;
};

function extractDomain(source: string | null | undefined): string | null {
	if (!source) {
		return null;
	}
	const value = source.trim();
	if (!value) {
		return null;
	}
	if (!/^https?:\/\//i.test(value)) {
		return null;
	}
	try {
		const url = new URL(value);
		return url.hostname.toLowerCase();
	} catch {
		return null;
	}
}

export const trackVisit = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const body = (await c.req.json().catch(() => ({}))) as TrackVisitBody;

		const rawPostSlug = typeof body.postSlug === 'string' ? body.postSlug.trim() : '';
		const rawPostTitle = typeof body.postTitle === 'string' ? body.postTitle.trim() : '';
		const rawPostUrl = typeof body.postUrl === 'string' ? body.postUrl.trim() : '';

		if (!rawPostSlug) {
			return c.json({ message: 'postSlug is required' }, 400);
		}

		await c.env.CWD_DB.prepare(
			'CREATE TABLE IF NOT EXISTS page_stats (id INTEGER PRIMARY KEY AUTOINCREMENT, post_slug TEXT UNIQUE NOT NULL, post_title TEXT, post_url TEXT, pv INTEGER NOT NULL DEFAULT 0, last_visit_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)'
		).run();

		await c.env.CWD_DB.prepare(
			'CREATE TABLE IF NOT EXISTS page_visit_daily (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, domain TEXT, count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
		).run();

		const nowDate = new Date();
		const nowTs = nowDate.getTime();
		const nowIso = nowDate.toISOString();
		const today = nowIso.slice(0, 10);

		const domain =
			extractDomain(rawPostUrl) ||
			extractDomain(rawPostSlug) ||
			null;

		const existing = await c.env.CWD_DB.prepare(
			'SELECT id, pv FROM page_stats WHERE post_slug = ?'
		)
			.bind(rawPostSlug)
			.first<{ id: number; pv: number }>();

		if (!existing) {
			await c.env.CWD_DB.prepare(
				'INSERT INTO page_stats (post_slug, post_title, post_url, pv, last_visit_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
			)
				.bind(
					rawPostSlug,
					rawPostTitle || null,
					rawPostUrl || null,
					1,
					nowTs,
					nowTs,
					nowTs
				)
				.run();
		} else {
			const newPv = (existing.pv || 0) + 1;
			await c.env.CWD_DB.prepare(
				'UPDATE page_stats SET post_title = ?, post_url = ?, pv = ?, last_visit_at = ?, updated_at = ? WHERE id = ?'
			)
				.bind(
					rawPostTitle || null,
					rawPostUrl || null,
					newPv,
					nowTs,
					nowTs,
					existing.id
				)
				.run();
		}

		let dailyRow:
			| {
					id: number;
					count: number;
			  }
			| null = null;

		if (domain) {
			dailyRow = await c.env.CWD_DB.prepare(
				'SELECT id, count FROM page_visit_daily WHERE date = ? AND domain = ?'
			)
				.bind(today, domain)
				.first<{ id: number; count: number }>();
		} else {
			dailyRow = await c.env.CWD_DB.prepare(
				'SELECT id, count FROM page_visit_daily WHERE date = ? AND domain IS NULL'
			)
				.bind(today)
				.first<{ id: number; count: number }>();
		}

		if (!dailyRow) {
			await c.env.CWD_DB.prepare(
				'INSERT INTO page_visit_daily (date, domain, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
			)
				.bind(today, domain, 1, nowIso, nowIso)
				.run();
		} else {
			const newCount = (dailyRow.count || 0) + 1;
			await c.env.CWD_DB.prepare(
				'UPDATE page_visit_daily SET count = ?, updated_at = ? WHERE id = ?'
			)
				.bind(newCount, nowIso, dailyRow.id)
				.run();
		}

		return c.json({ success: true });
	} catch (e: any) {
		return c.json({ message: e.message || '记录访问数据失败' }, 500);
	}
};

