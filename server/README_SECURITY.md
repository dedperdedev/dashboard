# Настройка безопасности

## Переменные окружения

Перед запуском сервера необходимо создать файл `.env` в папке `server/` на основе `.env.example`:

```bash
cd server
cp .env.example .env
```

Затем отредактируйте `.env` и укажите реальные значения:

```env
MONGODB_USERNAME=tradebot_rw
MONGODB_PASSWORD=ваш_пароль
MONGODB_HOST=185.177.73.210
MONGODB_PORT=27017
MONGODB_DB=tradeBot
MONGODB_AUTH_SOURCE=tradeBot

PORT=3001

FRONTEND_URL=http://localhost:5173
```

## Важно!

- **НЕ коммитьте** файл `.env` в git репозиторий
- Файл `.env` уже добавлен в `.gitignore`
- Используйте `.env.example` как шаблон

## Безопасность

Все учетные данные теперь хранятся в переменных окружения, а не в коде.
