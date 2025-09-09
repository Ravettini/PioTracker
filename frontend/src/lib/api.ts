import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/auth-store';

// Configuración dinámica de API para desarrollo y producción
const getApiBaseUrl = () => {
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  
  // En desarrollo, usar localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/api/v1';
  }
  
  // En producción, usar la URL del backend desplegado
  const url = process.env.NEXT_PUBLIC_API_URL || 'https://sigepi-backend.onrender.com/api/v1';
  console.log('🔍 URL final:', url);
  return url;
};

// Configuración base de Axios
const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(), 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Cliente API con métodos tipados
export const apiClient = {
  // Autenticación
  auth: {
    login: async (email: string, password: string) => {
      console.log('🌐 URL base del API:', getApiBaseUrl());
      console.log('🔗 URL completa del login:', `${getApiBaseUrl()}/auth/login`);
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    },
    logout: async () => {
      const response = await api.post('/auth/logout');
      return response.data;
    },
    refresh: async () => {
      const response = await api.post('/auth/refresh');
      return response.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      const response = await api.post('/auth/cambiar-clave', {
        currentPassword,
        newPassword,
      });
      return response.data;
    },
    getProfile: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
  },

  // Catálogos
  catalogos: {
    getMinisterios: async () => {
      const response = await api.get('/catalogos/ministerios');
      return response.data;
    },
    getLineas: async (ministerioId?: string) => {
      const params = ministerioId ? { ministerioId } : {};
      const response = await api.get('/catalogos/lineas', { params });
      return response.data;
    },
    getIndicadores: async (lineaId?: string) => {
      const params = lineaId ? { lineaId } : {};
      const response = await api.get('/catalogos/indicadores', { params });
      return response.data;
    },
    getLineasByMinisterio: async (ministerioId: string) => {
      const response = await api.get(`/catalogos/ministerios/${ministerioId}/lineas`);
      return response.data;
    },
    getIndicadoresByLinea: async (lineaId: string) => {
      const response = await api.get(`/catalogos/lineas/${lineaId}/indicadores`);
      return response.data;
    },
  },

  // Cargas
  cargas: {
    create: async (data: any) => {
      const response = await api.post('/cargas', data);
      return response.data;
    },
    getAll: async (filters?: any) => {
      const response = await api.get('/cargas', { params: filters });
      return response.data;
    },
    getStats: async () => {
      const response = await api.get('/cargas/stats');
      return response.data;
    },
    getById: async (id: string) => {
      const response = await api.get(`/cargas/${id}`);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.put(`/cargas/${id}`, data);
      return response.data;
    },
    enviar: async (id: string) => {
      const response = await api.post(`/cargas/${id}/enviar`);
      return response.data;
    },
    revisar: async (id: string, data: any) => {
      const response = await api.post(`/cargas/${id}/revision`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await api.delete(`/cargas/${id}`);
      return response.data;
    },
  },

  // Administración (solo admin)
  admin: {
    getUsuarios: async () => {
      const response = await api.get('/admin/usuarios');
      return response.data;
    },
    createUsuario: async (data: any) => {
      const response = await api.post('/admin/usuarios', data);
      return response.data;
    },
    updateUsuario: async (id: string, data: any) => {
      const response = await api.put(`/admin/usuarios/${id}`, data);
      return response.data;
    },
    toggleUsuarioStatus: async (id: string) => {
      const response = await api.put(`/admin/usuarios/${id}/toggle-status`);
      return response.data;
    },
    resetPassword: async (id: string) => {
      const response = await api.put(`/admin/usuarios/${id}/reset-password`);
      return response.data;
    },
    deleteUsuario: async (id: string) => {
      const response = await api.delete(`/admin/usuarios/${id}`);
      return response.data;
    },
    getMinisterios: async () => {
      const response = await api.get('/admin/ministerios');
      return response.data;
    },
  },

  // Sincronización (solo admin)
  sync: {
    pushCarga: async (id: string) => {
      const response = await api.post(`/sync/push/${id}`);
      return response.data;
    },
    pushPendientes: async () => {
      const response = await api.post('/sync/push-pendientes');
      return response.data;
    },
    getEstadoCarga: async (id: string) => {
      const response = await api.get(`/sync/estado/${id}`);
      return response.data;
    },
    getEstadoGeneral: async () => {
      const response = await api.get('/sync/estado-general');
      return response.data;
    },
  },

  // Analytics
  analytics: {
    getMinisterios: async () => {
      const response = await api.get('/analytics/ministerios');
      return response.data;
    },
    getCompromisos: async (ministerioId: string) => {
      const response = await api.get(`/analytics/compromisos?ministerioId=${ministerioId}`);
      return response.data;
    },
    getIndicadores: async (compromisoId: string) => {
      const response = await api.get(`/analytics/indicadores?compromisoId=${compromisoId}`);
      return response.data;
    },
    getDatos: async (filters: any) => {
      const response = await api.get('/analytics/datos', { params: filters });
      return response.data;
    },
    getResumen: async () => {
      const response = await api.get('/analytics/resumen');
      return response.data;
    },
  },

  // Health check
  health: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default apiClient;
