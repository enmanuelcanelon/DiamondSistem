import { create } from 'zustand';
import api from '../config/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Login de vendedor
  login: async (codigo_vendedor, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login/vendedor', {
        codigo_vendedor,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...user, tipo: 'vendedor' }));

      set({
        user: { ...user, tipo: 'vendedor' },
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Login de manager
  loginManager: async (codigo_manager, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login/manager', {
        codigo_manager,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...user, tipo: 'manager' }));

      set({
        user: { ...user, tipo: 'manager' },
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Login de gerente
  loginGerente: async (codigo_gerente, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login/gerente', {
        codigo_gerente,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ ...user, tipo: 'gerente' }));

      set({
        user: { ...user, tipo: 'gerente' },
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Login directo con token y datos (para cliente)
  loginWithToken: (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));

    set({
      user: userData,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore;

