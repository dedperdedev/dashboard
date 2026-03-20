import express from 'express';
import { getDB } from '../config/db.js';

const router = express.Router();

// Получить все позиции
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('positions');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const status = req.query.status;
    const currency = req.query.currency;
    const userId = req.query.userId;
    const positionType = req.query.positionType;
    
    const query = {};
    if (status) query.status = status;
    if (currency) query.currency = currency;
    if (positionType) {
      query.$or = [
        { positionType: positionType },
        { type: positionType },
        { name: positionType }
      ];
    }
    if (userId) {
      const userIdNum = Number(userId);
      if (!isNaN(userIdNum)) {
        query.userId = userIdNum;
      }
    }
    
    const [positions, total] = await Promise.all([
      collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query)
    ]);
    
    // Получаем информацию о пользователях для определения виртуального TON
    const userIds = positions.map(p => p.userId);
    const users = await db.collection('users').find({
      userId: { $in: userIds }
    }).toArray();
    
    const usersMap = users.reduce((acc, user) => {
      acc[user.userId] = user;
      return acc;
    }, {});
    
    const formattedPositions = positions.map(pos => {
      const user = usersMap[pos.userId];
      const isVirtualTon = user?.VirtualTonBalance && user.VirtualTonBalance > 0;
      
      const posType = pos.positionType || pos.type || pos.name || null;
      return {
        id: pos._id.toString(),
        userId: pos.userId,
        currency: pos.currency,
        deposit: pos.deposit,
        status: pos.status,
        positionType: posType,
        iterationIntervalMs: pos.iterationIntervalMs,
        positionTimeDurationMs: pos.positionTimeDurationMs,
        lastActivatedAt: pos.lastActivatedAt ? new Date(pos.lastActivatedAt).toLocaleString('ru-RU') : null,
        createdAt: pos.createdAt ? new Date(pos.createdAt).toLocaleString('ru-RU') : null,
        updatedAt: pos.updatedAt ? new Date(pos.updatedAt).toLocaleString('ru-RU') : null,
        isVirtualTon: isVirtualTon || false
      };
    });
    
    res.json({
      positions: formattedPositions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении позиций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику позиций
router.get('/stats/summary', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('positions');
    const usersCollection = db.collection('users');
    
    const [total, active, byStatus, byCurrency, totalDeposits, virtualTonBalance] = await Promise.all([
      collection.countDocuments({}),
      collection.countDocuments({ status: 'active' }),
      collection.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$currency', count: { $sum: 1 } } }
      ]).toArray(),
      // Сумма всех депозитов из всех позиций
      collection.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$deposit', 0] } }
          }
        }
      ]).toArray(),
      // Сумма виртуального TON баланса всех пользователей
      usersCollection.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$VirtualTonBalance', 0] } }
          }
        }
      ]).toArray()
    ]);
    
    const totalDepositsValue = totalDeposits && totalDeposits.length > 0 ? totalDeposits[0].total : 0;
    const virtualTonBalanceValue = virtualTonBalance && virtualTonBalance.length > 0 ? virtualTonBalance[0].total : 0;
    
    res.json({
      total,
      active,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byCurrency: byCurrency.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      totalDeposits: totalDepositsValue,
      virtualTonBalance: virtualTonBalanceValue
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
