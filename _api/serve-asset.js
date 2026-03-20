/**
 * Отдаёт файлы из /assets/ с правильным Content-Type (обход MIME application/octet-stream на Vercel).
 * Запрос: GET /api/serve-asset?path=index-xxx.js
 * Функция запрашивает тот же файл по /assets/ и возвращает тело с нужным Content-Type.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.searchParams.get('path');
  if (!path || path.includes('..') || path.includes('/') || path.includes('\\')) {
    return res.status(400).end('Invalid path');
  }

  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'https';
  const origin = `${protocol}://${host}`;
  const assetUrl = `${origin}/assets/${path}`;

  let resp;
  try {
    resp = await fetch(assetUrl);
  } catch (e) {
    return res.status(502).end('Asset fetch failed');
  }

  if (!resp.ok) return res.status(resp.status).end();

  const contentType =
    path.endsWith('.js') ? 'text/javascript' :
    path.endsWith('.css') ? 'text/css' :
    'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  const buf = Buffer.from(await resp.arrayBuffer());
  res.status(200).end(buf);
}
