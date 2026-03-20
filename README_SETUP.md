# Setup Guide

## Prerequisites

- Node.js 18+
- MongoDB instance

## Configuration

Copy `server/.env.example` to `server/.env` and set your values:

```env
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
MONGODB_HOST=your_host
MONGODB_PORT=27017
MONGODB_DB=dashboard
MONGODB_AUTH_SOURCE=admin
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Running Locally

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start backend
cd server && npm run dev

# Start frontend (new terminal)
npm run dev
```
