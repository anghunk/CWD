import { Context } from 'hono';
import { Bindings } from '../../bindings';
import { getCravatar } from '../../utils/getAvatar';

const COMMENT_AVATAR_PREFIX_KEY = 'comment_avatar_prefix';

export const listComments = async (c: Context<{ Bindings: Bindings }>) => {
	const page = parseInt(c.req.query('page') || '1');
	const limit = 10;
	const offset = (page - 1) * limit;

	const totalCount = await c.env.CWD_DB.prepare(
		'SELECT COUNT(*) as count FROM Comment'
	).first<{ count: number }>();

	const { results } = await c.env.CWD_DB.prepare(
		'SELECT * FROM Comment ORDER BY pub_date DESC LIMIT ? OFFSET ?'
	)
		.bind(limit, offset)
		.all();

	await c.env.CWD_DB.prepare(
		'CREATE TABLE IF NOT EXISTS Settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
	).run();
	const avatarRow = await c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?')
		.bind(COMMENT_AVATAR_PREFIX_KEY)
		.first<{ value: string }>();
	const avatarPrefix = avatarRow?.value || null;

	const data = await Promise.all(
		results.map(async (row: any) => ({
			id: row.id,
			pubDate: row.pub_date,
			author: row.author,
			email: row.email,
			postSlug: row.post_slug,
			url: row.url,
			ipAddress: row.ip_address,
			contentText: row.content_text,
			contentHtml: row.content_html,
			status: row.status,
			avatar: await getCravatar(row.email, avatarPrefix || undefined)
		}))
	);

	return c.json({
		data,
		pagination: {
			page,
			limit,
			total: Math.ceil(((totalCount?.count as number) || 0) / limit)
		}
	});
};
