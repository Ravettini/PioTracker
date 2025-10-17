'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useIsAdmin } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Activity,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Search,
  Clock,
  Globe,
  Monitor,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
  id: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  accion: string;
  objeto: string;
  objetoId: string;
  ip: string;
  userAgent: string;
  cuando: string;
}

interface SesionUsuario {
  usuarioId: string;
  nombre: string;
  email: string;
  ultimoLogin: string | null;
  ultimoLogout: string | null;
  sesionActiva: boolean;
}

export default function AuditoriaPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [sesiones, setSesiones] = useState<SesionUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<'logs' | 'sesiones'>('logs');

  // Filtros
  const [filtros, setFiltros] = useState({
    page: 1,
    limit: 50,
    accion: '',
    objeto: '',
    desde: '',
    hasta: '',
  });

  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/home');
      return;
    }

    loadData();
  }, [isAuthenticated, isAdmin, router, vistaActiva, filtros]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (vistaActiva === 'logs') {
        await loadLogs();
      } else {
        await loadSesiones();
      }
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    const response = await apiClient.audit.getLogs(filtros);
    setLogs(response.logs || []);
    setTotalLogs(response.total || 0);
    setTotalPages(response.totalPages || 0);
  };

  const loadSesiones = async () => {
    const response = await apiClient.audit.getSesionesUsuarios();
    setSesiones(response || []);
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    try {
      return format(new Date(fecha), "dd/MM/yyyy HH:mm:ss", { locale: es });
    } catch {
      return fecha;
    }
  };

  const getAccionColor = (accion: string) => {
    const colores: Record<string, string> = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      crear: 'bg-blue-100 text-blue-800',
      editar: 'bg-yellow-100 text-yellow-800',
      enviar: 'bg-purple-100 text-purple-800',
      aprobar: 'bg-green-100 text-green-800',
      rechazar: 'bg-red-100 text-red-800',
      observar: 'bg-orange-100 text-orange-800',
      publicar: 'bg-emerald-100 text-emerald-800',
    };
    return colores[accion] || 'bg-gray-100 text-gray-800';
  };

  const getAccionLabel = (accion: string) => {
    const labels: Record<string, string> = {
      login: 'Inicio de sesión',
      logout: 'Cierre de sesión',
      crear: 'Crear',
      editar: 'Editar',
      enviar: 'Enviar',
      aprobar: 'Aprobar',
      rechazar: 'Rechazar',
      observar: 'Observar',
      publicar: 'Publicar',
    };
    return labels[accion] || accion;
  };

  const aplicarFiltros = () => {
    setFiltros({ ...filtros, page: 1 });
  };

  const limpiarFiltros = () => {
    setFiltros({
      page: 1,
      limit: 50,
      accion: '',
      objeto: '',
      desde: '',
      hasta: '',
    });
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Auditoría del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Control y seguimiento de acciones de usuarios
            </p>
          </div>
          <Button
            onClick={loadData}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`pb-2 px-4 font-medium transition-colors ${
              vistaActiva === 'logs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setVistaActiva('logs')}
          >
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Registro de Acciones</span>
            </div>
          </button>
          <button
            className={`pb-2 px-4 font-medium transition-colors ${
              vistaActiva === 'sesiones'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setVistaActiva('sesiones')}
          >
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Sesiones de Usuarios</span>
            </div>
          </button>
        </div>

        {/* Vista de Logs */}
        {vistaActiva === 'logs' && (
          <>
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filtros</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acción
                    </label>
                    <select
                      value={filtros.accion}
                      onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas</option>
                      <option value="login">Inicio de sesión</option>
                      <option value="logout">Cierre de sesión</option>
                      <option value="crear">Crear</option>
                      <option value="editar">Editar</option>
                      <option value="enviar">Enviar</option>
                      <option value="aprobar">Aprobar</option>
                      <option value="rechazar">Rechazar</option>
                      <option value="observar">Observar</option>
                      <option value="publicar">Publicar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Objeto
                    </label>
                    <select
                      value={filtros.objeto}
                      onChange={(e) => setFiltros({ ...filtros, objeto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      <option value="cargas">Cargas</option>
                      <option value="usuarios">Usuarios</option>
                      <option value="ministerios">Ministerios</option>
                      <option value="indicadores">Indicadores</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={filtros.desde}
                      onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={filtros.hasta}
                      onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <Button onClick={aplicarFiltros}>
                    <Search className="h-4 w-4 mr-2" />
                    Aplicar Filtros
                  </Button>
                  <Button onClick={limpiarFiltros} variant="outline">
                    Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Logs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Registro de Acciones</CardTitle>
                  <span className="text-sm text-gray-500">
                    Total: {totalLogs} acciones
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Cargando logs...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron registros
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha/Hora
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuario
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acción
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Objeto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            IP
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                <span>{formatFecha(log.cuando)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {log.usuario.nombre}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {log.usuario.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getAccionColor(
                                  log.accion
                                )}`}
                              >
                                {getAccionLabel(log.accion)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {log.objeto}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <Globe className="h-4 w-4 mr-2" />
                                {log.ip || 'N/A'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Página {filtros.page} de {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() =>
                          setFiltros({ ...filtros, page: filtros.page - 1 })
                        }
                        disabled={filtros.page === 1}
                        variant="outline"
                        size="sm"
                      >
                        Anterior
                      </Button>
                      <Button
                        onClick={() =>
                          setFiltros({ ...filtros, page: filtros.page + 1 })
                        }
                        disabled={filtros.page === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Vista de Sesiones */}
        {vistaActiva === 'sesiones' && (
          <Card>
            <CardHeader>
              <CardTitle>Sesiones de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Cargando sesiones...</p>
                </div>
              ) : sesiones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de sesiones
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Login
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Último Logout
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sesiones.map((sesion) => (
                        <tr key={sesion.usuarioId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {sesion.nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                {sesion.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatFecha(sesion.ultimoLogin || '')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatFecha(sesion.ultimoLogout || '')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                sesion.sesionActiva
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {sesion.sesionActiva ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

