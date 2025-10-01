'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useIsAdmin } from '@/store/auth-store';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  Target,
  Save,
  ArrowLeft,
  Calendar,
  Hash,
  Building2,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';

interface Ministerio {
  id: string;
  nombre: string;
  sigla: string;
  activo: boolean;
}

interface Linea {
  id: string;
  titulo: string;
  ministerioId: string;
  ministerio: Ministerio;
  activo: boolean;
}

interface Indicador {
  id: string;
  nombre: string;
  lineaId: string;
  linea: Linea;
  unidadDefecto: string;
  periodicidad: string;
  activo: boolean;
}

interface MetaMensual {
  id: string;
  indicadorId: string;
  ministerioId: string;
  lineaId: string;
  mes: string;
  meta: number;
  descripcion?: string;
  indicador?: Indicador;
  ministerio?: Ministerio;
  linea?: Linea;
}

export default function AdminMetasPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const { token } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Estados para el formulario de creación
  const [metaForm, setMetaForm] = useState({
    indicadorId: '',
    ministerioId: '',
    lineaId: '',
    mes: '',
    meta: '',
    descripcion: ''
  });
  
  // Datos para selects
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [metas, setMetas] = useState<MetaMensual[]>([]);
  const [filteredLineas, setFilteredLineas] = useState<Linea[]>([]);
  const [filteredIndicadores, setFilteredIndicadores] = useState<Indicador[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    loadData();
  }, [isAuthenticated, isAdmin, router]);

  // Filtrar líneas cuando cambie el ministerio seleccionado
  useEffect(() => {
    if (metaForm.ministerioId) {
      const filtered = lineas.filter(linea => linea.ministerioId === metaForm.ministerioId);
      setFilteredLineas(filtered);
      // Limpiar línea e indicador seleccionados si no pertenecen al ministerio
      if (metaForm.lineaId && !filtered.find(l => l.id === metaForm.lineaId)) {
        setMetaForm(prev => ({ ...prev, lineaId: '', indicadorId: '' }));
      }
    } else {
      setFilteredLineas(lineas);
    }
  }, [metaForm.ministerioId, lineas]);

  // Filtrar indicadores cuando cambie la línea seleccionada
  useEffect(() => {
    if (metaForm.lineaId) {
      const filtered = indicadores.filter(indicador => indicador.lineaId === metaForm.lineaId);
      setFilteredIndicadores(filtered);
      // Limpiar indicador seleccionado si no pertenece a la línea
      if (metaForm.indicadorId && !filtered.find(i => i.id === metaForm.indicadorId)) {
        setMetaForm(prev => ({ ...prev, indicadorId: '' }));
      }
    } else {
      setFilteredIndicadores(indicadores);
    }
  }, [metaForm.lineaId, indicadores]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadMinisterios(),
        loadLineas(),
        loadIndicadores(),
        loadMetas()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error cargando datos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMinisterios = async () => {
    try {
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/catalogos/ministerios', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMinisterios(data.data || data || []);
      } else {
        console.error('Error obteniendo ministerios:', response.status);
      }
    } catch (error) {
      console.error('Error cargando ministerios:', error);
    }
  };

  const loadLineas = async () => {
    try {
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/catalogos/lineas', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLineas(data.data || data || []);
      } else {
        console.error('Error obteniendo líneas:', response.status);
      }
    } catch (error) {
      console.error('Error cargando líneas:', error);
    }
  };

  const loadIndicadores = async () => {
    try {
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/catalogos/indicadores', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIndicadores(data.data || data || []);
      } else {
        console.error('Error obteniendo indicadores:', response.status);
      }
    } catch (error) {
      console.error('Error cargando indicadores:', error);
    }
  };

  const loadMetas = async () => {
    try {
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/metas-mensuales', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetas(data.data || data || []);
      } else {
        console.error('Error obteniendo metas:', response.status);
      }
    } catch (error) {
      console.error('Error cargando metas:', error);
    }
  };

  const handleCreateMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!metaForm.indicadorId || !metaForm.mes || !metaForm.meta) {
      toast.error('El indicador, mes y meta son requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const metaData = {
        indicadorId: metaForm.indicadorId,
        ministerioId: metaForm.ministerioId,
        lineaId: metaForm.lineaId,
        mes: metaForm.mes,
        meta: parseFloat(metaForm.meta),
        descripcion: metaForm.descripcion || ''
      };

      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/metas-mensuales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(metaData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Meta creada exitosamente');
        setMetaForm({
          indicadorId: '',
          ministerioId: '',
          lineaId: '',
          mes: '',
          meta: '',
          descripcion: ''
        });
        setShowCreateForm(false);
        await loadMetas();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error creando meta');
      }
    } catch (error) {
      console.error('Error creando meta:', error);
      toast.error('Error creando meta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeta = async (metaId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta meta?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://sigepi-backend.onrender.com/api/v1/metas-mensuales/${metaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Meta eliminada exitosamente');
        await loadMetas();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error eliminando meta');
      }
    } catch (error) {
      console.error('Error eliminando meta:', error);
      toast.error('Error eliminando meta');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMes = (mes: string) => {
    const [year, month] = mes.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Administración
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Crear Nueva Meta
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Metas Mensuales
          </h1>
          <p className="text-gray-600">
            Administra las metas mensuales para cada indicador
          </p>
        </div>

        {/* Formulario de creación */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Crear Nueva Meta Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMeta} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ministerio *
                    </label>
                    <select
                      value={metaForm.ministerioId}
                      onChange={(e) => setMetaForm(prev => ({ 
                        ...prev, 
                        ministerioId: e.target.value,
                        lineaId: '',
                        indicadorId: ''
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecciona un ministerio</option>
                      {ministerios.map((ministerio) => (
                        <option key={ministerio.id} value={ministerio.id}>
                          {ministerio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Línea de Compromiso *
                    </label>
                    <select
                      value={metaForm.lineaId}
                      onChange={(e) => setMetaForm(prev => ({ 
                        ...prev, 
                        lineaId: e.target.value,
                        indicadorId: ''
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!metaForm.ministerioId}
                    >
                      <option value="">
                        {metaForm.ministerioId ? 'Selecciona una línea' : 'Primero selecciona un ministerio'}
                      </option>
                      {filteredLineas.map((linea) => (
                        <option key={linea.id} value={linea.id}>
                          {linea.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indicador *
                  </label>
                  <select
                    value={metaForm.indicadorId}
                    onChange={(e) => setMetaForm(prev => ({ ...prev, indicadorId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!metaForm.lineaId}
                  >
                    <option value="">
                      {metaForm.lineaId ? 'Selecciona un indicador' : 'Primero selecciona una línea'}
                    </option>
                    {filteredIndicadores.map((indicador) => (
                      <option key={indicador.id} value={indicador.id}>
                        {indicador.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mes *
                    </label>
                    <input
                      type="month"
                      value={metaForm.mes}
                      onChange={(e) => setMetaForm(prev => ({ ...prev, mes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={metaForm.meta}
                      onChange={(e) => setMetaForm(prev => ({ ...prev, meta: e.target.value }))}
                      placeholder="Ej: 100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={metaForm.descripcion}
                    onChange={(e) => setMetaForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción de la meta..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    loading={isLoading}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4" />
                    Crear Meta
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de metas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Metas Existentes</h2>
          
          {metas.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay metas creadas aún</p>
                <p className="text-sm text-gray-400">Crea tu primera meta usando el botón "Crear Nueva Meta"</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {metas.map((meta) => (
                <Card key={meta.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-medium text-gray-900 mb-2">
                          {meta.indicador?.nombre || 'Indicador no encontrado'}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Building2 className="h-4 w-4" />
                          <span>{meta.ministerio?.nombre || 'Ministerio no encontrado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>{meta.linea?.titulo || 'Línea no encontrada'}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {formatMes(meta.mes)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-900">
                          {meta.meta}
                        </span>
                        <span className="text-sm text-gray-600">
                          {meta.indicador?.unidadDefecto || 'unidades'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMeta(meta.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {meta.descripcion && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {meta.descripcion}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Metas</p>
                  <p className="text-2xl font-bold text-gray-900">{metas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ministerios</p>
                  <p className="text-2xl font-bold text-gray-900">{ministerios.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Indicadores</p>
                  <p className="text-2xl font-bold text-gray-900">{indicadores.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
