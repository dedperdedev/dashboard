import express from 'express';
import { getDB } from '../config/db.js';

const router = express.Router();

// Получить всех пользователей с пагинацией
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('users');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const role = req.query.role || ''; // 'user' или 'infl'
    const sortBy = req.query.sortBy || ''; // 'tonBalance' или другое поле
    const sortOrder = req.query.sortOrder || 'desc'; // 'asc' или 'desc'
    const query = {};
    
    // Фильтр по ролям
    if (role === 'infl') {
      query.roles = { $in: ['INFL', 'infl', 'INFLUENCER'] };
    } else if (role === 'user') {
      query.$or = [
        { roles: { $exists: false } },
        { roles: { $nin: ['INFL', 'infl', 'INFLUENCER'] } },
        { roles: { $in: ['USER', 'user'] } }
      ];
    }
    
    // Поиск
    if (search) {
      // Экранируем специальные символы regex для защиты от ReDoS и injection
      const escapeRegex = (str) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };
      
      const escapedSearch = escapeRegex(search);
      const searchConditions = [
        { username: { $regex: escapedSearch, $options: 'i' } },
        { fullName: { $regex: escapedSearch, $options: 'i' } }
      ];
      
      if (!isNaN(search)) {
        searchConditions.push({ userId: parseFloat(search) });
      }
      
      // Если уже есть $or для ролей, используем $and для объединения условий
      if (query.$or && role === 'user') {
        const roleCondition = { $or: query.$or };
        query.$and = [
          roleCondition,
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }
    
    // Получаем всех пользователей без пагинации для правильной сортировки
    const [allUsersRaw, total, allUsersWithJoinedBy] = await Promise.all([
      collection.find(query).toArray(),
      collection.countDocuments(query),
      collection.find({ JoinedByCode: { $exists: true, $ne: '0', $ne: null } }).toArray()
    ]);
    
    // Сортируем пользователей в зависимости от параметров сортировки
    let allUsers = allUsersRaw;
    
    if (sortBy === 'tonBalance') {
      // Сортируем по TonBalance
      allUsers = allUsersRaw.sort((a, b) => {
        // Преобразуем TonBalance в число для сравнения
        const balanceA = typeof a.TonBalance === 'number' ? a.TonBalance : (parseFloat(a.TonBalance) || 0);
        const balanceB = typeof b.TonBalance === 'number' ? b.TonBalance : (parseFloat(b.TonBalance) || 0);
        
        if (sortOrder === 'desc') {
          // По убыванию (от большего к меньшему)
          return balanceB - balanceA;
        } else {
          // По возрастанию (от меньшего к большему)
          return balanceA - balanceB;
        }
      });
    } else {
      // Если сортировка не указана, сортируем по умолчанию по TonBalance по убыванию
      allUsers = allUsersRaw.sort((a, b) => {
        const balanceA = typeof a.TonBalance === 'number' ? a.TonBalance : (parseFloat(a.TonBalance) || 0);
        const balanceB = typeof b.TonBalance === 'number' ? b.TonBalance : (parseFloat(b.TonBalance) || 0);
        return balanceB - balanceA;
      });
    }
    
    // Получаем суммы депозитов для всех пользователей
    const transactionsCollection = db.collection('transactions');
    const userIds = allUsers.map(u => u.userId);
    
    // Получаем все депозиты для этих пользователей
    const deposits = userIds.length > 0 ? await transactionsCollection.find({
      userId: { $in: userIds },
      type: 'deposit',
      status: 'completed'
    }).toArray() : [];
    
    // Группируем депозиты по userId вручную
    const depositsMap = {};
    deposits.forEach(dep => {
      const userId = dep.userId;
      // Нормализуем userId (может быть число или строка)
      const normalizedUserId = typeof userId === 'number' ? userId : parseFloat(userId);
      if (!isNaN(normalizedUserId)) {
        if (!depositsMap[normalizedUserId]) {
          depositsMap[normalizedUserId] = 0;
        }
        depositsMap[normalizedUserId] += (dep.amount || 0);
      }
    });
    
    // Преобразуем данные для фронтенда
    const formattedUsers = await Promise.all(allUsers.map(async user => {
      const roles = user.roles || [];
      const isInfl = roles.some(r => ['INFL', 'infl', 'INFLUENCER'].includes(String(r).toUpperCase()));
      const referralCode = String(user.OwnReferralCode || user.userId);
      
      // Подсчитываем количество рефералов по всем трем уровням
      // Ищем всех пользователей, у которых в JoinedByCode есть referralCode на любом уровне
      const referralSet = new Set();
      allUsersWithJoinedBy.forEach(ref => {
        const joinedBy = String(ref.JoinedByCode || '');
        if (joinedBy === referralCode || 
            joinedBy.startsWith(`${referralCode}.`) ||
            joinedBy.includes(`.${referralCode}.`) ||
            joinedBy.endsWith(`.${referralCode}`)) {
          referralSet.add(ref.userId);
        }
      });
      const referralsCount = referralSet.size;
      
      // Убеждаемся, что tonBalance - это число
      let tonBalance = 0;
      if (user.TonBalance !== null && user.TonBalance !== undefined) {
        if (typeof user.TonBalance === 'number') {
          tonBalance = user.TonBalance;
        } else {
          tonBalance = parseFloat(String(user.TonBalance)) || 0;
        }
      }
      
      let pltBalance = 0;
      if (user.PltBalance !== null && user.PltBalance !== undefined) {
        if (typeof user.PltBalance === 'number') {
          pltBalance = user.PltBalance;
        } else {
          pltBalance = parseFloat(String(user.PltBalance)) || 0;
        }
      }
      
      return {
        id: user.userId,
        username: user.username || `@user_${user.userId}`,
        fullName: user.fullName || 'Не указано',
        tonBalance: tonBalance,
        pltBalance: pltBalance,
        referralCode: referralCode,
        referrals: referralsCount,
        status: user.isBotBlocked ? 'blocked' : 'active',
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString('ru-RU') : 'Никогда',
        walletAddress: user.walletAddress || null,
        joinedAt: user.JoinedAt ? new Date(user.JoinedAt).toLocaleString('ru-RU') : null,
        loginsCount: user.loginsCount || 0,
        langCode: user.langCode || 'ru',
        roles: roles,
        isInfl: isInfl,
        totalDeposits: depositsMap[Number(user.userId)] || depositsMap[user.userId] || 0
      };
    }));
    
    // Дополнительная сортировка по tonBalance для гарантии правильного порядка
    // (на случай если MongoDB сортировка не сработала из-за разных типов данных)
    formattedUsers.sort((a, b) => {
      const balanceA = Number(a.tonBalance) || 0;
      const balanceB = Number(b.tonBalance) || 0;
      // Сортируем по убыванию: сначала пользователи с балансом > 0, потом с балансом = 0
      return balanceB - balanceA;
    });
    
    // Логируем первые 10 для отладки
    console.log('\n[USERS SORT] Первые 10 пользователей после сортировки:');
    formattedUsers.slice(0, 10).forEach((u, i) => {
      console.log(`  ${i + 1}. ID: ${u.id}, Balance: ${u.tonBalance} TON`);
    });
    
    // Применяем пагинацию после сортировки
    const users = formattedUsers.slice(skip, skip + limit);
    
    res.json({
      users: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить детальную информацию о рефералах пользователя
// ВАЖНО: Этот роут должен быть ПЕРЕД роутом /:id
router.get('/:id/referrals', async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection('users');
    const transactionsCollection = db.collection('transactions');
    
    const userId = parseFloat(req.params.id);
    const user = await usersCollection.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const referralCode = user.OwnReferralCode || String(user.userId);
    const referralCodeStr = String(referralCode);
    const userIdStr = String(user.userId);
    const escapedReferralCode = referralCodeStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedUserId = userIdStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Получаем всех пользователей, у которых в JoinedByCode есть referralCode или userId (в любой позиции)
    // Используем regex, который найдет referralCode как отдельную часть (разделенную точками)
    const allReferralsWithCode = await usersCollection.find({
      $or: [
        { JoinedByCode: referralCodeStr },
        { JoinedByCode: userIdStr },
        { JoinedByCode: { $regex: `^${escapedReferralCode}\\.` } },
        { JoinedByCode: { $regex: `^${escapedUserId}\\.` } },
        { JoinedByCode: { $regex: `\\.${escapedReferralCode}\\.` } },
        { JoinedByCode: { $regex: `\\.${escapedUserId}\\.` } },
        { JoinedByCode: { $regex: `\\.${escapedReferralCode}$` } },
        { JoinedByCode: { $regex: `\\.${escapedUserId}$` } }
      ]
    }).toArray();
    
    // Разделяем по позиции referralCode в JoinedByCode
    // Уровень определяется по позиции referralCode в цепочке
    const level1Filtered = []; // referralCode в первой позиции или точное совпадение
    const level2Filtered = []; // referralCode во второй позиции
    const level3Filtered = [];  // referralCode в третьей позиции
    
    // Используем Map для хранения пользователей по уровням (избегаем дубликатов)
    const level1Map = new Map();
    const level2Map = new Map();
    const level3Map = new Map();
    
    for (const r of allReferralsWithCode) {
      const joinedBy = String(r.JoinedByCode || '');
      const parts = joinedBy.split('.');
      const userId = r.userId;
      
      // Определяем позицию referralCode или userId в цепочке
      let codeIndex = parts.findIndex(p => p === referralCodeStr);
      if (codeIndex === -1 && referralCodeStr !== userIdStr) {
        // Если не нашли referralCode, пробуем найти userId
        codeIndex = parts.findIndex(p => p === userIdStr);
      }
      
      if (codeIndex === -1) {
        // referralCode/userId не найден в частях (не должно происходить, но на всякий случай)
        continue;
      }
      
      // Определяем уровень на основе позиции referralCode/userId в цепочке
      // Уровень = позиция referralCode в цепочке (0 = уровень 1, 1 = уровень 2, 2 = уровень 3)
      let level = 0;
      
      if (codeIndex === 0) {
        // referralCode/userId в первой позиции
        if (parts.length === 1) {
          // Точное совпадение "referralCode" или "userId" - уровень 1
          level = 1;
        } else if (parts.length === 2) {
          // Формат "referralCode.XXX" или "userId.XXX" - уровень 1 (прямой реферал)
          level = 1;
        } else if (parts.length === 3) {
          // Формат "referralCode.XXX.YYY" или "userId.XXX.YYY" - уровень 2 (реферал реферала)
          level = 2;
        }
      } else if (codeIndex === 1) {
        // referralCode/userId во второй позиции - уровень 2
        level = 2;
      } else if (codeIndex === 2) {
        // referralCode/userId в третьей позиции - уровень 3
        level = 3;
      }
      
      // Добавляем в соответствующий уровень, избегая дубликатов
      if (level === 1 && !level1Map.has(userId)) {
        level1Map.set(userId, r);
      } else if (level === 2 && !level2Map.has(userId) && !level1Map.has(userId)) {
        level2Map.set(userId, r);
      } else if (level === 3 && !level3Map.has(userId) && !level2Map.has(userId) && !level1Map.has(userId)) {
        level3Map.set(userId, r);
      }
    }
    
    const level1FilteredFinal = Array.from(level1Map.values());
    const level2FilteredFinal = Array.from(level2Map.values());
    const level3FilteredFinal = Array.from(level3Map.values());
    
    // Получаем депозиты для всех рефералов
    const allReferralIds = [
      ...level1FilteredFinal.map(r => r.userId),
      ...level2FilteredFinal.map(r => r.userId),
      ...level3FilteredFinal.map(r => r.userId)
    ];
    
    const deposits = await transactionsCollection.find({
      userId: { $in: allReferralIds },
      type: 'deposit',
      status: 'completed'
    }).toArray();
    
    // Группируем депозиты по пользователям
    const depositsByUser = {};
    deposits.forEach(dep => {
      if (!depositsByUser[dep.userId]) {
        depositsByUser[dep.userId] = [];
      }
      depositsByUser[dep.userId].push(dep);
    });
    
    // Форматируем рефералов с депозитами и заработком
    const formatReferral = (ref, level) => {
      const userDeposits = depositsByUser[ref.userId] || [];
      
      // Разделяем депозиты по валютам
      const tonDeposits = userDeposits.filter(d => String(d.currency || '').toUpperCase() === 'TON');
      const starsDeposits = userDeposits.filter(d => String(d.currency || '').toUpperCase() === 'STARS');
      
      const totalTonDeposits = tonDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalStarsDeposits = starsDeposits.reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalDeposits = totalTonDeposits + totalStarsDeposits;
      
      // Находим заработок от этого реферала в referrersEarnings
      const earnings = user.referrersEarnings?.find(e => e.userId === ref.userId) || {};
      
      return {
        userId: ref.userId,
        username: ref.username || `@user_${ref.userId}`,
        fullName: ref.fullName || 'Не указано',
        referralCode: ref.OwnReferralCode || String(ref.userId),
        level,
        joinedAt: ref.JoinedAt ? new Date(ref.JoinedAt).toLocaleString('ru-RU') : null,
        tonBalance: ref.TonBalance || 0,
        pltBalance: ref.PltBalance || 0,
        totalDeposits,
        tonDeposits: totalTonDeposits,
        starsDeposits: totalStarsDeposits,
        depositsCount: userDeposits.length,
        earnings: {
          tonBonus: earnings.tonBalanceBonus || 0,
          pltBonus: earnings.pltBalanceBonus || 0
        },
        deposits: userDeposits.map(d => ({
          id: d._id.toString(),
          amount: d.amount,
          currency: d.currency,
          createdAt: d.createdAt ? new Date(d.createdAt).toLocaleString('ru-RU') : null
        }))
      };
    };
    
    // Строим реферальное дерево
    const buildTree = (referrals, parentCode, level, rootCode) => {
      return referrals
        .filter(ref => {
          const joinedBy = String(ref.JoinedByCode || '');
          if (level === 1) {
            return joinedBy === String(parentCode);
          } else if (level === 2) {
            const parts = joinedBy.split('.');
            return parts.length === 2 && parts[0] === String(rootCode) && parts[1] === String(parentCode);
          } else {
            const parts = joinedBy.split('.');
            return parts.length === 3 && parts[0] === String(rootCode) && parts[1] === String(parentCode);
          }
        })
        .map(ref => {
          const formatted = formatReferral(ref, level);
          if (level < 3) {
            const nextLevelRefs = level === 1 ? level2FilteredFinal : (level === 2 ? level3FilteredFinal : []);
            formatted.children = buildTree(
              nextLevelRefs,
              formatted.referralCode,
              level + 1,
              rootCode
            );
          }
          return formatted;
        });
    };
    
    // Если нет уровня 1, но есть уровень 3, группируем по промежуточным кодам
    let referralTree = [];
    if (level1FilteredFinal.length > 0) {
      // Обычное дерево, если есть уровень 1
      referralTree = buildTree(level1FilteredFinal, referralCode, 1, referralCode);
    } else if (level3FilteredFinal.length > 0 || level2FilteredFinal.length > 0) {
      // Если нет уровня 1, но есть уровень 3, группируем по промежуточным кодам
      const groupedByIntermediate = {};
      level3FilteredFinal.forEach(ref => {
        const parts = (ref.JoinedByCode || '').split('.');
        if (parts.length === 3) {
          const intermediateCode = parts[1];
          if (!groupedByIntermediate[intermediateCode]) {
            groupedByIntermediate[intermediateCode] = [];
          }
          groupedByIntermediate[intermediateCode].push(ref);
        }
      });
      
      // Создаем виртуальные узлы для промежуточных кодов
      const intermediateCodes = Object.keys(groupedByIntermediate);
      const intermediateUsers = await Promise.all(
        intermediateCodes.map(code =>
          usersCollection.findOne({
            $or: [
              { OwnReferralCode: code },
              { userId: parseFloat(code) }
            ]
          })
        )
      );
      
      referralTree = intermediateCodes.map((intermediateCode, index) => {
        const refs = groupedByIntermediate[intermediateCode];
        const intermediateUser = intermediateUsers[index];
        
        if (intermediateUser) {
          // Если пользователь найден, используем его данные
          const formatted = formatReferral(intermediateUser, 1);
          formatted.children = refs.map(r => formatReferral(r, 3));
          return formatted;
        } else {
          // Создаем виртуальный узел
          return {
            userId: parseFloat(intermediateCode) || 0,
            username: `@virtual_${intermediateCode}`,
            fullName: `Промежуточный узел (${intermediateCode})`,
            referralCode: intermediateCode,
            level: 1,
            joinedAt: null,
            tonBalance: 0,
            pltBalance: 0,
            totalDeposits: 0,
            depositsCount: 0,
            earnings: { tonBonus: 0, pltBonus: 0 },
            deposits: [],
            children: refs.map(r => formatReferral(r, 3))
          };
        }
      });
    } else if (level2FilteredFinal.length > 0) {
      // Если есть только уровень 2
      referralTree = level2FilteredFinal.map(r => formatReferral(r, 2));
    }
    
    // Статистика по уровням с разделением по валютам
    const calculateLevelStats = (referrals) => {
      let totalTon = 0;
      let totalStars = 0;
      let totalEarnings = 0;
      
      referrals.forEach(r => {
        const deps = depositsByUser[r.userId] || [];
        const tonDeps = deps.filter(d => String(d.currency || '').toUpperCase() === 'TON');
        const starsDeps = deps.filter(d => String(d.currency || '').toUpperCase() === 'STARS');
        
        totalTon += tonDeps.reduce((s, d) => s + (d.amount || 0), 0);
        totalStars += starsDeps.reduce((s, d) => s + (d.amount || 0), 0);
        
        const earnings = user.referrersEarnings?.find(e => e.userId === r.userId) || {};
        totalEarnings += (earnings.tonBalanceBonus || 0);
      });
      
      return {
        count: referrals.length,
        totalDeposits: totalTon + totalStars,
        totalTonDeposits: totalTon,
        totalStarsDeposits: totalStars,
        totalEarnings
      };
    };
    
    const level1Stats = calculateLevelStats(level1FilteredFinal);
    const level2Stats = calculateLevelStats(level2FilteredFinal);
    const level3Stats = calculateLevelStats(level3FilteredFinal);
    
    res.json({
      referralCode,
      tree: referralTree,
      levels: {
        level1: {
          referrals: level1FilteredFinal.map(r => formatReferral(r, 1)),
          stats: level1Stats
        },
        level2: {
          referrals: level2FilteredFinal.map(r => formatReferral(r, 2)),
          stats: level2Stats
        },
        level3: {
          referrals: level3FilteredFinal.map(r => formatReferral(r, 3)),
          stats: level3Stats
        }
      },
      totalStats: {
        totalReferrals: level1FilteredFinal.length + level2FilteredFinal.length + level3FilteredFinal.length,
        totalDeposits: level1Stats.totalDeposits + level2Stats.totalDeposits + level3Stats.totalDeposits,
        totalTonDeposits: level1Stats.totalTonDeposits + level2Stats.totalTonDeposits + level3Stats.totalTonDeposits,
        totalStarsDeposits: level1Stats.totalStarsDeposits + level2Stats.totalStarsDeposits + level3Stats.totalStarsDeposits,
        totalEarnings: level1Stats.totalEarnings + level2Stats.totalEarnings + level3Stats.totalEarnings
      }
    });
  } catch (error) {
    console.error('Ошибка при получении рефералов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить пользователя по ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('users');
    
    const userId = parseFloat(req.params.id);
    const user = await collection.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const roles = user.roles || [];
    const isInfl = roles.some(r => ['INFL', 'infl', 'INFLUENCER'].includes(String(r).toUpperCase()));
    const referralCode = String(user.OwnReferralCode || user.userId);
    
    // Подсчитываем количество рефералов по всем трем уровням
    const allUsersWithJoinedBy = await collection.find({ 
      JoinedByCode: { $exists: true, $ne: '0', $ne: null } 
    }).toArray();
    
    const referralSet = new Set();
    allUsersWithJoinedBy.forEach(ref => {
      const joinedBy = String(ref.JoinedByCode || '');
      if (joinedBy === referralCode || 
          joinedBy.startsWith(`${referralCode}.`) ||
          joinedBy.includes(`.${referralCode}.`) ||
          joinedBy.endsWith(`.${referralCode}`)) {
        referralSet.add(ref.userId);
      }
    });
    const referralsCount = referralSet.size;
    
    // Находим реферера (пользователя, чьим рефералом является текущий пользователь)
    let referrer = null;
    const joinedByCode = user.JoinedByCode;
    
    
    // Сначала пробуем найти по JoinedByCode
    if (joinedByCode && joinedByCode !== '0' && joinedByCode !== null && String(joinedByCode).trim() !== '') {
      const joinedByStr = String(joinedByCode);
      const parts = joinedByStr.split('.');
      // Берем первый код из цепочки - это реферер уровня 1
      const referrerCode = parts[0];
      
      // Пробуем найти пользователя разными способами:
      // 1. По userId (если referrerCode - это число)
      const referrerUserId = parseFloat(referrerCode);
      if (!isNaN(referrerUserId) && referrerUserId > 0) {
        referrer = await collection.findOne({ userId: referrerUserId });
      }
      
      // 2. Если не нашли по userId, пробуем найти по OwnReferralCode
      if (!referrer) {
        referrer = await collection.findOne({
          $or: [
            { OwnReferralCode: referrerCode },
            { OwnReferralCode: String(referrerUserId) }
          ]
        });
      }
      
      if (referrer) {
        // Проверка на циклические зависимости и самоссылки
        // 1. Реферер не должен быть самим пользователем
        if (referrer.userId === userId) {
          console.warn(`Circular reference detected: User ${userId} has themselves as referrer`);
          referrer = null;
        } else {
          // 2. Проверяем, что у найденного реферера в JoinedByCode нет текущего пользователя
          // Это предотвращает циклические зависимости (A -> B -> A)
          const referrerJoinedBy = String(referrer.JoinedByCode || '');
          const currentUserCode = String(referralCode);
          const currentUserIdStr = String(userId);
          
          // Проверяем, не содержит ли JoinedByCode реферера текущего пользователя
          if (referrerJoinedBy && referrerJoinedBy !== '0' && referrerJoinedBy !== '') {
            const referrerParts = referrerJoinedBy.split('.');
            const hasCurrentUser = referrerParts.some(p => 
              p === currentUserCode || p === currentUserIdStr
            );
            
            if (hasCurrentUser) {
              console.warn(`Circular reference detected: User ${userId} and ${referrer.userId} reference each other`);
              referrer = null;
            }
          }
        }
        
        if (referrer) {
          // Определяем уровень реферала на основе длины цепочки
          let level = 1;
          if (parts.length === 1) {
            level = 1; // Прямой реферал: "1755769201"
          } else if (parts.length === 2) {
            level = 1; // Прямой реферал: "1755769201.XXX"
          } else if (parts.length === 3) {
            level = 2; // Реферал реферала: "1755769201.XXX.YYY"
          } else {
            level = Math.min(parts.length - 1, 3);
          }
          
          referrer = {
            id: referrer.userId,
            userId: referrer.userId,
            username: referrer.username || `@user_${referrer.userId}`,
            fullName: referrer.fullName || 'Не указано',
            referralCode: referrer.OwnReferralCode || String(referrer.userId),
            level: level
          };
        }
      }
    }
    
    // Если не нашли по JoinedByCode, ищем реферера другим способом
    // Проверяем всех пользователей, у которых текущий пользователь есть в referrersEarnings
    // Это означает, что они пригласили текущего пользователя
    if (!referrer) {
      // Ищем пользователя, у которого в массиве referrersEarnings есть объект с userId равным текущему userId
      const potentialReferrer = await collection.findOne({
        referrersEarnings: {
          $elemMatch: {
            userId: userId
          }
        }
      });
      
      if (potentialReferrer) {
        // Проверка на циклические зависимости
        if (potentialReferrer.userId === userId) {
          console.warn(`Circular reference detected: User ${userId} has themselves as referrer (via referrersEarnings)`);
          referrer = null;
        } else {
          // Проверяем, что у найденного реферера в JoinedByCode нет текущего пользователя
          const referrerJoinedBy = String(potentialReferrer.JoinedByCode || '');
          const currentUserCode = String(referralCode);
          const currentUserIdStr = String(userId);
          
          if (referrerJoinedBy && referrerJoinedBy !== '0' && referrerJoinedBy !== '') {
            const referrerParts = referrerJoinedBy.split('.');
            const hasCurrentUser = referrerParts.some(p => 
              p === currentUserCode || p === currentUserIdStr
            );
            
            if (hasCurrentUser) {
              console.warn(`Circular reference detected: User ${userId} and ${potentialReferrer.userId} reference each other (via referrersEarnings)`);
              referrer = null;
            } else {
              referrer = {
                id: potentialReferrer.userId,
                userId: potentialReferrer.userId,
                username: potentialReferrer.username || `@user_${potentialReferrer.userId}`,
                fullName: potentialReferrer.fullName || 'Не указано',
                referralCode: potentialReferrer.OwnReferralCode || String(potentialReferrer.userId),
                level: 1
              };
            }
          } else {
            referrer = {
              id: potentialReferrer.userId,
              userId: potentialReferrer.userId,
              username: potentialReferrer.username || `@user_${potentialReferrer.userId}`,
              fullName: potentialReferrer.fullName || 'Не указано',
              referralCode: potentialReferrer.OwnReferralCode || String(potentialReferrer.userId),
              level: 1
            };
          }
        }
      }
    }
    
    
    const responseData = {
      id: user.userId,
      username: user.username || `@user_${user.userId}`,
      fullName: user.fullName || 'Не указано',
      tonBalance: user.TonBalance || 0,
      pltBalance: user.PltBalance || 0,
      virtualTonBalance: user.VirtualTonBalance || 0,
      referralCode: referralCode,
      referrals: referralsCount,
      status: user.isBotBlocked ? 'blocked' : 'active',
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString('ru-RU') : 'Никогда',
      walletAddress: user.walletAddress || null,
      joinedAt: user.JoinedAt ? new Date(user.JoinedAt).toLocaleString('ru-RU') : null,
      loginsCount: user.loginsCount || 0,
      langCode: user.langCode || 'ru',
      referralEarned: user.referralEarned || 0,
      referrersEarnings: user.referrersEarnings || [],
      roles: roles,
      isInfl: isInfl
    };
    
    // Явно добавляем поле referrer (даже если null или undefined)
    responseData.referrer = referrer !== undefined && referrer !== null ? referrer : null;
    
    
    res.json(responseData);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику пользователей
router.get('/stats/summary', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection('users');
    
    const [total, activeToday, blocked, newThisWeek] = await Promise.all([
      collection.countDocuments({}),
      collection.countDocuments({
        lastLogin: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      collection.countDocuments({ isBotBlocked: true }),
      collection.countDocuments({
        JoinedAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      })
    ]);
    
    res.json({
      total,
      activeToday,
      blocked,
      newThisWeek
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
