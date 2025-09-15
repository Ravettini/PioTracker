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
  Building2,
  FileText,
  Target,
  Save,
  ArrowLeft,
  Calendar,
  Hash,
  Type,
  Settings
} from 'lucide-react';

interface Ministerio {
  id: string;
  nombre: string;
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

export default function CreacionPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const { token } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'ministerio' | 'linea' | 'indicador'>('ministerio');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para ministerio
  const [ministerioForm, setMinisterioForm] = useState({
    nombre: '',
    sigla: '',
    descripcion: ''
  });
  
  // Estados para línea
  const [lineaForm, setLineaForm] = useState({
    titulo: '',
    ministerioId: ''
  });
  
  // Estados para indicador
  const [indicadorForm, setIndicadorForm] = useState({
    nombre: '',
    ministerioId: '',
    lineaId: '',
    unidadDefecto: '',
    periodicidad: 'mensual',
    meta: '',
    descripcion: ''
  });
  
  // Datos para selects
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [filteredLineas, setFilteredLineas] = useState<Linea[]>([]);

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
    if (indicadorForm.ministerioId) {
      const filtered = lineas.filter(linea => linea.ministerioId === indicadorForm.ministerioId);
      setFilteredLineas(filtered);
      // Limpiar línea seleccionada si no pertenece al ministerio
      if (indicadorForm.lineaId && !filtered.find(l => l.id === indicadorForm.lineaId)) {
        setIndicadorForm(prev => ({ ...prev, lineaId: '' }));
      }
    } else {
      setFilteredLineas(lineas);
    }
  }, [indicadorForm.ministerioId, lineas]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadMinisterios(),
        loadLineas()
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

  const handleCreateMinisterio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ministerioForm.nombre.trim() || !ministerioForm.sigla.trim()) {
      toast.error('El nombre y sigla del ministerio son requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/catalogos/ministerios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(ministerioForm),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Ministerio creado exitosamente');
        setMinisterioForm({ nombre: '', sigla: '', descripcion: '' });
        await loadMinisterios();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error creando ministerio');
      }
    } catch (error) {
      console.error('Error creando ministerio:', error);
      toast.error('Error creando ministerio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLinea = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lineaForm.titulo.trim() || !lineaForm.ministerioId) {
      toast.error('El título y ministerio son requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/catalogos/lineas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(lineaForm),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Línea creada exitosamente');
        setLineaForm({ titulo: '', ministerioId: '' });
        await loadLineas();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error creando línea');
      }
    } catch (error) {
      console.error('Error creando línea:', error);
      toast.error('Error creando línea');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateIndicador = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!indicadorForm.nombre.trim() || !indicadorForm.ministerioId || !indicadorForm.lineaId) {
      toast.error('El nombre, ministerio y línea son requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/catalogos/indicadores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(indicadorForm),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Indicador creado exitosamente');
        setIndicadorForm({
          nombre: '',
          ministerioId: '',
          lineaId: '',
          unidadDefecto: '',
          periodicidad: 'mensual',
          meta: '',
          descripcion: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error creando indicador');
      }
    } catch (error) {
      console.error('Error creando indicador:', error);
      toast.error('Error creando indicador');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/gestion')}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Gestión
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crear Nuevos Elementos
          </h1>
          <p className="text-gray-600">
            Crea ministerios, líneas de compromiso e indicadores
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap sm:flex-nowrap space-x-2 sm:space-x-8">
              {[
                { id: 'ministerio', name: 'Ministerio', icon: Building2 },
                { id: 'linea', name: 'Línea', icon: FileText },
                { id: 'indicador', name: 'Indicador', icon: Target },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{tab.name}</span>
                    <span className="xs:hidden">{tab.name.charAt(0)}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Formularios */}
        <div className="space-y-6">
          {/* Crear Ministerio */}
          {activeTab === 'ministerio' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Crear Nuevo Ministerio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMinisterio} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Ministerio *
                    </label>
                    <input
                      type="text"
                      value={ministerioForm.nombre}
                      onChange={(e) => setMinisterioForm(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Ministerio de Salud"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sigla *
                    </label>
                    <input
                      type="text"
                      value={ministerioForm.sigla}
                      onChange={(e) => setMinisterioForm(prev => ({ ...prev, sigla: e.target.value.toUpperCase() }))}
                      placeholder="Ej: SAL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={ministerioForm.descripcion}
                      onChange={(e) => setMinisterioForm(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción del ministerio..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      loading={isLoading}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4" />
                      Crear Ministerio
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Crear Línea */}
          {activeTab === 'linea' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Crear Nueva Línea de Compromiso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateLinea} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ministerio *
                    </label>
                    <select
                      value={lineaForm.ministerioId}
                      onChange={(e) => setLineaForm(prev => ({ ...prev, ministerioId: e.target.value }))}
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
                      Título de la Línea *
                    </label>
                    <input
                      type="text"
                      value={lineaForm.titulo}
                      onChange={(e) => setLineaForm(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ej: Mejorar la atención primaria de salud"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      loading={isLoading}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4" />
                      Crear Línea
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Crear Indicador */}
          {activeTab === 'indicador' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Crear Nuevo Indicador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateIndicador} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ministerio *
                    </label>
                    <select
                      value={indicadorForm.ministerioId}
                      onChange={(e) => setIndicadorForm(prev => ({ 
                        ...prev, 
                        ministerioId: e.target.value,
                        lineaId: '' // Limpiar línea cuando cambie ministerio
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
                      value={indicadorForm.lineaId}
                      onChange={(e) => setIndicadorForm(prev => ({ ...prev, lineaId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!indicadorForm.ministerioId}
                    >
                      <option value="">
                        {indicadorForm.ministerioId ? 'Selecciona una línea' : 'Primero selecciona un ministerio'}
                      </option>
                      {filteredLineas.map((linea) => (
                        <option key={linea.id} value={linea.id}>
                          {linea.titulo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Indicador *
                    </label>
                    <input
                      type="text"
                      value={indicadorForm.nombre}
                      onChange={(e) => setIndicadorForm(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Cantidad de centros de salud construidos"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidad por Defecto
                      </label>
                      <input
                        type="text"
                        value={indicadorForm.unidadDefecto}
                        onChange={(e) => setIndicadorForm(prev => ({ ...prev, unidadDefecto: e.target.value }))}
                        placeholder="Ej: unidades, %, personas"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Periodicidad
                      </label>
                      <select
                        value={indicadorForm.periodicidad}
                        onChange={(e) => setIndicadorForm(prev => ({ ...prev, periodicidad: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="mensual">Mensual</option>
                        <option value="trimestral">Trimestral</option>
                        <option value="semestral">Semestral</option>
                        <option value="anual">Anual</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta (opcional)
                    </label>
                    <input
                      type="text"
                      value={indicadorForm.meta}
                      onChange={(e) => setIndicadorForm(prev => ({ ...prev, meta: e.target.value }))}
                      placeholder="Ej: 50 centros de salud"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={indicadorForm.descripcion}
                      onChange={(e) => setIndicadorForm(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción del indicador..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      loading={isLoading}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4" />
                      Crear Indicador
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
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
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Líneas</p>
                  <p className="text-2xl font-bold text-gray-900">{lineas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Indicadores</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
