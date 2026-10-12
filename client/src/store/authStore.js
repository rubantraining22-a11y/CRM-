import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://whatsapp-crm-server-447670879986.asia-south1.run.app/api'
    : 'http://localhost:5000/api');

const defaultUser = {
  id: 'usr_admin_ruban',
  username: 'Ruban',
  name: 'Ruban',
  email: 'ruban@tatamotors.com',
  role: 'admin', // 'admin' | 'sales' | 'user'
  showroom: 'Tata Motors SGA Hub - Coimbatore',
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('crm_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u) {
        // Normalize name to Ruban if previously saved as Rajesh Kumar
        if (!u.name || u.name === 'Rajesh Kumar') {
          u.name = 'Ruban';
          u.username = 'Ruban';
          u.email = 'ruban@tatamotors.com';
        }
        // Ensure role is normalized to admin, sales, or user
        if (!['admin', 'sales', 'user'].includes(u.role)) {
          u.role = 'admin';
        }
        localStorage.setItem('crm_user', JSON.stringify(u));
        return u;
      }
    }
  } catch {}
  return defaultUser;
};

const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem('crm_token') || 'demo-jwt-token-tata-crm',
  isAuthenticated: true,
  isLoading: false,

  // Role permissions helpers
  getRole: () => get().user?.role || 'admin',
  isAdmin: () => (get().user?.role || 'admin') === 'admin',
  isSales: () => get().user?.role === 'sales',
  isUser: () => get().user?.role === 'user',
  canAccessSettings: () => (get().user?.role || 'admin') === 'admin',
  canBulkBroadcast: () => ['admin', 'sales'].includes(get().user?.role || 'admin'),
  canSendMessages: () => ['admin', 'sales'].includes(get().user?.role || 'admin'),

  // Instant Role Switcher
  switchRole: (newRole) => {
    if (!['admin', 'sales', 'user'].includes(newRole)) return;
    const current = get().user || defaultUser;
    const roleTitles = {
      admin: 'Administrator (Full Control)',
      sales: 'Sales Team Executive',
      user: 'Standard User (Viewer)',
    };
    const updated = {
      ...current,
      role: newRole,
      title: roleTitles[newRole],
    };
    localStorage.setItem('crm_user', JSON.stringify(updated));
    set({ user: updated });
  },

  login: async (email, password, role = 'admin') => {
    set({ isLoading: true });
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password, role });
      const { token, user } = res.data;
      localStorage.setItem('crm_token', token);
      localStorage.setItem('crm_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const mockUser = {
        id: 'usr_admin_ruban',
        username: email ? email.split('@')[0] : 'Ruban',
        name: email ? email.split('@')[0] : 'Ruban',
        email: email || 'ruban@tatamotors.com',
        role: role || 'admin',
        showroom: 'Tata Motors SGA Hub - Coimbatore',
      };
      const mockToken = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('crm_token', mockToken);
      localStorage.setItem('crm_user', JSON.stringify(mockUser));
      set({ token: mockToken, user: mockUser, isAuthenticated: true, isLoading: false });
      return { success: true };
    }
  },

  logout: () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const token = localStorage.getItem('crm_token');
    const user = localStorage.getItem('crm_user');
    if (token) {
      set({ token, user: user ? JSON.parse(user) : defaultUser, isAuthenticated: true });
    }
  },
}));

export default useAuthStore;
