const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Функция для обработки fetch с проверкой ошибок
const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
  try {
    console.log('API request:', url, options ? `[${options.method || 'GET'}]` : '[GET]');
    const response = await fetch(url, options);
    console.log('API response status:', response.status, response.statusText);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', url, error);
    throw error;
  }
};

export const api = {
  // Users
  getUsers: (page = 1, limit = 20, search = '', role = '', sortBy?: string | null, sortOrder?: 'asc' | 'desc') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    return fetchWithErrorHandling(`${API_BASE_URL}/users?${params}`);
  },
  
  getUser: (id: string | number) => 
    fetchWithErrorHandling(`${API_BASE_URL}/users/${id}`),
  
  getUserStats: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/users/stats/summary`),
  
  getUserReferrals: (id: string | number) => 
    fetchWithErrorHandling(`${API_BASE_URL}/users/${id}/referrals`),

  // Transactions
  getTransactions: (page = 1, limit = 20, filters?: { status?: string; type?: string; currency?: string; userId?: string | number }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.currency) params.append('currency', filters.currency);
    if (filters?.userId) params.append('userId', String(filters.userId));
    return fetchWithErrorHandling(`${API_BASE_URL}/transactions?${params}`);
  },
  
  getTransaction: (id: string) => 
    fetchWithErrorHandling(`${API_BASE_URL}/transactions/${id}`),
  
  getTransactionStats: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/transactions/stats/summary`),

  // Positions
  getPositions: (page = 1, limit = 20, filters?: { status?: string; currency?: string; userId?: string | number; positionType?: string }) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.currency) params.append('currency', filters.currency);
    if (filters?.userId) params.append('userId', String(filters.userId));
    if (filters?.positionType) params.append('positionType', filters.positionType);
    return fetchWithErrorHandling(`${API_BASE_URL}/positions?${params}`);
  },
  
  getPositionStats: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/positions/stats/summary`),

  // Tasks
  getTasks: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/tasks`),
  
  getClaimedTasks: (page = 1, limit = 20, userId?: string | number) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (userId) params.append('userId', String(userId));
    return fetchWithErrorHandling(`${API_BASE_URL}/tasks/claimed?${params}`);
  },

  // Referrals
  getReferralLevels: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/referrals/levels`),
  
  updateReferralLevels: (levels: any[]) =>
    fetchWithErrorHandling(`${API_BASE_URL}/referrals/levels`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levels })
    }),
  
  getReferralStats: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/referrals/stats`),

  // Settings
  getSettings: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/settings`),
  
  updateSettings: (data: any) => 
    fetchWithErrorHandling(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Stats
  getDashboardStats: () => {
    console.log('Fetching dashboard stats from:', `${API_BASE_URL}/stats/dashboard`);
    return fetchWithErrorHandling(`${API_BASE_URL}/stats/dashboard`);
  },
  
  getBalance: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/stats/balance`),
  
  getTransactionsChart: () => 
    fetchWithErrorHandling(`${API_BASE_URL}/stats/transactions-chart`),
};
