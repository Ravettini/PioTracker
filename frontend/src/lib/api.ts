import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/auth-store';

// Configuración dinámica de API para desarrollo y producción
const getApiBaseUrl = () => {
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  
  // SIEMPRE usar la URL de Render en producción (Vercel)
  const url = 'https://sigepi-backend.onrender.com/api/v1';
  console.log('🔍 URL final (SIEMPRE RENDER):', url);
  return url;
};

// Configuración base de Axios
const api: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(), 
  timeout: 30000, // Reducido a 30 segundos
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
      
      // Health check primero para verificar que el servidor esté activo
      try {
        console.log('🏥 Verificando estado del servidor...');
        await api.get('/health', { timeout: 10000 });
        console.log('✅ Servidor activo');
      } catch (error) {
        console.log('⚠️ Servidor puede estar en cold start, continuando con login...');
      }
      
      // Retry mechanism mejorado para cold start de Render
      let lastError;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          console.log(`🔄 Intento ${attempt} de login...`);
          const response = await api.post('/auth/login', { email, password });
          console.log('✅ Login exitoso');
          return response.data;
        } catch (error: any) {
          lastError = error;
          console.log(`❌ Intento ${attempt} falló:`, error.message);
          
          if (attempt < 5 && (error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
            const waitTime = attempt * 2000; // 2s, 4s, 6s, 8s
            console.log(`⏳ Esperando ${waitTime/1000} segundos antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      console.log('💥 Error de login:', lastError);
      throw lastError;
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
    getStatsFromSheets: async () => {
      const response = await api.get('/cargas/stats/sheets');
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

  // Metas mensuales
  metas: {
    getByIndicador: async (indicadorId: string, ministerioId?: string, mes?: string) => {
      let url = `/metas-mensuales/indicador/${indicadorId}`;
      const params = new URLSearchParams();
      
      if (ministerioId) {
        params.append('ministerioId', ministerioId);
      }
      
      if (mes) {
        params.append('mes', mes);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      return response.data;
    },
    create: async (data: any) => {
      const response = await api.post('/metas-mensuales', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await api.put(`/metas-mensuales/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await api.delete(`/metas-mensuales/${id}`);
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
