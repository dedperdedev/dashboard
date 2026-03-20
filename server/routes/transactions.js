import express from 'express';
import { getDB } from '../config/db.js';

const router = express.Router();

// Получить все транзакции с пагинацией
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('transactions');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const status = req.query.status;
    const type = req.query.type;
    const currency = req.query.currency;
    const userId = req.query.userId;
    
    console.log('🔍 TRANSACTIONS REQUEST - userId from query:', userId, 'type:', typeof userId);
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (currency) query.currency = currency;
    
    // ОБЯЗАТЕЛЬНАЯ фильтрация по userId если он передан
    if (userId) {
      const userIdNum = Number(userId);
      if (!isNaN(userIdNum)) {
        query.userId = userIdNum;
        console.log('✅ Applied userId filter:', userIdNum);
      } else {
        console.warn('❌ Invalid userId:', userId);
      }
    } else {
      console.warn('⚠️ NO userId in query - returning ALL transactions!');
    }
    
    console.log('📋 MongoDB query:', JSON.stringify(query));
    
    const [transactions, total] = await Promise.all([
      collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query)
    ]);
    
    console.log(`📊 Found ${transactions.length} transactions, total: ${total}`);
    if (query.userId) {
      const foundUserIds = [...new Set(transactions.map(tx => tx.userId))];
      console.log('👥 UserIds in results:', foundUserIds);
      if (foundUserIds.length > 1 || (foundUserIds.length === 1 && foundUserIds[0] !== query.userId)) {
        console.error('🚨 ERROR: Filter not working! Expected userId:', query.userId, 'but found:', foundUserIds);
      }
    }
    
    // Получаем все userId из транзакций для проверки позиций
    const userIds = [...new Set(transactions.map(tx => tx.userId))];
    const positionsCollection = db.collection('positions');
    
    // Получаем все активные позиции для всех пользователей одним запросом
    const allActivePositions = await positionsCollection.find({
      userId: { $in: userIds },
      status: 'active'
    }).toArray();
    
    // Группируем позиции по userId для быстрого доступа
    const positionsByUser = {};
    allActivePositions.forEach(pos => {
      if (!positionsByUser[pos.userId]) {
        positionsByUser[pos.userId] = [];
      }
      positionsByUser[pos.userId].push(pos);
    });
    
    // Для каждой транзакции определяем тип вывода
    const formattedTransactions = transactions.map(tx => {
      let withdrawalType = null;
      
      // Определяем тип вывода только для транзакций типа withdraw
      if (tx.type === 'withdraw' || tx.type === 'withdrawal') {
        const userPositions = positionsByUser[tx.userId] || [];
        const withdrawalDate = tx.createdAt || new Date();
        
        // Проверяем, есть ли активные позиции, созданные до момента вывода
        const hasActivePosition = userPositions.some(pos => {
          const positionDate = pos.createdAt || new Date(0);
          return positionDate <= withdrawalDate;
        });
        
        if (hasActivePosition) {
          // Есть активные позиции - это вывод дохода от позиции
          withdrawalType = 'position_earnings';
        } else {
          // Нет активных позиций - это вывод депозита без позиции
          withdrawalType = 'deposit_without_position';
        }
      }
      
      return {
        id: tx._id.toString(),
        orderId: tx.order_id,
        userId: tx.userId,
        type: tx.type,
        currency: tx.currency,
        amount: tx.amount,
        status: tx.status,
        sourceWallet: tx.sourceWallet || null,
        targetWallet: tx.targetWallet || null,
        starsPaymentLink: tx.starsPaymentLink || null,
        confirmedAt: tx.confirmedAt ? new Date(tx.confirmedAt).toLocaleString('ru-RU') : null,
        createdAt: tx.createdAt ? new Date(tx.createdAt).toLocaleString('ru-RU') : null,
        updatedAt: tx.updatedAt ? new Date(tx.updatedAt).toLocaleString('ru-RU') : null,
        contents: tx.contents || [],
        withdrawalType: withdrawalType
      };
    });
    
    res.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении транзакций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить транзакцию по ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('transactions');
    const { ObjectId } = await import('mongodb');
    
    const transaction = await collection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Транзакция не найдена' });
    }
    
    // Определяем тип вывода для транзакций типа withdraw
    let withdrawalType = null;
    if (transaction.type === 'withdraw' || transaction.type === 'withdrawal') {
      const positionsCollection = db.collection('positions');
      const userPositions = await positionsCollection.find({
        userId: transaction.userId,
        status: 'active'
      }).toArray();
      
      const withdrawalDate = transaction.createdAt || new Date();
      const hasActivePosition = userPositions.some(pos => {
        const positionDate = pos.createdAt || new Date(0);
        return positionDate <= withdrawalDate;
      });
      
      withdrawalType = hasActivePosition ? 'position_earnings' : 'deposit_without_position';
    }
    
    // Форматируем транзакцию в том же формате, что и список
    const formattedTransaction = {
      id: transaction._id.toString(),
      orderId: transaction.order_id,
      userId: transaction.userId,
      type: transaction.type,
      currency: transaction.currency,
      amount: transaction.amount,
      status: transaction.status,
      sourceWallet: transaction.sourceWallet || null,
      targetWallet: transaction.targetWallet || null,
      starsPaymentLink: transaction.starsPaymentLink || null,
      confirmedAt: transaction.confirmedAt ? new Date(transaction.confirmedAt).toLocaleString('ru-RU') : null,
      createdAt: transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('ru-RU') : null,
      updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleString('ru-RU') : null,
      contents: transaction.contents || [],
      withdrawalType: withdrawalType
    };
    
    res.json(formattedTransaction);
  } catch (error) {
    console.error('Ошибка при получении транзакции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику транзакций
router.get('/stats/summary', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('transactions');
    
    const [total, byStatus, byType, byCurrency] = await Promise.all([
      collection.countDocuments({}),
      collection.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: '$currency', count: { $sum: 1 } } }
      ]).toArray()
    ]);
    
    res.json({
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byType: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byCurrency: byCurrency.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
