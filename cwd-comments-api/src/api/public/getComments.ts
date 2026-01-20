import { Context } from 'hono'
import { Bindings } from '../../bindings'
import { getCravatar } from '../../utils/getAvatar'

export const getComments = async (c: Context<{ Bindings: Bindings }>) => {
    const post_slug = c.req.query('post_slug')
  const page = parseInt(c.req.query('page') || '1')
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50)
  const nested = c.req.query('nested') !== 'false'
  const avatar_prefix = c.req.query('avatar_prefix')
  const offset = (page - 1) * limit

  if (!post_slug) return c.json({ message: "post_slug is required" }, 400)

  try {
    // 1. 查询审核通过的评论
    const query = `
      SELECT id, name, email, url, content_text as contentText, 
             content_html as contentHtml, created, parent_id as parentId,
             post_slug as postSlug
      FROM Comment 
      WHERE post_slug = ? AND status = "approved"
      ORDER BY created DESC
    `
    const { results } = await c.env.CWD_DB.prepare(query).bind(post_slug).all()

    // 2. 批量处理头像并格式化
    const allComments = await Promise.all(results.map(async (row: any) => ({
      ...row,
      avatar: await getCravatar(row.email, avatar_prefix || undefined),
      replies: []
    })))

    // 3. 处理嵌套逻辑（扁平化：2级往后的回复都放在根评论的 replies 中）
    if (nested) {
      const commentMap = new Map()
      const rootComments: any[] = []

      // 建立评论映射
      allComments.forEach(comment => commentMap.set(comment.id, comment))

      // 找出所有根评论
      allComments.forEach(comment => {
        if (!comment.parentId) {
          rootComments.push(comment)
        }
      })

      // 为每个非根评论找到其根评论，并添加 replyToAuthor 字段
      allComments.forEach(comment => {
        if (comment.parentId) {
          // 获取直接父评论的作者名
          const parentComment = commentMap.get(comment.parentId)
          if (parentComment) {
            comment.replyToAuthor = parentComment.name
          }

          // 向上查找根评论
          let rootId = comment.parentId
          let current = commentMap.get(rootId)
          while (current && current.parentId) {
            rootId = current.parentId
            current = commentMap.get(rootId)
          }

          // 将回复添加到根评论的 replies 中
          const rootComment = commentMap.get(rootId)
          if (rootComment && !rootComment.parentId) {
            rootComment.replies.push(comment)
          }
        }
      })

      // 对每个根评论的 replies 按时间正序排列
      rootComments.forEach(root => {
        root.replies.sort((a: any, b: any) =>
          a.created - b.created
        )
      })

      // 对根评论进行分页
      const paginatedData = rootComments.slice(offset, offset + limit)
      return c.json({
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: Math.ceil(rootComments.length / limit),
          totalCount: allComments.length,
        }
      })
    } else {
      // 非嵌套逻辑直接分页
      const paginatedData = allComments.slice(offset, offset + limit)
      return c.json({
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: Math.ceil(allComments.length / limit),
          totalCount: allComments.length,
        }
      })
    }
  } catch (e: any) {
    return c.json({ message: e.message }, 500)
  }
}