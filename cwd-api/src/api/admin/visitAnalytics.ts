import type { Context } from 'hono';
import type { Bindings } from '../../bindings';

type VisitOverview = {
	totalPv: number;
	totalPages: number;
	last30Days: {
		date: string;
		total: number;
	}[];
};

type VisitPageItem = {
	postSlug: string;
	postTitle: string | null;
	postUrl: string | null;
	pv: number;
	lastVisitAt: string | null;
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

export const getVisitOverview = async (
	c: Context<{ Bindings: Bindings }>
) => {
	try {
		const rawDomain = c.req.query('domain') || '';
		const domainFilter = rawDomain.trim().toLowerCase();

		await c.env.CWD_DB.prepare(
			'CREATE TABLE IF NOT EXISTS page_stats (id INTEGER PRIMARY KEY AUTOINCREMENT, post_slug TEXT UNIQUE NOT NULL, post_title TEXT, post_url TEXT, pv INTEGER NOT NULL DEFAULT 0, last_visit_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)'
		).run();

		await c.env.CWD_DB.prepare(
			'CREATE TABLE IF NOT EXISTS page_visit_daily (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, domain TEXT, count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
		).run();

		const { results } = await c.env.CWD_DB.prepare(
			'SELECT post_slug, post_title, post_url, pv, last_visit_at FROM page_stats'
		).all<{
			post_slug: string;
			post_title: string | null;
			post_url: string | null;
			pv: number;
			last_visit_at: number | null;
		}>();

		let totalPv = 0;
		let totalPages = 0;

		for (const row of results) {
			const domain =
				extractDomain(row.post_url) ||
				extractDomain(row.post_slug) ||
				null;

			if (domainFilter && domain !== domainFilter) {
				continue;
			}

			totalPv += row.pv || 0;
			totalPages += 1;
		}

		const now = new Date();
		const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
		const startDate = thirtyDaysAgo.toISOString().slice(0, 10);

		let dailySql =
			'SELECT date, domain, count FROM page_visit_daily WHERE date >= ?';
		const params: string[] = [startDate];

		if (domainFilter) {
			dailySql += ' AND domain = ?';
			params.push(domainFilter);
		}

		const { results: dailyRows } = await c.env.CWD_DB.prepare(dailySql)
			.bind(...params)
			.all<{
				date: string;
				domain: string | null;
				count: number;
			}>();

		const dailyMap = new Map<string, number>();

		for (const row of dailyRows) {
			if (!row || !row.date) {
				continue;
			}
			const key = row.date;
			const value = row.count || 0;
			dailyMap.set(key, (dailyMap.get(key) || 0) + value);
		}

		if (dailyMap.size === 0 && totalPv > 0) {
			const fallbackDate = now.toISOString().slice(0, 10);
			dailyMap.set(fallbackDate, totalPv);
		}

		const last30Days: { date: string; total: number }[] = [];
		for (let i = 29; i >= 0; i--) {
			const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
			const year = d.getUTCFullYear();
			const month = String(d.getUTCMonth() + 1).padStart(2, '0');
			const day = String(d.getUTCDate()).padStart(2, '0');
			const key = `${year}-${month}-${day}`;
			last30Days.push({
				date: key,
				total: dailyMap.get(key) || 0
			});
		}

		const data: VisitOverview = {
			totalPv,
			totalPages,
			last30Days
		};

		return c.json(data);
	} catch (e: any) {
		return c.json(
			{ message: e.message || '获取访问统计概览失败' },
			500
		);
	}
};

export const getVisitPages = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const rawDomain = c.req.query('domain') || '';
		const domainFilter = rawDomain.trim().toLowerCase();

		await c.env.CWD_DB.prepare(
			'CREATE TABLE IF NOT EXISTS page_stats (id INTEGER PRIMARY KEY AUTOINCREMENT, post_slug TEXT UNIQUE NOT NULL, post_title TEXT, post_url TEXT, pv INTEGER NOT NULL DEFAULT 0, last_visit_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)'
		).run();

		const { results } = await c.env.CWD_DB.prepare(
			'SELECT post_slug, post_title, post_url, pv, last_visit_at FROM page_stats ORDER BY pv DESC, last_visit_at DESC'
		).all<{
			post_slug: string;
			post_title: string | null;
			post_url: string | null;
			pv: number;
			last_visit_at: number | null;
		}>();

		const items: VisitPageItem[] = [];

		for (const row of results) {
			const domain =
				extractDomain(row.post_url) ||
				extractDomain(row.post_slug) ||
				null;

			if (domainFilter && domain !== domainFilter) {
				continue;
			}

			items.push({
				postSlug: row.post_slug,
				postTitle: row.post_title,
				postUrl: row.post_url,
				pv: row.pv || 0,
				lastVisitAt: row.last_visit_at
			});
		}

		return c.json({ items });
	} catch (e: any) {
		return c.json(
			{ message: e.message || '获取页面访问统计失败' },
			500
		);
	}
};
