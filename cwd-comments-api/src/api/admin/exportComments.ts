import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const exportComments = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const { results } = await c.env.CWD_DB.prepare(
			'SELECT * FROM Comment ORDER BY pub_date DESC'
		).all();

		return c.json(results);
	} catch (e: any) {
		return c.json({ message: e.message || '导出失败' }, 500);
	}
};
