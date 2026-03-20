import express from 'express';
import { getDB } from '../config/db.js';

const router = express.Router();

// Получить общую статистику для дашборда
router.get('/dashboard', async (req, res) => {
  try {
    const db = req.db || getDB();
    
    const [usersCount, transactionsCount, positionsCount, claimedTasksCount] = await Promise.all([
      db.collection('users').countDocuments({}),
      db.collection('transactions').countDocuments({}),
      db.collection('positions').countDocuments({}),
      db.collection('claimedtasks').countDocuments({})
    ]);
    
    // Статистика за последние 30 дней
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [newUsers, newTransactions, activePositions] = await Promise.all([
      db.collection('users').countDocuments({
        JoinedAt: { $gte: thirtyDaysAgo }
      }),
      db.collection('transactions').countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      }),
      db.collection('positions').countDocuments({ status: 'active' })
    ]);
    
    res.json({
      users: {
        total: usersCount,
        newLast30Days: newUsers
      },
      transactions: {
        total: transactionsCount,
        newLast30Days: newTransactions
      },
      positions: {
        total: positionsCount,
        active: activePositions
      },
      claimedTasks: {
        total: claimedTasksCount
      }
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить баланс (депозиты - выводы) в TON
router.get('/balance', async (req, res) => {
  try {
    const db = req.db || getDB();
    const transactionsCollection = db.collection('transactions');
    
    // Получаем все депозиты в TON (только завершенные транзакции)
    const deposits = await transactionsCollection.aggregate([
      { 
        $match: { 
          type: 'deposit',
          currency: { $regex: /^TON$/i },
          status: { $eq: 'completed' } // Только завершенные, исключаем inProgress, cancelled и другие
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]).toArray();
    
    // Получаем все выводы в TON (только завершенные транзакции)
    const withdrawals = await transactionsCollection.aggregate([
      { 
        $match: { 
          type: { $in: ['withdraw', 'withdrawal'] },
          currency: { $regex: /^TON$/i },
          status: { $eq: 'completed' } // Только завершенные, исключаем inProgress, cancelled и другие
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$amount', 0] } }
        }
      }
    ]).toArray();
    
    const totalDeposits = deposits[0]?.total || 0;
    const totalWithdrawals = withdrawals[0]?.total || 0;
    const balance = totalDeposits - totalWithdrawals;
    
    res.json({
      totalDeposits,
      totalWithdrawals,
      balance
    });
  } catch (error) {
    console.error('Ошибка при получении баланса:', error);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});

// Получить данные для графика транзакций за последние дни
router.get('/transactions-chart', async (req, res) => {
  try {
    const db = req.db || getDB();
    const transactionsCollection = db.collection('transactions');
    
    // Получаем данные за последние 14 дней
    const days = 14;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Депозиты за день (только завершенные транзакции)
      const deposits = await transactionsCollection.aggregate([
        {
          $match: {
            type: 'deposit',
            currency: { $regex: /^TON$/i },
            status: { $eq: 'completed' }, // Только завершенные, исключаем inProgress, cancelled и другие
            createdAt: {
              $gte: date,
              $lt: nextDate
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$amount', 0] } }
          }
        }
      ]).toArray();
      
      // Выводы за день (только завершенные транзакции)
      const withdrawals = await transactionsCollection.aggregate([
        {
          $match: {
            type: { $in: ['withdraw', 'withdrawal'] },
            currency: { $regex: /^TON$/i },
            status: { $eq: 'completed' }, // Только завершенные, исключаем inProgress, cancelled и другие
            createdAt: {
              $gte: date,
              $lt: nextDate
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$amount', 0] } }
          }
        }
      ]).toArray();
      
      const depositsAmount = deposits[0]?.total || 0;
      const withdrawalsAmount = withdrawals[0]?.total || 0;
      const balance = depositsAmount - withdrawalsAmount;
      
      data.push({
        day: date.getDate().toString().padStart(2, '0'),
        date: date.toISOString().split('T')[0],
        deposits: depositsAmount,
        withdrawals: withdrawalsAmount,
        balance: balance
      });
    }
    
    res.json({ data });
  } catch (error) {
    console.error('Ошибка при получении данных графика:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
