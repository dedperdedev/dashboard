// Vercel Serverless Function - catch-all for /api/* (in _api to avoid double build)
import app, { connectDB } from '../server/index.js';

export default async function handler(req, res) {
  try {
    let path;
    const url = new URL(req.url || '/', 'http://localhost');
    const pathFromQuery = url.searchParams.get('path');
    if (pathFromQuery) {
      path = pathFromQuery.startsWith('/') ? pathFromQuery : `/${pathFromQuery}`;
    } else {
      const originalUrl = req.url || req.path || '/';
      path = originalUrl.startsWith('/api/') ? originalUrl.replace(/^\/api/, '') || '/' : (originalUrl === '/api' ? '/' : originalUrl);
    }

    if (path === '/health' || path === '/api/health') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).end(JSON.stringify({ status: 'ok', message: 'API работает' }));
    }

    try {
      await connectDB();
    } catch (dbErr) {
      console.error('DB connect failed:', dbErr.message);
      res.setHeader('Content-Type', 'application/json');
      return res.status(503).json({ error: 'Сервис недоступен', message: 'Нет подключения к БД' });
    }

    req.url = path;
    app(req, res);
  } catch (err) {
    console.error('API handler error:', err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: 'Ошибка сервера', message: err?.message || 'FUNCTION_INVOCATION_FAILED' });
    }
  }
}
