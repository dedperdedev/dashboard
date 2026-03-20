# Dashboard Template

A ready-to-use dashboard template built with React, TypeScript, Tailwind CSS, and shadcn/ui components. Includes a Node.js/Express backend with MongoDB support.

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router v6
- React Query
- Recharts

**Backend:**
- Node.js + Express
- MongoDB

## Getting Started

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
cd server && npm install
```

### 3. Configure the database

Copy `server/.env.example` to `server/.env` and fill in your MongoDB connection details:

```bash
cp server/.env.example server/.env
```

### 4. Run in development mode

Start the backend:
```bash
cd server && npm run dev
```

Start the frontend:
```bash
npm run dev
```

The frontend runs on [http://localhost:8080](http://localhost:8080), the backend on [http://localhost:3001](http://localhost:3001).

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── dashboard/     # Dashboard-specific components
│   │   └── ui/            # shadcn/ui base components
│   ├── pages/             # Route pages
│   ├── lib/               # API client and utilities
│   └── hooks/             # Custom React hooks
├── server/
│   ├── config/            # Database connection
│   ├── routes/            # API route handlers
│   └── index.js           # Express server entry point
└── public/
```

## Available Pages

- `/` — Main dashboard with stats, charts, and recent data
- `/users` — Users list and detail pages
- `/transactions` — Transaction history
- `/positions` — Positions overview
- `/referrals` — Referral tree
- `/tasks` — Task management
- `/settings` — Application settings

## Deployment

See [VERCEL_SETUP.md](VERCEL_SETUP.md) for Vercel deployment instructions.
