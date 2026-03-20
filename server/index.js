import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB, getDB } from './config/db.js';
import usersRoutes from './routes/users.js';
import transactionsRoutes from './routes/transactions.js';
import positionsRoutes from './routes/positions.js';
import tasksRoutes from './routes/tasks.js';
import referralsRoutes from './routes/referrals.js';
import settingsRoutes from './routes/settings.js';
import statsRoutes from './routes/stats.js';

// Загружаем переменные окружения из файла .env в папке server (имена _index* чтобы не конфликтовать при бандле на Vercel)
const _indexFilename = fileURLToPath(import.meta.url);
const _indexDirname = dirname(_indexFilename);
dotenv.config({ path: join(_indexDirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Ограничиваем CORS только для указанных доменов
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  // Добавляем поддержку Vercel доменов
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL ? `https://${process.env.VERCEL}` : null
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения или Postman)
    if (!origin) return callback(null, true);
    
    // Разрешаем все Vercel домены
    if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Временно разрешаем все для отладки (можно убрать после настройки)
      console.log('CORS: Allowing origin:', origin);
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Определяем префикс API
// На Vercel префикс /api добавляется автоматически через rewrite в vercel.json
// Поэтому на Vercel маршруты должны быть без /api, локально - с /api
const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
const apiPrefix = isVercel ? '' : '/api';

// Корневой путь и health check — без проверки БД
app.get('/', (req, res) => {
  res.type('html').send(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Trade Admin API</title></head>
    <body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:1rem;">
      <h1>Trade Admin API</h1>
      <p>Сервер запущен. Это бэкенд API, не дашборд.</p>
      <ul>
        <li><a href="${apiPrefix}/health">${apiPrefix}/health</a> — проверка API</li>
      </ul>
      <p><strong>Дашборд:</strong> откройте <a href="http://localhost:8080">http://localhost:8080</a> (или http://localhost:5173)</p>
    </body>
    </html>
  `);
});

app.get(`${apiPrefix}/health`, (req, res) => {
  res.json({ status: 'ok', message: 'API работает' });
});

// Middleware для проверки подключения к БД (исключаем health и корень)
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  try {
    const db = getDB();
    req.db = db;
    next();
  } catch (error) {
    console.error('База данных не подключена:', error);
    res.status(503).json({ 
      error: 'Сервис временно недоступен', 
      message: 'База данных не подключена. Попробуйте позже.' 
    });
  }
});

// Routes

app.use(`${apiPrefix}/users`, usersRoutes);
app.use(`${apiPrefix}/transactions`, transactionsRoutes);
app.use(`${apiPrefix}/positions`, positionsRoutes);
app.use(`${apiPrefix}/tasks`, tasksRoutes);
app.use(`${apiPrefix}/referrals`, referralsRoutes);
app.use(`${apiPrefix}/settings`, settingsRoutes);
app.use(`${apiPrefix}/stats`, statsRoutes);

// Обработчик ошибок (async-ошибки из роутов нужно передавать в next(err))
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  if (!res.headersSent) res.status(500).json({ error: 'Ошибка сервера', message: err?.message || 'Unknown' });
});

// Для Vercel нужно экспортировать app как default export; connectDB — для _api/route.js
export default app;
export { connectDB };

// Локально запускаем сервер только если не на Vercel
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  // Пытаемся подключиться к базе данных перед запуском сервера
  console.log('🔄 Попытка подключения к MongoDB...');
  console.log('🔍 MONGODB_PASSWORD:', process.env.MONGODB_PASSWORD ? `SET (${process.env.MONGODB_PASSWORD.length} chars)` : 'NOT SET');
  
  connectDB()
    .then(({ db: connectedDb }) => {
      console.log('✅ Подключение к MongoDB установлено');
      console.log('✅ DB object:', connectedDb ? 'EXISTS' : 'NULL');
      app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
        console.log(`📊 API доступен на http://localhost:${PORT}/api`);
      });
    })
    .catch((error) => {
      console.error('❌ Не удалось подключиться к базе данных:', error.message);
      console.error('💡 Проверьте настройки в файле .env');
      console.error('💡 Детали ошибки:', error);
      // Все равно запускаем сервер, но он будет возвращать 503
      app.listen(PORT, () => {
        console.log(`⚠️ Сервер запущен БЕЗ подключения к БД на http://localhost:${PORT}`);
        console.log(`📊 API доступен, но запросы к БД будут возвращать ошибку 503`);
      });
    });
}
