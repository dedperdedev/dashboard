# Инструкция по запуску Trade Admin Dashboard

## Структура проекта

Проект состоит из двух частей:
- **Frontend** - React + TypeScript приложение (Vite)
- **Backend** - Express API сервер для подключения к MongoDB

## Предварительные требования

- Node.js 18+ 
- npm или yarn
- Доступ к MongoDB базе данных

## Установка и запуск

### 1. Установка зависимостей Frontend

```bash
cd user-hub-dashboard-f5c43c42
npm install
```

### 2. Установка зависимостей Backend

```bash
cd user-hub-dashboard-f5c43c42/server
npm install
```

### 3. Запуск Backend API

В отдельном терминале:

```bash
cd user-hub-dashboard-f5c43c42/server
npm run dev
```

Backend API будет доступен на `http://localhost:3001`

### 4. Запуск Frontend

В отдельном терминале:

```bash
cd user-hub-dashboard-f5c43c42
npm run dev
```

Frontend будет доступен на `http://localhost:5173` (или другом порту, который укажет Vite)

## Настройка

### Переменные окружения

Создайте файл `.env` в корне проекта для настройки API URL:

```env
VITE_API_URL=http://localhost:3001/api
```

### Подключение к MongoDB

Настройки подключения к MongoDB находятся в файле:
`server/config/db.js`

Текущие настройки:
- Хост: `185.177.73.210:27017`
- База данных: `tradeBot`
- Пользователь: `tradebot_rw`

## API Endpoints

### Users
- `GET /api/users` - Список пользователей (с пагинацией и поиском)
- `GET /api/users/:id` - Получить пользователя по ID
- `GET /api/users/stats/summary` - Статистика пользователей

### Transactions
- `GET /api/transactions` - Список транзакций (с фильтрами)
- `GET /api/transactions/:id` - Получить транзакцию по ID
- `GET /api/transactions/stats/summary` - Статистика транзакций

### Positions
- `GET /api/positions` - Список позиций
- `GET /api/positions/stats/summary` - Статистика позиций

### Tasks
- `GET /api/tasks` - Список задач
- `GET /api/tasks/claimed` - Выполненные задачи

### Referrals
- `GET /api/referrals/levels` - Уровни реферальной программы
- `GET /api/referrals/stats` - Статистика рефералов

### Settings
- `GET /api/settings` - Получить настройки
- `PUT /api/settings` - Обновить настройки

### Stats
- `GET /api/stats/dashboard` - Общая статистика для дашборда

## Структура базы данных

База данных содержит следующие коллекции:
- `users` - Пользователи (2,333 документа)
- `transactions` - Транзакции (331 документ)
- `positions` - Позиции (202 документа)
- `tasks` - Задачи (2 документа)
- `claimedtasks` - Выполненные задачи (1,371 документ)
- `referrallevels` - Уровни реферальной программы (3 документа)
- `settings` - Настройки системы (1 документ)
- `positiontransactionhistories` - История транзакций позиций (пусто)

Подробный отчет о базе данных находится в файле `ОТЧЕТ_О_БАЗЕ_ДАННЫХ.md`

## Разработка

### Frontend
- Использует React Router для навигации
- React Query для управления состоянием API запросов
- shadcn-ui компоненты
- Tailwind CSS для стилей

### Backend
- Express.js для API сервера
- MongoDB native driver для работы с базой данных
- CORS включен для работы с фронтендом

## Проблемы и решения

### Ошибка подключения к MongoDB
Проверьте:
- Доступность сервера MongoDB
- Правильность учетных данных в `server/config/db.js`
- Сетевое подключение

### CORS ошибки
Убедитесь, что backend запущен и CORS настроен правильно в `server/index.js`

### API не отвечает
Проверьте, что:
- Backend сервер запущен на порту 3001
- URL в `.env` файле правильный
- Нет конфликтов портов
