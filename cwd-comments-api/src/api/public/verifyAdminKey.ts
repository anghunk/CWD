import { Context } from 'hono';
import { Bindings } from '../../bindings';

export const verifyAdminKey = async (c: Context<{ Bindings: Bindings }>) => {
  const data = await c.req.json();
  const { adminToken } = data;
  const ip = c.req.header('cf-connecting-ip') || "127.0.0.1";

  if (!adminToken) {
    return c.json({ message: "请输入管理员密钥" }, 401);
  }

  // Check lock
  const lockKey = `admin_lock:${ip}`;
  const isLocked = await c.env.CWD_AUTH_KV.get(lockKey);
  if (isLocked) {
    return c.json({ message: "验证失败次数过多，请30分钟后再试" }, 403);
  }

  const adminKey = await c.env.CWD_DB.prepare('SELECT value FROM Settings WHERE key = ?').bind('comment_admin_key_hash').first<string>('value');

  if (!adminKey) {
     // If no key set, verification is technically successful or not needed?
     // If key is not set, we can't verify. Return success?
     // Requirement says "Provide admin key setting...".
     return c.json({ message: "未设置管理员密钥" }, 200); 
  }

  if (adminToken !== adminKey) {
    // Handle failure
    const failKey = `admin_fail:${ip}`;
    const failsStr = await c.env.CWD_AUTH_KV.get(failKey);
    let fails = failsStr ? parseInt(failsStr) : 0;
    fails++;

    if (fails >= 3) {
      await c.env.CWD_AUTH_KV.put(lockKey, '1', { expirationTtl: 1800 }); // 30 mins
      await c.env.CWD_AUTH_KV.delete(failKey);
      return c.json({ message: "验证失败次数过多，请30分钟后再试" }, 403);
    } else {
      await c.env.CWD_AUTH_KV.put(failKey, fails.toString(), { expirationTtl: 3600 }); // 1 hour reset
      return c.json({ message: "密钥错误" }, 401);
    }
  }

  // Success
  await c.env.CWD_AUTH_KV.delete(`admin_fail:${ip}`);
  return c.json({ message: "验证通过" });
};
