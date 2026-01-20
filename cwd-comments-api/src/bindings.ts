export type Bindings = {
  CWD_DB: D1Database
  CWD_AUTH_KV: KVNamespace;
  ALLOW_ORIGIN: string
  MAIL_GATEWAY_URL?: string
  MAIL_GATEWAY_TOKEN?: string
  ADMIN_NAME: string
  ADMIN_PASSWORD: string
}
