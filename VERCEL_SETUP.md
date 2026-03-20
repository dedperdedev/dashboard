# Настройка Vercel

## Сборка (vite-plugin-vercel)

Проект использует **vite-plugin-vercel**: сборка создаёт `.vercel/output` по [Build Output API v3](https://vercel.com/docs/build-output-api/v3). API лежит в папке `_api/` (один handler `_api/route.js` для всех `/api/*`).

**Важно в Vercel Dashboard (Settings → General):**
- **Framework Preset:** поставьте **Other** (не Vite). При пресете Vite Vercel по умолчанию использует только `dist/` и не подхватывает `.vercel/output` с API — из‑за этого `/api/health` даёт 404.
- **Output Directory:** оставьте пустым.
- **Root Directory:** пусто, если репо — уже папка проекта; если репо — родитель с подпапкой проекта — укажите её (например `user-hub-dashboard-f5c43c42`).

После смены Framework Preset на **Other** сделайте **Redeploy**. Если белый экран и ошибка MIME остаются — в Deployments выберите **Redeploy** и включите опцию **Clear Build Cache** (очистка кэша сборки и CDN).

## Переменные окружения

Добавьте следующие переменные в Vercel Dashboard (Settings → Environment Variables):

### Frontend переменные:
- `VITE_API_URL` = `https://ваш-домен.vercel.app/api`

### Backend переменные (MongoDB):
- `MONGODB_USERNAME` = `your_username`
- `MONGODB_PASSWORD` = `!2xwXsNHP@CAvA`
- `MONGODB_HOST` = `your_host`
- `MONGODB_PORT` = `27017`
- `MONGODB_DB` = `dashboard`
- `MONGODB_AUTH_SOURCE` = `dashboard`
- `FRONTEND_URL` = `https://ваш-домен.vercel.app`

**Важно:** Замените `ваш-домен.vercel.app` на реальный домен вашего проекта на Vercel.

## После настройки

1. Сохраните все переменные
2. Пересоберите проект (Redeploy)
3. Проверьте: `https://ваш-домен.vercel.app/api/health` - должен вернуть `{"status":"ok"}`

## Структура проекта

Проект настроен для работы на Vercel:
- Frontend: Vite build → `dist/`
- Backend: Serverless Functions → `server/index.js`
- Маршрутизация: `/api/*` → backend, остальное → frontend
