import express from 'express';
import { getDB } from '../config/db.js';

const router = express.Router();

// Получить все задачи
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('tasks');
    
    const tasks = await collection.find({}).sort({ order: 1 }).toArray();
    
    const formattedTasks = tasks.map(task => ({
      id: task._id.toString(),
      name: task.name,
      description: task.description,
      category: task.category,
      type: task.type,
      link: task.link,
      chatId: task.chatId,
      imagePath: task.imagePath,
      order: task.order,
      hidden: task.hidden,
      rewards: task.rewards || [],
      createdAt: task.createdAt ? new Date(task.createdAt).toLocaleString('ru-RU') : null,
      updatedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleString('ru-RU') : null
    }));
    
    res.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить выполненные задачи
router.get('/claimed', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('claimedtasks');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const userId = req.query.userId;
    const query = userId ? { userId: parseFloat(userId) } : {};
    
    const [claimedTasks, total] = await Promise.all([
      collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query)
    ]);
    
    res.json({
      claimedTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении выполненных задач:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
