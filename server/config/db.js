import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const _dbFilename = fileURLToPath(import.meta.url);
const _dbDirname = dirname(_dbFilename);
dotenv.config({ path: join(_dbDirname, '..', '.env') });

// Подключение к MongoDB из переменных окружения
const username = process.env.MONGODB_USERNAME || "";
const password = process.env.MONGODB_PASSWORD || "";
const host = process.env.MONGODB_HOST || "localhost";
const port = process.env.MONGODB_PORT || "27017";
const dbName = process.env.MONGODB_DB || "dashboard";
const authSource = process.env.MONGODB_AUTH_SOURCE || "admin";

const escaped_username = encodeURIComponent(username);
const escaped_password = encodeURIComponent(password);
const connectionString = `mongodb://${escaped_username}:${escaped_password}@${host}:${port}/${dbName}?authSource=${authSource}`;

let client = null;
let db = null;

export const connectDB = async () => {
  try {
    if (client && db) {
      return { client, db };
    }

    console.log('🔄 Подключение к MongoDB...');
    
    client = new MongoClient(connectionString);
    await client.connect();
    db = client.db(dbName);
    
    await db.admin().ping();
    
    console.log('✅ Подключение к MongoDB установлено');
    return { client, db };
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    client = null;
    db = null;
    throw error;
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error('База данных не подключена. Вызовите connectDB() сначала.');
  }
  return db;
};

export const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🔌 Подключение к MongoDB закрыто');
  }
};
