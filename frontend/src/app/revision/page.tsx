'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useIsAdmin } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectOption } from '../../components/ui/Select';
import { CargaConRelaciones, RevisionRequest } from '@/types';
import { apiClient } from '@/lib/api';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Edit,
  Filter,
  RefreshCw,
  Calendar,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RevisionPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const [cargas, setCargas] = useState<CargaConRelaciones[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCarga, setSelectedCarga] = useState<CargaConRelaciones | null>(null);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [revisionData, setRevisionData] = useState<RevisionRequest>({
    estado: 'validado',
    observaciones: '',
  });
  const [editData, setEditData] = useState({
    valor: '',
    unidad: '',
    meta: '',
    fuente: '',
    responsableNombre: '',
    responsableEmail: '',
    observaciones: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const loadCargasPendientes = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando cargas pendientes...');
      
      const response = await apiClient.cargas.getAll({ estado: 'pendiente' });
      console.log('📊 Respuesta de cargas pendientes:', response);
      
      // El backend devuelve { cargas, total }, no { data: { cargas, total } }
      const cargas = response.cargas || [];
      console.log('📊 Cargas pendientes encontradas:', cargas.length);
      console.log('📊 Estados de las cargas:', cargas.map((c: any) => ({ id: c.id, estado: c.estado })));
      
      setCargas(cargas);
      console.log('✅ Estado de cargas actualizado');
    } catch (error) {
      console.error('❌ Error cargando cargas pendientes:', error);
      toast.error('Error al cargar las cargas pendientes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    loadCargasPendientes();
  }, [isAuthenticated, isAdmin, router]);

  // Debug: Monitorear cambios en el estado del modal
  useEffect(() => {
    console.log('🔍 Estado del modal cambiado:', { showRevisionModal, showEditModal, selectedCarga: !!selectedCarga });
  }, [showRevisionModal, showEditModal, selectedCarga]);

  const handleRevision = async () => {
    if (!selectedCarga) return;

    if (revisionData.estado === 'observado' && (!revisionData.observaciones || !revisionData.observaciones.trim())) {
      toast.error('Las observaciones son obligatorias para cargas observadas');
      return;
    }

    if (revisionData.estado === 'rechazado' && (!revisionData.observaciones || !revisionData.observaciones.trim())) {
      toast.error('Las observaciones son obligatorias para cargas rechazadas');
      return;
    }

    // Cerrar modal INMEDIATAMENTE
    setShowRevisionModal(false);
    setSelectedCarga(null);
    setRevisionData({ estado: 'validado', observaciones: '' });

    setIsSubmitting(true);
    try {
      console.log('🔄 Enviando revisión:', { cargaId: selectedCarga.id, revisionData });
      
      const response = await apiClient.cargas.revisar(selectedCarga.id, revisionData);
      console.log('✅ Respuesta de revisión:', response);
      
      const estadoText = revisionData.estado === 'validado' ? 'validada' : 
                        revisionData.estado === 'observado' ? 'observada' : 'rechazada';
      
      // Mostrar toast de éxito
      toast.success(`Carga ${estadoText} exitosamente`);
      
      // Recargar lista de cargas pendientes
      console.log('🔄 Recargando lista de cargas...');
      await loadCargasPendientes();
      console.log('✅ Lista recargada');
      
    } catch (error: any) {
      console.error('❌ Error revisando carga:', error);
      const errorMessage = error.response?.data?.message || 'Error al revisar la carga';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCarga) return;

    setIsEditing(true);
    try {
      console.log('🔄 Enviando edición:', { cargaId: selectedCarga.id, editData });
      
      const response = await apiClient.cargas.update(selectedCarga.id, {
        valor: parseFloat(editData.valor),
        unidad: editData.unidad,
        meta: editData.meta ? parseFloat(editData.meta) : undefined,
        fuente: editData.fuente,
        responsableNombre: editData.responsableNombre,
        responsableEmail: editData.responsableEmail,
        observaciones: editData.observaciones || undefined,
      });
      
      console.log('✅ Respuesta de edición:', response);
      toast.success('Carga editada exitosamente');
      
      // Recargar lista de cargas pendientes
      await loadCargasPendientes();
      
      // Cerrar modal de edición
      closeEditModal();
      
    } catch (error: any) {
      console.error('❌ Error editando carga:', error);
      const errorMessage = error.response?.data?.message || 'Error al editar la carga';
      toast.error(errorMessage);
    } finally {
      setIsEditing(false);
    }
  };

  const openRevisionModal = (carga: CargaConRelaciones) => {
    setSelectedCarga(carga);
    setRevisionData({ estado: 'validado', observaciones: '' });
    setShowRevisionModal(true);
  };

  const openEditModal = (carga: CargaConRelaciones) => {
    setSelectedCarga(carga);
    setEditData({
      valor: carga.valor.toString(),
      unidad: carga.unidad,
      meta: carga.meta ? carga.meta.toString() : '',
      fuente: carga.fuente,
      responsableNombre: carga.responsableNombre,
      responsableEmail: carga.responsableEmail,
      observaciones: carga.observaciones || '',
    });
    setShowEditModal(true);
  };

  const closeRevisionModal = () => {
    setShowRevisionModal(false);
    setSelectedCarga(null);
    setRevisionData({ estado: 'validado', observaciones: '' });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedCarga(null);
    setEditData({
      valor: '',
      unidad: '',
      meta: '',
      fuente: '',
      responsableNombre: '',
      responsableEmail: '',
      observaciones: '',
    });
  };

  // Función de prueba para cerrar modal
  const testCloseModal = () => {
    console.log('🧪 Probando cierre de modal...');
    setShowRevisionModal(false);
    setSelectedCarga(null);
    setRevisionData({ estado: 'validado', observaciones: '' });
    console.log('✅ Modal cerrado por prueba');
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

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const estadoOptions: SelectOption[] = [
    { value: 'validado', label: 'Validar' },
    { value: 'observado', label: 'Observar' },
    { value: 'rechazado', label: 'Rechazar' },
  ];

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
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
                Revisión de Cargas
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
                Revisa y aprueba las cargas pendientes de validación
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={loadCargasPendientes}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 items-center justify-center py-2 md:py-8">
          <Card className="flex justify-center items-center hover:shadow-md transition-shadow">
            <CardContent className="p-6 pt-15 p-6 w-full text-center">
              <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4">
                <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-estado-pendiente" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{cargas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex justify-center items-center hover:shadow-md transition-shadow">
            <CardContent className="p-6 pt-15 p-6 w-full text-center">
              <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4">
                <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-gcba-blue" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Cargas</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{cargas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex justify-center items-center hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <CardContent className="p-6 pt-15 p-6 w-full text-center">
              <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4">
                <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-estado-validado" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Listas para Revisar</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{cargas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de cargas pendientes */}
        <Card>
          <CardHeader>
            <CardTitle>
              Cargas Pendientes de Revisión ({cargas.length})
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
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay cargas pendientes
                </h3>
                <p className="text-gray-600">
                  Todas las cargas han sido revisadas
                </p>
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
                        Ministerio
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Período
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Valor
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Responsable
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
                              {carga.linea.titulo}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline">
                            {carga.ministerio.sigla}
                          </Badge>
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
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {carga.responsableNombre}
                            </p>
                            <p className="text-xs text-gray-600">
                              {carga.responsableEmail}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600">
                            {format(new Date(carga.creadoEn), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRevisionModal(carga)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Revisar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(carga)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
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

      {/* Modal de revisión */}
      {showRevisionModal && selectedCarga && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Revisar Carga
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeRevisionModal}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              {/* Detalles de la carga */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Indicador</p>
                    <p className="text-gray-900">{selectedCarga.indicador.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ministerio</p>
                    <p className="text-gray-900">{selectedCarga.ministerio.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Período</p>
                    <p className="text-gray-900">
                      {getPeriodoDisplay(selectedCarga.periodo, selectedCarga.periodicidad)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor</p>
                    <p className="text-gray-900">
                      {selectedCarga.valor} {selectedCarga.unidad}
                    </p>
                  </div>
                </div>

                {selectedCarga.observaciones && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Observaciones del Usuario</p>
                    <p className="text-gray-900">{selectedCarga.observaciones}</p>
                  </div>
                )}
              </div>

              {/* Formulario de revisión */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Decisión *</label>
                  <Select
                    value={revisionData.estado}
                    onValueChange={(value) => setRevisionData(prev => ({ ...prev, estado: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una decisión" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(revisionData.estado === 'observado' || revisionData.estado === 'rechazado') && (
                  <Input
                    label="Observaciones"
                    placeholder="Explica el motivo de la observación o rechazo"
                    value={revisionData.observaciones}
                    onChange={(e) => setRevisionData(prev => ({ ...prev, observaciones: e.target.value }))}
                    required
                  />
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={testCloseModal}
                    disabled={isSubmitting}
                  >
                    🧪 Test Cerrar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeRevisionModal}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRevision}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                  >
                    {revisionData.estado === 'validado' && <CheckCircle className="h-4 w-4 mr-2" />}
                    {revisionData.estado === 'observado' && <AlertTriangle className="h-4 w-4 mr-2" />}
                    {revisionData.estado === 'rechazado' && <XCircle className="h-4 w-4 mr-2" />}
                    {revisionData.estado === 'validado' ? 'Validar' : 
                     revisionData.estado === 'observado' ? 'Observar' : 'Rechazar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && selectedCarga && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Editar Carga
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeEditModal}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              {/* Información no editable */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Información del Indicador</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Indicador:</p>
                    <p className="font-medium text-gray-900">{selectedCarga.indicador.nombre}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ministerio:</p>
                    <p className="font-medium text-gray-900">{selectedCarga.ministerio.nombre}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Compromiso:</p>
                    <p className="font-medium text-gray-900">{selectedCarga.linea.titulo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Período:</p>
                    <p className="font-medium text-gray-900">
                      {getPeriodoDisplay(selectedCarga.periodo, selectedCarga.periodicidad)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario de edición */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Valor *"
                    type="number"
                    step="0.01"
                    value={editData.valor}
                    onChange={(e) => setEditData(prev => ({ ...prev, valor: e.target.value }))}
                    required
                  />
                  <Input
                    label="Unidad de Medida *"
                    value={editData.unidad}
                    onChange={(e) => setEditData(prev => ({ ...prev, unidad: e.target.value }))}
                    required
                  />
                </div>

                <Input
                  label="Meta (Opcional)"
                  type="number"
                  step="0.01"
                  value={editData.meta}
                  onChange={(e) => setEditData(prev => ({ ...prev, meta: e.target.value }))}
                />

                <Input
                  label="Fuente de los Datos *"
                  value={editData.fuente}
                  onChange={(e) => setEditData(prev => ({ ...prev, fuente: e.target.value }))}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nombre del Responsable *"
                    value={editData.responsableNombre}
                    onChange={(e) => setEditData(prev => ({ ...prev, responsableNombre: e.target.value }))}
                    required
                  />
                  <Input
                    label="Email del Responsable *"
                    type="email"
                    value={editData.responsableEmail}
                    onChange={(e) => setEditData(prev => ({ ...prev, responsableEmail: e.target.value }))}
                    required
                  />
                </div>

                <Input
                  label="Observaciones (Opcional)"
                  value={editData.observaciones}
                  onChange={(e) => setEditData(prev => ({ ...prev, observaciones: e.target.value }))}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeEditModal}
                    disabled={isEditing}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEdit}
                    disabled={isEditing}
                    loading={isEditing}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
