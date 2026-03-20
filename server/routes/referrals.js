import express from 'express';
import { getDB } from '../config/db.js';

const router = express.Router();

// Получить уровни реферальной программы
router.get('/levels', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('referrallevels');
    
    const levels = await collection.find({}).sort({ level: 1 }).toArray();
    
    res.json({ levels });
  } catch (error) {
    console.error('Ошибка при получении уровней:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить уровни реферальной программы
router.put('/levels', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('referrallevels');
    
    const { levels } = req.body;
    
    if (!Array.isArray(levels)) {
      return res.status(400).json({ error: 'Уровни должны быть массивом' });
    }
    
    // Обновляем каждый уровень
    const updatePromises = levels.map(level => 
      collection.updateOne(
        { level: level.level },
        { $set: { rewardPercent: level.rewardPercent } },
        { upsert: true }
      )
    );
    
    await Promise.all(updatePromises);
    
    // Получаем обновленные уровни
    const updatedLevels = await collection.find({}).sort({ level: 1 }).toArray();
    
    res.json({ levels: updatedLevels });
  } catch (error) {
    console.error('Ошибка при обновлении уровней:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику реферальной программы
router.get('/stats', async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection('users');
    const transactionsCollection = db.collection('transactions');
    
    // Получаем всех пользователей с рефералами и всех пользователей с JoinedByCode
    const [usersWithReferrals, allUsers, allUsersWithReferrals] = await Promise.all([
      usersCollection.find({
        referrersEarnings: { $exists: true, $ne: [] }
      }).toArray(),
      usersCollection.find({
        JoinedByCode: { $exists: true, $ne: '0', $ne: null }
      }).toArray(),
      usersCollection.find({}).toArray() // Все пользователи для построения мапы
    ]);
    
    console.log(`Found ${usersWithReferrals.length} users with referrals, ${allUsers.length} users with JoinedByCode`);
    
    // Подсчитываем общий TON заработок из referrersEarnings
    let totalTonEarned = 0;
    const level1Stats = { count: 0, totalDeposits: 0, totalTonDeposits: 0, totalEarnings: 0 };
    const level2Stats = { count: 0, totalDeposits: 0, totalTonDeposits: 0, totalEarnings: 0 };
    const level3Stats = { count: 0, totalDeposits: 0, totalTonDeposits: 0, totalEarnings: 0 };
    
    // Создаем мапу всех пользователей по referralCode и userId
    const usersByReferralCode = new Map();
    const usersById = new Map();
    allUsersWithReferrals.forEach(user => {
      const code = String(user.OwnReferralCode || user.userId);
      usersByReferralCode.set(code, user);
      usersById.set(user.userId, user);
    });
    
    // Собираем все userId рефералов
    const allReferralUserIds = new Set(allUsers.map(u => u.userId));
    
    // Получаем депозиты всех рефералов
    const referralUserIdsArray = Array.from(allReferralUserIds);
    const deposits = referralUserIdsArray.length > 0 ? await transactionsCollection.find({
      userId: { $in: referralUserIdsArray },
      type: 'deposit',
      status: 'completed'
    }).toArray() : [];
    
    // Группируем депозиты по пользователям
    const depositsByUser = {};
    deposits.forEach(dep => {
      if (!depositsByUser[dep.userId]) {
        depositsByUser[dep.userId] = [];
      }
      depositsByUser[dep.userId].push(dep);
    });
    
    // Используем Set для отслеживания уже обработанных рефералов (чтобы не считать дважды)
    const processedReferrals = new Set();
    
    // Обрабатываем всех пользователей (не только тех, у кого есть referrersEarnings)
    for (const user of allUsersWithReferrals) {
      const referralCode = String(user.OwnReferralCode || user.userId);
      
      // Суммируем TON заработок
      if (user.referrersEarnings && Array.isArray(user.referrersEarnings)) {
        user.referrersEarnings.forEach(earning => {
          totalTonEarned += (earning.tonBalanceBonus || 0);
        });
      }
      
      // Находим рефералов этого пользователя из allUsers
      const referrals = allUsers.filter(ref => {
        if (!ref.JoinedByCode) return false;
        const joinedBy = String(ref.JoinedByCode);
        return joinedBy === referralCode || 
               joinedBy.startsWith(`${referralCode}.`) ||
               joinedBy.includes(`.${referralCode}.`) ||
               joinedBy.endsWith(`.${referralCode}`);
      });
      
      if (referrals.length === 0) continue;
      
      // Разделяем по уровням и подсчитываем статистику
      for (const ref of referrals) {
        const referralKey = `${ref.userId}_${referralCode}`;
        if (processedReferrals.has(referralKey)) continue; // Пропускаем уже обработанных
        
        const joinedBy = String(ref.JoinedByCode || '');
        const parts = joinedBy.split('.');
        const codeIndex = parts.findIndex(p => p === referralCode);
        
        if (codeIndex === -1) continue;
        
        const userDeposits = depositsByUser[ref.userId] || [];
        const tonDeposits = userDeposits.filter(d => String(d.currency || '').toUpperCase() === 'TON');
        const totalTon = tonDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
        const totalDeposits = userDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
        
        // Ищем заработок у пользователя, который имеет этого реферала
        let tonEarnings = 0;
        const userWithEarnings = usersWithReferrals.find(u => {
          const code = String(u.OwnReferralCode || u.userId);
          return code === referralCode;
        });
        if (userWithEarnings && userWithEarnings.referrersEarnings) {
          const earning = userWithEarnings.referrersEarnings.find(e => e.userId === ref.userId);
          tonEarnings = (earning?.tonBalanceBonus || 0);
        }
        
        let level = 0;
        if (codeIndex === 0 && parts.length === 1) {
          level = 1;
        } else if ((codeIndex === 0 && parts.length === 2) || codeIndex === 1) {
          level = 2;
        } else if ((codeIndex === 0 && parts.length === 3) || codeIndex === 2) {
          level = 3;
        }
        
        if (level > 0) {
          processedReferrals.add(referralKey);
          const levelStat = level === 1 ? level1Stats : level === 2 ? level2Stats : level3Stats;
          levelStat.count++;
          levelStat.totalDeposits += totalDeposits;
          levelStat.totalTonDeposits += totalTon;
          levelStat.totalEarnings += tonEarnings;
        }
      }
    }
    
    console.log(`Total TON earned: ${totalTonEarned}, Level1: ${level1Stats.count}, Level2: ${level2Stats.count}, Level3: ${level3Stats.count}`);
    
    // Получаем топ рефереров с правильным подсчетом количества рефералов
    const usersWithReferralsForTop = await usersCollection.find({
      referrersEarnings: { $exists: true, $ne: [] }
    }).toArray();
    
    // Используем уже загруженные allUsers для подсчета рефералов
    const topReferrers = usersWithReferralsForTop.map(user => {
      const referralCode = String(user.OwnReferralCode || user.userId);
      
      // Подсчитываем количество рефералов по всем трем уровням из уже загруженных allUsers
      const referralSet = new Set();
      allUsers.forEach(ref => {
        const joinedBy = String(ref.JoinedByCode || '');
        if (joinedBy === referralCode || 
            joinedBy.startsWith(`${referralCode}.`) ||
            joinedBy.includes(`.${referralCode}.`) ||
            joinedBy.endsWith(`.${referralCode}`)) {
          referralSet.add(ref.userId);
        }
      });
      const referralsCount = referralSet.size;
      
      const totalEarned = (user.referrersEarnings || []).reduce((sum, e) => {
        return sum + (e.tonBalanceBonus || 0);
      }, 0);
      
      return {
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        OwnReferralCode: user.OwnReferralCode || String(user.userId),
        referralsCount,
        totalEarned
      };
    });
    
    // Сортируем и берем топ 10
    topReferrers.sort((a, b) => b.referralsCount - a.referralsCount);
    const top10 = topReferrers.slice(0, 10);
    
    const totalReferrals = await usersCollection.countDocuments({ 
      JoinedByCode: { $exists: true, $ne: '0', $ne: null } 
    });
    
    const totalEarned = await usersCollection.aggregate([
      { $group: { _id: null, total: { $sum: '$referralEarned' } } }
    ]).toArray();
    
    // Вычисляем новых рефералов за последние 7 дней
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const newReferralsLastWeek = await usersCollection.countDocuments({
      JoinedByCode: { $exists: true, $ne: '0', $ne: null },
      JoinedAt: { $gte: weekAgo }
    });
    
    res.json({
      totalReferrals,
      totalEarned: totalEarned[0]?.total || 0,
      totalTonEarned,
      newReferralsLastWeek,
      levelsStats: {
        level1: level1Stats,
        level2: level2Stats,
        level3: level3Stats
      },
      topReferrers: top10.map(r => ({
        id: r.userId,
        userId: r.userId,
        username: r.username || `@user_${r.userId}`,
        fullName: r.fullName || null,
        referralCode: r.OwnReferralCode || String(r.userId),
        referrals: r.referralsCount || 0,
        earned: r.totalEarned || 0
      }))
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
