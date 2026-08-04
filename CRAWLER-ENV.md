## Crawler env setup (minimum cost, maximum success)

This repo's crawler uses Playwright in the `crawler.worker.ts` process. To control proxy usage and reduce proxy bandwidth cost, configure these environment variables on the **worker runtime** (Railway workers service / VPS process env).

### Cheap mode (default)

- **Proxy**: keep disabled
- **Cookies**: enable (recommended for 1688/Alibaba)
- **Concurrency**: low
- **Bandwidth saver**: enabled (blocks images/fonts/media)

Set:

- `CRAWLER_WORKER_CONCURRENCY=1`
- `CRAWLER_MAX_CONCURRENT_PAGES=2`
- `CRAWLER_REQUEST_DELAY_MIN=2000`
- `CRAWLER_REQUEST_DELAY_MAX=6000`
- `CRAWLER_MAX_PAGES_PER_KEYWORD=2`
- `CRAWLER_SITE_COOKIES=<single-line JSON array>`
- `CRAWLER_REQUEST_BLOCKING_ENABLED=true`
- `CRAWLER_BLOCK_IMAGES=true`
- `CRAWLER_BLOCK_FONTS=true`
- `CRAWLER_BLOCK_MEDIA=true`

### Rescue mode (when you see blocks/captcha)

Enable residential proxies and rotate them:

- `CRAWLER_PROXY_URLS="http://user:pass@host1:port,http://user:pass@host2:port,..."`

Keep cheap-mode values the same.

### Cookies (`CRAWLER_SITE_COOKIES`)

- Use a normal browser to login to 1688/Alibaba.
- Export cookies using a cookie exporter (Cookie-Editor format works).
- Paste as a **single-line JSON array** into `CRAWLER_SITE_COOKIES`.

Do not commit real cookies to git.

### Notes

- `CRAWLER_PROXY_URL` supports a single proxy URL.
- `CRAWLER_PROXY_URLS` supports **comma-separated** proxies for round-robin rotation.
- Bandwidth saver is **best-effort**: if Playwright route interception isn't available, the crawler still runs.

