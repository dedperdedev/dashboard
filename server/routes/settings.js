import express from 'express';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Получить настройки
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('settings');
    
    const settings = await collection.findOne({});
    
    if (!settings) {
      return res.status(404).json({ error: 'Настройки не найдены' });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Ошибка при получении настроек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить настройки
router.put('/', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('settings');
    
    const settings = await collection.findOne({});
    
    if (!settings) {
      return res.status(404).json({ error: 'Настройки не найдены' });
    }
    
    const updatedSettings = {
      ...settings,
      ...req.body,
      updatedAt: new Date()
    };
    
    await collection.updateOne(
      { _id: settings._id },
      { $set: updatedSettings }
    );
    
    res.json(updatedSettings);
  } catch (error) {
    console.error('Ошибка при обновлении настроек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
