'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/store/auth-store';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  Building2,
  Target,
  FileText,
  Calendar,
  User,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle
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
  creadoEn: string;
  actualizadoEn: string;
}

export default function GestionPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { token } = useAuthStore();
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [filteredIndicadores, setFilteredIndicadores] = useState<Indicador[]>([]);
  const [selectedMinisterio, setSelectedMinisterio] = useState<string>('');
  const [selectedLinea, setSelectedLinea] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIndicador, setSelectedIndicador] = useState<Indicador | null>(null);
  const [selectedLinea, setSelectedLinea] = useState<Linea | null>(null);
  const [selectedMinisterio, setSelectedMinisterio] = useState<Ministerio | null>(null);
  const [deleteType, setDeleteType] = useState<'indicador' | 'linea' | 'ministerio'>('indicador');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [editForm, setEditForm] = useState({
    nombre: '',
    unidadDefecto: '',
    periodicidad: 'mensual',
    activo: true
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, router]);

  useEffect(() => {
    filterIndicadores();
  }, [indicadores, selectedMinisterio, selectedLinea, searchTerm]);

  useEffect(() => {
    setCurrentPage(1); // Reset a la primera página cuando cambian los filtros
  }, [selectedMinisterio, selectedLinea, searchTerm]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadMinisterios(),
        loadLineas(),
        loadIndicadores()
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

  const filterIndicadores = () => {
    let filtered = indicadores;

    if (selectedMinisterio) {
      filtered = filtered.filter(ind => ind.linea.ministerioId === selectedMinisterio);
    }

    if (selectedLinea) {
      filtered = filtered.filter(ind => ind.lineaId === selectedLinea);
    }

    if (searchTerm) {
      filtered = filtered.filter(ind => 
        ind.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ind.linea.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ind.linea.ministerio.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredIndicadores(filtered);
    setTotalItems(filtered.length);
  };

  const handleEdit = (indicador: Indicador) => {
    setSelectedIndicador(indicador);
    setEditForm({
      nombre: indicador.nombre,
      unidadDefecto: indicador.unidadDefecto,
      periodicidad: indicador.periodicidad,
      activo: indicador.activo
    });
    setShowEditModal(true);
  };

  const handleDelete = (indicador: Indicador) => {
    setSelectedIndicador(indicador);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedIndicador) return;

    setIsLoading(true);
    try {
      const response = await fetch(`https://sigepi-backend.onrender.com/api/v1/catalogos/indicadores/${selectedIndicador.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success('Indicador actualizado exitosamente');
        setShowEditModal(false);
        await loadIndicadores();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error actualizando indicador');
      }
    } catch (error) {
      console.error('Error actualizando indicador:', error);
      toast.error('Error actualizando indicador');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteType === 'indicador' && selectedIndicador) {
      await handleDeleteIndicador();
    } else if (deleteType === 'linea' && selectedLinea) {
      await handleDeleteLinea();
    } else if (deleteType === 'ministerio' && selectedMinisterio) {
      await handleDeleteMinisterio();
    }
  };

  const handleDeleteIndicador = async () => {
    if (!selectedIndicador) return;

    setIsLoading(true);
    try {
      const response = await fetch(`https://sigepi-backend.onrender.com/api/v1/catalogos/indicadores/${selectedIndicador.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Indicador eliminado exitosamente');
        setShowDeleteModal(false);
        await loadIndicadores();
        setSelectedIndicador(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error eliminando indicador');
      }
    } catch (error) {
      console.error('Error eliminando indicador:', error);
      toast.error('Error eliminando indicador');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLinea = async () => {
    if (!selectedLinea) return;

    setIsLoading(true);
    try {
      const response = await fetch(`https://sigepi-backend.onrender.com/api/v1/catalogos/lineas/${selectedLinea.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Línea de compromiso eliminada exitosamente');
        setShowDeleteModal(false);
        await loadLineas();
        setSelectedLinea(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error eliminando línea');
      }
    } catch (error) {
      console.error('Error eliminando línea:', error);
      toast.error('Error eliminando línea');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMinisterio = async () => {
    if (!selectedMinisterio) return;

    setIsLoading(true);
    try {
      const response = await fetch(`https://sigepi-backend.onrender.com/api/v1/catalogos/ministerios/${selectedMinisterio.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Ministerio eliminado exitosamente');
        setShowDeleteModal(false);
        await loadMinisterios();
        setSelectedMinisterio(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error eliminando ministerio');
      }
    } catch (error) {
      console.error('Error eliminando ministerio:', error);
      toast.error('Error eliminando ministerio');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (type: 'indicador' | 'linea' | 'ministerio', item: any) => {
    setDeleteType(type);
    if (type === 'indicador') {
      setSelectedIndicador(item);
    } else if (type === 'linea') {
      setSelectedLinea(item);
    } else if (type === 'ministerio') {
      setSelectedMinisterio(item);
    }
    setShowDeleteModal(true);
  };

  // Funciones de paginación
  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (total: number) => {
    return Math.ceil(total / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPaginationInfo = () => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return { start, end };
  };

  const getPeriodicidadDisplay = (periodicidad: string) => {
    switch (periodicidad) {
      case 'mensual': return 'Mensual';
      case 'trimestral': return 'Trimestral';
      case 'semestral': return 'Semestral';
      case 'anual': return 'Anual';
      default: return periodicidad;
    }
  };

  const getPeriodicidadColor = (periodicidad: string) => {
    switch (periodicidad) {
      case 'mensual': return 'bg-blue-100 text-blue-800';
      case 'trimestral': return 'bg-green-100 text-green-800';
      case 'semestral': return 'bg-yellow-100 text-yellow-800';
      case 'anual': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Indicadores y Compromisos
          </h1>
          <p className="text-gray-600">
            Administra indicadores, compromisos y sus configuraciones
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ministerio
                </label>
                <select
                  value={selectedMinisterio}
                  onChange={(e) => setSelectedMinisterio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los ministerios</option>
                  {ministerios.map((ministerio) => (
                    <option key={ministerio.id} value={ministerio.id}>
                      {ministerio.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Línea
                </label>
                <select
                  value={selectedLinea}
                  onChange={(e) => setSelectedLinea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las líneas</option>
                  {lineas
                    .filter(linea => !selectedMinisterio || linea.ministerioId === selectedMinisterio)
                    .map((linea) => (
                      <option key={linea.id} value={linea.id}>
                        {linea.titulo}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar indicadores..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSelectedMinisterio('');
                    setSelectedLinea('');
                    setSearchTerm('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
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
                  <p className="text-2xl font-bold text-gray-900">{indicadores.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {indicadores.filter(ind => ind.activo).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gestión de Ministerios */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ministerios ({ministerios.length})</span>
              <Button
                onClick={() => router.push('/creacion')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear Ministerio
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Sigla</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ministerios.map((ministerio) => (
                    <tr key={ministerio.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{ministerio.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{ministerio.id}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={ministerio.activo ? "default" : "secondary"}>
                          {ministerio.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal('ministerio', ministerio)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs px-2 py-1"
                            title="Eliminar ministerio"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden xl:inline">Eliminar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Líneas de Compromiso */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Líneas de Compromiso ({lineas.length})</span>
              <Button
                onClick={() => router.push('/creacion')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear Línea
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Título</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ministerio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.map((linea) => (
                    <tr key={linea.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900 truncate max-w-xs" title={linea.titulo}>
                            {linea.titulo}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{linea.ministerio.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={linea.activo ? "default" : "secondary"}>
                          {linea.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal('linea', linea)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs px-2 py-1"
                            title="Eliminar línea"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden xl:inline">Eliminar</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Indicadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Indicadores ({filteredIndicadores.length})</span>
              <Button
                onClick={() => router.push('/creacion')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear Elementos
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando...</p>
              </div>
            ) : filteredIndicadores.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron indicadores</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Vista de escritorio */}
                <div className="hidden lg:block">
                  <div className="overflow-x-auto max-w-full">
                    <table className="w-full" style={{ maxWidth: '100%', tableLayout: 'fixed' }}>
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '30%' }}>Indicador</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '12%' }}>Ministerio</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '25%' }}>Línea</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '8%' }}>Unidad</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '8%' }}>Periodicidad</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '8%' }}>Estado</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '9%' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(filteredIndicadores).map((indicador) => (
                        <tr key={indicador.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4" style={{ width: '30%' }}>
                            <div className="max-w-xs">
                              <p 
                                className="font-medium text-gray-900 truncate" 
                                title={indicador.nombre}
                              >
                                {indicador.nombre}
                              </p>
                              <p 
                                className="text-sm text-gray-500 truncate" 
                                title={`ID: ${indicador.id}`}
                              >
                                ID: {indicador.id}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4" style={{ width: '12%' }}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span 
                                className="text-sm text-gray-700 truncate" 
                                title={indicador.linea.ministerio.nombre}
                              >
                                {indicador.linea.ministerio.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4" style={{ width: '25%' }}>
                            <div className="max-w-xs">
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span 
                                  className="text-sm text-gray-700 truncate" 
                                  title={indicador.linea.titulo}
                                >
                                  {indicador.linea.titulo}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4" style={{ width: '8%' }}>
                            <Badge variant="outline" className="text-xs">
                              {indicador.unidadDefecto}
                            </Badge>
                          </td>
                          <td className="py-3 px-4" style={{ width: '8%' }}>
                            <Badge className={`${getPeriodicidadColor(indicador.periodicidad)} text-xs`}>
                              {getPeriodicidadDisplay(indicador.periodicidad)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4" style={{ width: '8%' }}>
                            <Badge variant={indicador.activo ? 'success' : 'secondary'} className="text-xs">
                              {indicador.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4" style={{ width: '9%' }}>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(indicador)}
                                className="flex items-center gap-1 text-xs px-2 py-1"
                                title="Editar indicador"
                              >
                                <Edit className="h-3 w-3" />
                                <span className="hidden xl:inline">Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteModal('indicador', indicador)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs px-2 py-1"
                                title="Eliminar indicador"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="hidden xl:inline">Eliminar</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>

                {/* Vista móvil */}
                <div className="lg:hidden space-y-4">
                  {getPaginatedData(filteredIndicadores).map((indicador) => (
                    <Card key={indicador.id} className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 
                            className="font-medium text-gray-900 break-words" 
                            title={indicador.nombre}
                          >
                            {indicador.nombre}
                          </h3>
                          <p className="text-sm text-gray-500 break-all">ID: {indicador.id}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span 
                              className="text-sm text-gray-700 truncate" 
                              title={indicador.linea.ministerio.nombre}
                            >
                              {indicador.linea.ministerio.nombre}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span 
                              className="text-sm text-gray-700 break-words" 
                              title={indicador.linea.titulo}
                            >
                              {indicador.linea.titulo}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">{indicador.unidadDefecto}</Badge>
                          <Badge className={`${getPeriodicidadColor(indicador.periodicidad)} text-xs`}>
                            {getPeriodicidadDisplay(indicador.periodicidad)}
                          </Badge>
                          <Badge variant={indicador.activo ? 'success' : 'secondary'} className="text-xs">
                            {indicador.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(indicador)}
                            className="flex items-center gap-1 flex-1 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal('indicador', indicador)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 flex-1 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Paginación */}
                {totalItems > itemsPerPage && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Mostrando {getPaginationInfo().start} a {getPaginationInfo().end} de {totalItems} indicadores
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1"
                      >
                        Anterior
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: getTotalPages(totalItems) }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="px-3 py-1 min-w-[40px]"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages(totalItems)}
                        className="px-3 py-1"
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Edición */}
        {showEditModal && selectedIndicador && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Editar Indicador
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={editForm.nombre}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad por Defecto
                  </label>
                  <input
                    type="text"
                    value={editForm.unidadDefecto}
                    onChange={(e) => setEditForm(prev => ({ ...prev, unidadDefecto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Periodicidad
                  </label>
                  <select
                    value={editForm.periodicidad}
                    onChange={(e) => setEditForm(prev => ({ ...prev, periodicidad: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={editForm.activo}
                    onChange={(e) => setEditForm(prev => ({ ...prev, activo: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                    Indicador activo
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Eliminación
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar {deleteType === 'indicador' ? 'el indicador' : deleteType === 'linea' ? 'la línea de compromiso' : 'el ministerio'} "
                {deleteType === 'indicador' ? selectedIndicador?.nombre : 
                 deleteType === 'linea' ? selectedLinea?.titulo : 
                 selectedMinisterio?.nombre}"?
                Esta acción no se puede deshacer.
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
