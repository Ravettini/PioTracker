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
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/carga/edit/${carga.id}`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              onClick={() => handleEnviar(carga.id)}
            >
              <Send className="h-4 w-4 mr-1" />
              Enviar
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(carga.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        );
      case 'pendiente':
        return (
          <div className="flex space-x-2">
            <Badge variant="warning">En Revisión</Badge>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(carga.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        );
      case 'validado':
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="success">Validado</Badge>
            {!carga.publicado && (
              <Badge variant="outline">No Publicado</Badge>
            )}
          </div>
        );
      case 'observado':
        return (
          <div className="flex space-x-2">
            <Badge variant="warning">Observado</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/carga/edit/${carga.id}`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Corregir
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(carga.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        );
      case 'rechazado':
        return (
          <div className="flex space-x-2">
            <Badge variant="destructive">Rechazado</Badge>
            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(carga.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mis Envíos
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona tus cargas de indicadores
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/carga')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Carga
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtros</CardTitle>
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
                
                <div className="flex items-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    size="sm"
                  >
                    Limpiar
                  </Button>
                  <Button
                    onClick={loadCargas}
                    size="sm"
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
            <CardTitle>
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
                <Button onClick={() => router.push('/carga')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Carga
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Indicador
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Período
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Valor
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargas.map((carga) => (
                      <tr key={carga.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {carga.indicador.nombre}
                            </p>
                            <p className="text-sm text-gray-600">
                              {carga.ministerio.sigla} - {carga.linea.titulo}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {getPeriodoDisplay(carga.periodo, carga.periodicidad)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {carga.valor}
                            </span>
                            <span className="text-sm text-gray-600">
                              {carga.unidad}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getEstadoBadge(carga.estado)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600">
                            {format(new Date(carga.creadoEn), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getActionsForEstado(carga)}
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








