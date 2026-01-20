import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const importComments = async (c: Context<{ Bindings: Bindings }>) => {
	try {
		const body = await c.req.json();
		const comments = Array.isArray(body) ? body : [body];

		if (comments.length === 0) {
			return c.json({ message: '导入数据为空' }, 400);
		}

        // 按 ID 升序排序，防止因外键约束导致插入失败（子评论先于父评论插入）
        comments.sort((a: any, b: any) => {
            const idA = a.id || 0;
            const idB = b.id || 0;
            return idA - idB;
        });

		// 简单的验证，确保至少包含必要字段
		// 实际上 Twikoo 的导出格式可能不同，但用户提供的 JSON 结构与 cwd-comments 几乎一致
		// 我们假设用户已经转换或者这就是他们想要的格式
        // 如果字段名不匹配，可能需要做映射。既然用户给出了明确的 JSON 结构，我们直接按照这个结构处理。

		const stmts = comments.map((comment: any) => {
			const {
				id,
				created,
				post_slug,
				name,
				email,
				url,
				ip_address,
				device,
				os,
				browser,
				ua,
				content_text,
				content_html,
				parent_id,
				status
			} = comment;

            // 如果 id 存在，我们尝试保留它。如果冲突，可能需要处理（这里暂且假设是空库导入或者不冲突）
            // 如果是导入 Twikoo，通常 Twikoo 没有 id (是 _id ObjectId)，或者是其他格式。
            // 但按照用户给的 JSON，是有 id 的。
            
            // 构建 SQL。
            // 能够处理 id 存在或不存在的情况
            const fields = [
                'created', 'post_slug', 'name', 'email', 'url',
                'ip_address', 'device', 'os', 'browser', 'ua',
                'content_text', 'content_html', 'parent_id', 'status'
            ];
            const values = [
                created || Date.now(),
                post_slug || "",
                name || "Anonymous",
                email || "",
                url || null,
                ip_address || null,
                device || null,
                os || null,
                browser || null,
                ua || null,
                content_text || "",
                content_html || "",
                parent_id || null,
                status || "approved"
            ];

            if (id) {
                fields.unshift('id');
                values.unshift(id);
            }

            const placeholders = fields.map(() => '?').join(', ');
            const sql = `INSERT OR REPLACE INTO Comment (${fields.join(', ')}) VALUES (${placeholders})`;
            
            return c.env.CWD_DB.prepare(sql).bind(...values);
		});

		// D1 的 batch 限制一次最多 100 条? 或者是 body size 限制。
        // 如果数量很大，需要分批。这里先假设数量不多，直接 batch。
        // 为了安全起见，可以分批处理，比如每 50 条。
        
        const BATCH_SIZE = 50;
        for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
            const batch = stmts.slice(i, i + BATCH_SIZE);
            await c.env.CWD_DB.batch(batch);
        }

		return c.json({ message: `成功导入 ${comments.length} 条评论` });
	} catch (e: any) {
        console.error(e);
		return c.json({ message: e.message || '导入失败' }, 500);
	}
};
