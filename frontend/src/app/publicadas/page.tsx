'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useUser } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api';
import { CargaConRelaciones } from '@/types';
import { 
  ArrowLeft, 
  FileText, 
  Filter,
  Download,
  Eye,
  CheckCircle,
  Calendar,
  Building,
  Target,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FilterOptions {
  ministerioId: string;
  indicadorId: string;
  periodo: string;
  page: number;
  limit: number;
}

export default function PublicadasPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const [cargas, setCargas] = useState<CargaConRelaciones[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    ministerioId: '',
    indicadorId: '',
    periodo: '',
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);

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
      // Filtrar solo cargas publicadas
      const response = await apiClient.cargas.getAll({
        ...filters,
        publicado: true, // Solo cargas publicadas
      });
      console.log('Respuesta de cargas publicadas:', response);
      setCargas(response.cargas || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error cargando cargas publicadas:', error);
      toast.error('Error al cargar las cargas publicadas');
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados = {
      validado: { variant: 'success' as const, text: 'Validado', icon: CheckCircle },
      observado: { variant: 'warning' as const, text: 'Observado', icon: Eye },
      rechazado: { variant: 'destructive' as const, text: 'Rechazado', icon: FileText },
    };
    
    const estadoConfig = estados[estado as keyof typeof estados] || estados.validado;
    const Icon = estadoConfig.icon;
    
    return (
      <Badge variant={estadoConfig.variant} className="text-xs">
        <Icon className="h-3 w-3 mr-1" />
        {estadoConfig.text}
      </Badge>
    );
  };

  const exportToExcel = () => {
    // TODO: Implementar exportación a Excel
    toast('Función de exportación en desarrollo');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                Cargas Publicadas
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
                Visualiza todas las cargas validadas y publicadas en el sistema
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm px-3 py-2 sm:px-4 sm:py-2"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button
              onClick={exportToExcel}
              className="text-sm px-3 py-2 sm:px-4 sm:py-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ministerio
                  </label>
                  <select
                    value={filters.ministerioId}
                    onChange={(e) => setFilters(prev => ({ ...prev, ministerioId: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gcba-blue"
                  >
                    <option value="">Todos los ministerios</option>
                    {/* TODO: Cargar ministerios desde API */}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <select
                    value={filters.periodo}
                    onChange={(e) => setFilters(prev => ({ ...prev, periodo: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gcba-blue"
                  >
                    <option value="">Todos los períodos</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indicador
                  </label>
                  <select
                    value={filters.indicadorId}
                    onChange={(e) => setFilters(prev => ({ ...prev, indicadorId: e.target.value, page: 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gcba-blue"
                  >
                    <option value="">Todos los indicadores</option>
                    {/* TODO: Cargar indicadores desde API */}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Publicadas</p>
                  <p className="text-2xl font-bold text-gray-900">{total}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Período</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cargas.filter(c => ['2024', '2025', '2026', '2027'].includes(c.periodo)).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ministerios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(cargas.map(c => c.ministerioId)).size}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de cargas publicadas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cargas Publicadas ({total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gcba-blue"></div>
              </div>
            ) : cargas.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay cargas publicadas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indicador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ministerio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Período
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Responsable
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cargas.map((carga) => (
                      <tr key={carga.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Target className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {carga.indicador?.nombre || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {carga.indicador?.unidadDefecto || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {carga.ministerio?.nombre || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {carga.periodo} (cumplimiento)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {carga.valor.toLocaleString()}
                          </div>
                          {carga.meta && (
                            <div className="text-sm text-gray-500">
                              Meta: {carga.meta.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getEstadoBadge(carga.estado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900">
                                {carga.responsableNombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                {carga.responsableEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(carga.actualizadoEn), 'dd/MM/yyyy', { locale: es })}
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
