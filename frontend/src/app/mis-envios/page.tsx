'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useUser } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { CargaConRelaciones, FilterOptions } from '@/types';
import { apiClient } from '@/lib/api';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Send, 
  RefreshCw,
  Calendar,
  BarChart3,
  TrendingUp,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MisEnviosPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const [cargas, setCargas] = useState<CargaConRelaciones[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    estado: '',
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadCargas();
  }, [isAuthenticated, router, filters]);

  const loadCargas = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.cargas.getAll(filters);
      console.log('Respuesta de cargas:', response);
      // El backend devuelve { cargas, total }, no { data: { cargas, total } }
      setCargas(response.cargas || []);
    } catch (error) {
      console.error('Error cargando cargas:', error);
      toast.error('Error al cargar las cargas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnviar = async (cargaId: string) => {
    try {
      const response = await apiClient.cargas.enviar(cargaId);
      if (response.success) {
        toast.success('Carga enviada para revisión');
        loadCargas(); // Recargar lista
      } else {
        toast.error(response.message || 'Error al enviar la carga');
      }
    } catch (error: any) {
      console.error('Error enviando carga:', error);
      const errorMessage = error.response?.data?.message || 'Error al enviar la carga';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (cargaId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta carga? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await apiClient.cargas.delete(cargaId);
      toast.success('Carga eliminada exitosamente');
      loadCargas(); // Recargar lista
    } catch (error: any) {
      console.error('Error eliminando carga:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar la carga';
      toast.error(errorMessage);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Resetear página al cambiar filtros
    }));
  };

  const clearFilters = () => {
    setFilters({
      estado: '',
      page: 1,
      limit: 20,
    });
  };

  const getEstadoBadge = (estado: string) => {
    return <Badge estado={estado as any}>{estado.toUpperCase()}</Badge>;
  };

  const getPeriodoDisplay = (periodo: string, periodicidad: string) => {
    switch (periodicidad) {
      case 'mensual':
        try {
          const date = new Date(periodo + '-01');
          return format(date, 'MMMM yyyy', { locale: es });
        } catch {
          return periodo;
        }
      case 'trimestral':
        return `Q${periodo.slice(-1)} ${periodo.slice(0, 4)}`;
      case 'semestral':
        return `S${periodo.slice(-1)} ${periodo.slice(0, 4)}`;
      case 'anual':
        return periodo;
      default:
        return periodo;
    }
  };

  const getActionsForEstado = (carga: CargaConRelaciones) => {
    const canDelete = carga.estado === 'borrador' || carga.estado === 'pendiente';
    
    switch (carga.estado) {
      case 'borrador':
        return (
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/carga/edit/${carga.id}`)}
              className="w-full sm:w-auto text-xs"
            >
              <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              onClick={() => handleEnviar(carga.id)}
              className="w-full sm:w-auto text-xs"
            >
              <Send className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Enviar
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(carga.id)}
                className="w-full sm:w-auto text-xs"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        );
      case 'pendiente':
        return (
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            <Badge variant="warning">En Revisión</Badge>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(carga.id)}
                className="w-full sm:w-auto text-xs"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        );
      case 'validado':
        return (
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            <Badge variant="success">Validado</Badge>
            {!carga.publicado && (
              <Badge variant="outline">No Publicado</Badge>
            )}
          </div>
        );
      case 'observado':
        return (
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            <Badge variant="warning">Observado</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/carga/edit/${carga.id}`)}
              className="w-full sm:w-auto text-xs"
            >
              <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Corregir
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(carga.id)}
                className="w-full sm:w-auto text-xs"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        );
      case 'rechazado':
        return (
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            <Badge variant="destructive">Rechazado</Badge>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(carga.id)}
                className="w-full sm:w-auto text-xs"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const estadoOptions: SelectOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'validado', label: 'Validado' },
    { value: 'observado', label: 'Observado' },
    { value: 'rechazado', label: 'Rechazado' },
  ];

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Mis Envíos
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
                Gestiona tus cargas de indicadores
              </p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/carga')}
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Carga
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-xl">Filtros</CardTitle>
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className="p-2"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Estado"
                  options={estadoOptions}
                  value={filters.estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                />
                
                <div className="flex flex-col sm:flex-row items-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Limpiar
                  </Button>
                  <Button
                    onClick={loadCargas}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Aplicar
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Lista de cargas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Cargas ({cargas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gcba-blue"></div>
                <span className="ml-2 text-gray-600">Cargando...</span>
              </div>
            ) : cargas.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay cargas
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza creando tu primera carga de indicadores
                </p>
                <Button 
                  onClick={() => router.push('/carga')}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Carga
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-full max-w-4xl">
                  <thead className="hidden md:table-header-group">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-700 text-xs md:text-sm">
                        Indicador
                      </th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-700 text-xs md:text-sm">
                        Período
                      </th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-700 text-xs md:text-sm">
                        Valor
                      </th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-700 text-xs md:text-sm">
                        Estado
                      </th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-700 text-xs md:text-sm">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-2 md:px-4 font-medium text-gray-700 text-xs md:text-sm">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargas.map((carga) => (
                      <tr key={carga.id} className="border-b border-gray-100 hover:bg-gray-50">
                        {/* Desktop view */}
                        <td className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4">
                          <div>
                            <p className="font-medium text-gray-900 text-xs md:text-sm">
                              {carga.indicador.nombre}
                            </p>
                            <p className="text-xs text-gray-600">
                              {carga.indicador.id || 'Sin código'}
                            </p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4">
                          <Badge variant="outline" className="text-xs">
                            {carga.periodo}
                          </Badge>
                        </td>
                        <td className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4">
                          <div>
                            <p className="text-xs md:text-sm font-medium text-gray-900">
                              {carga.valor} {carga.unidad}
                            </p>
                            <p className="text-xs text-gray-600">
                              Meta: {carga.meta} {carga.unidad}
                            </p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4">
                          {getEstadoBadge(carga.estado)}
                        </td>
                        <td className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4">
                          <div className="text-xs text-gray-600">
                            <p>{format(new Date(carga.creadoEn), 'dd/MM/yyyy', { locale: es })}</p>
                            <p>{format(new Date(carga.creadoEn), 'HH:mm', { locale: es })}</p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell py-3 md:py-4 px-2 md:px-4">
                          {getActionsForEstado(carga)}
                        </td>
                        
                        {/* Mobile view - Card layout */}
                        <td className="md:hidden p-3">
                          <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {carga.indicador.nombre}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {carga.indicador.codigo || 'Sin código'}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs ml-2">
                                {carga.periodo}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {carga.valor} {carga.unidad}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Meta: {carga.meta} {carga.unidad}
                                </p>
                              </div>
                              {getEstadoBadge(carga.estado)}
                            </div>
                            
                            <div className="text-xs text-gray-600">
                              {format(new Date(carga.creadoEn), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </div>
                            
                            <div className="pt-2">
                              {getActionsForEstado(carga)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}








