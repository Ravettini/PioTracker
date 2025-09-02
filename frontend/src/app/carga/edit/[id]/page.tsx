'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useIsAuthenticated } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { CargaConRelaciones, Ministerio, Linea, Indicador, CreateCargaDto } from '@/types';
import { apiClient } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Save,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

// Schema de validación para edición
const editCargaSchema = z.object({
  indicadorId: z.string().min(1, 'Debe seleccionar un indicador'),
  periodo: z.string().min(1, 'El período es requerido'),
  valor: z.string().min(1, 'El valor es requerido'),
  unidad: z.string().min(1, 'La unidad es requerida'),
  fuente: z.string().min(1, 'La fuente es requerida'),
  responsable: z.string().min(1, 'El responsable es requerido'),
  observaciones: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

type EditCargaFormData = z.infer<typeof editCargaSchema>;

export default function EditCargaPage() {
  const router = useRouter();
  const params = useParams();
  const cargaId = params.id as string;
  const isAuthenticated = useIsAuthenticated();
  
  const [carga, setCarga] = useState<CargaConRelaciones | null>(null);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedMinisterio, setSelectedMinisterio] = useState<string>('');
  const [selectedLinea, setSelectedLinea] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<EditCargaFormData>({
    resolver: zodResolver(editCargaSchema),
    mode: 'onChange',
  });

  const watchedIndicadorId = watch('indicadorId');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (cargaId) {
      loadCarga();
    }
    loadCatalogos();
  }, [isAuthenticated, cargaId, router]);

  useEffect(() => {
    if (carga && carga.indicador) {
      setValue('indicadorId', carga.indicador.id);
      setValue('periodo', carga.periodo);
      setValue('valor', carga.valor.toString());
      setValue('unidad', carga.unidad);
      setValue('fuente', carga.fuente);
      setValue('responsable', carga.responsableNombre);
      setValue('observaciones', carga.observaciones || '');
      
      if (carga.linea) {
        setSelectedLinea(carga.linea.id);
        if (carga.linea.ministerioId) {
          setSelectedMinisterio(carga.linea.ministerioId);
        }
      }
    }
  }, [carga, setValue]);

  useEffect(() => {
    if (selectedMinisterio) {
      loadLineas(selectedMinisterio);
    }
  }, [selectedMinisterio]);

  useEffect(() => {
    if (selectedLinea) {
      loadIndicadores(selectedLinea);
    }
  }, [selectedLinea]);

  const loadCarga = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.cargas.getById(cargaId);
      
      if (response.success) {
        setCarga(response.data);
      } else {
        toast.error(response.message || 'Error al cargar la carga');
        router.push('/mis-envios');
      }
    } catch (error) {
      console.error('Error cargando carga:', error);
      toast.error('Error al cargar la carga');
      router.push('/mis-envios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCatalogos = async () => {
    try {
      const [ministeriosRes, lineasRes, indicadoresRes] = await Promise.all([
        apiClient.catalogos.getMinisterios(),
        apiClient.catalogos.getLineas(),
        apiClient.catalogos.getIndicadores(),
      ]);

      if (ministeriosRes.success) setMinisterios(ministeriosRes.data);
      if (lineasRes.success) setLineas(lineasRes.data);
      if (indicadoresRes.success) setIndicadores(indicadoresRes.data);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
      toast.error('Error al cargar los catálogos');
    }
  };

  const loadLineas = async (ministerioId: string) => {
    try {
      const response = await apiClient.catalogos.getLineasByMinisterio(ministerioId);
      if (response.success) {
        setLineas(response.data);
      }
    } catch (error) {
      console.error('Error cargando líneas:', error);
    }
  };

  const loadIndicadores = async (lineaId: string) => {
    try {
      const response = await apiClient.catalogos.getIndicadoresByLinea(lineaId);
      if (response.success) {
        setIndicadores(response.data);
      }
    } catch (error) {
      console.error('Error cargando indicadores:', error);
    }
  };

  const getPeriodoPlaceholder = (indicador: Indicador | null) => {
    if (!indicador) return 'Ej: 2024-Q1';
    
    switch (indicador.periodicidad) {
      case 'anual':
        return 'Ej: 2024';
      case 'semestral':
        return 'Ej: 2024-S1';
      case 'trimestral':
        return 'Ej: 2024-Q1';
      case 'mensual':
        return 'Ej: 2024-01';
      default:
        return 'Ej: 2024-Q1';
    }
  };

  const canEdit = () => {
    return carga && ['borrador', 'observado'].includes(carga.estado);
  };

  const canSend = () => {
    return carga && carga.estado === 'borrador';
  };

  const onSubmit = async (data: EditCargaFormData) => {
    if (!carga) return;

    setIsSaving(true);
    try {
      const updateData: CreateCargaDto = {
        ...data,
        metadata: data.metadata || {},
      };

      const response = await apiClient.cargas.update(carga.id, updateData);
      
      if (response.success) {
        toast.success('Carga actualizada exitosamente');
        setCarga(response.data);
      } else {
        toast.error(response.message || 'Error al actualizar la carga');
      }
    } catch (error: any) {
      console.error('Error actualizando carga:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar la carga';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!carga) return;

    if (!confirm('¿Estás seguro de que quieres enviar esta carga para revisión?')) {
      return;
    }

    setIsSending(true);
    try {
      const response = await apiClient.cargas.enviar(carga.id);
      
      if (response.success) {
        toast.success('Carga enviada exitosamente');
        setCarga(response.data);
      } else {
        toast.error(response.message || 'Error al enviar la carga');
      }
    } catch (error: any) {
      console.error('Error enviando carga:', error);
      const errorMessage = error.response?.data?.message || 'Error al enviar la carga';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    if (!carga) return;

    if (!confirm('¿Estás seguro de que quieres eliminar esta carga? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await apiClient.cargas.delete(carga.id);
      
      if (response.success) {
        toast.success('Carga eliminada exitosamente');
        router.push('/mis-envios');
      } else {
        toast.error(response.message || 'Error al eliminar la carga');
      }
    } catch (error: any) {
      console.error('Error eliminando carga:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar la carga';
      toast.error(errorMessage);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gcba-blue"></div>
          <span className="ml-3 text-lg text-gray-600">Cargando carga...</span>
        </div>
      </Layout>
    );
  }

  if (!carga) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Carga no encontrada</h2>
          <p className="text-gray-600 mb-6">La carga que buscas no existe o no tienes permisos para verla</p>
          <Button onClick={() => router.push('/mis-envios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Mis Envíos
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/mis-envios')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Editar Carga
              </h1>
              <p className="text-gray-600 mt-2">
                Modifica los datos de tu carga de indicador
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant={carga.estado === 'borrador' ? 'outline' : 
                           carga.estado === 'pendiente' ? 'warning' :
                           carga.estado === 'validado' ? 'success' :
                           carga.estado === 'observado' ? 'destructive' : 'outline'}>
              {carga.estado === 'borrador' && <Edit3 className="h-3 w-3 mr-1" />}
              {carga.estado === 'pendiente' && <Clock className="h-3 w-3 mr-1" />}
              {carga.estado === 'validado' && <CheckCircle className="h-3 w-3 mr-1" />}
              {carga.estado === 'observado' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {carga.estado.charAt(0).toUpperCase() + carga.estado.slice(1)}
            </Badge>
            
            {canDelete() && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="px-3"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Información de la carga */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Carga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ministerio
                </label>
                                 <Select
                   options={ministerios.map(m => ({ value: m.id, label: m.nombre }))}
                   value={selectedMinisterio}
                   onChange={(e) => setSelectedMinisterio(e.target.value)}
                   disabled={!canEdit()}
                   placeholder="Seleccionar ministerio"
                 />
              </div>
              
              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compromiso
                  </label>
                                 <Select
                   options={lineas.map(l => ({ value: l.id, label: l.titulo }))}
                   value={selectedLinea}
                   onChange={(e) => setSelectedLinea(e.target.value)}
                   disabled={!canEdit()}
                                       placeholder="Seleccionar compromiso"
                 />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de edición */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información del indicador */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Indicador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indicador <span className="text-red-500">*</span>
                </label>
                                                  <Select
                   options={indicadores.map(i => ({ 
                     value: i.id, 
                     label: i.nombre 
                   }))}
                   value={watchedIndicadorId}
                   onChange={(e) => setValue('indicadorId', e.target.value)}
                   disabled={!canEdit()}
                   placeholder="Seleccionar indicador"
                   error={errors.indicadorId?.message}
                 />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('periodo')}
                  placeholder={getPeriodoPlaceholder(
                    indicadores.find(i => i.id === watchedIndicadorId) || null
                  )}
                  disabled={!canEdit()}
                  error={errors.periodo?.message}
                  helperText="Formato según la periodicidad del indicador"
                />
              </div>
            </CardContent>
          </Card>

          {/* Valores y metadatos */}
          <Card>
            <CardHeader>
              <CardTitle>Valores y Metadatos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('valor')}
                    placeholder="Ej: 85.5"
                    disabled={!canEdit()}
                    error={errors.valor?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('unidad')}
                    placeholder="Ej: Porcentaje, Cantidad, etc."
                    disabled={!canEdit()}
                    error={errors.unidad?.message}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuente <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('fuente')}
                  placeholder="Ej: Encuesta, Sistema, etc."
                  disabled={!canEdit()}
                  error={errors.fuente?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsable <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('responsable')}
                  placeholder="Nombre del responsable"
                  disabled={!canEdit()}
                  error={errors.responsable?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  {...register('observaciones')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gcba-blue focus:border-gcba-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Observaciones adicionales..."
                  disabled={!canEdit()}
                />
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          {canEdit() && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={!isValid || isSaving}
                    loading={isSaving}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>

                  {canSend() && (
                    <Button
                      type="button"
                      onClick={handleSend}
                      disabled={isSending}
                      loading={isSending}
                      variant="success"
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? 'Enviando...' : 'Enviar para Revisión'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información de auditoría */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Auditoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                 <div>
                   <p className="text-gray-600">Creada:</p>
                   <p className="font-medium">
                     {carga.creadoEn ? new Date(carga.creadoEn).toLocaleString('es-AR') : 'N/A'}
                   </p>
                 </div>
                 <div>
                   <p className="text-gray-600">Última modificación:</p>
                   <p className="font-medium">
                     {carga.actualizadoEn ? new Date(carga.actualizadoEn).toLocaleString('es-AR') : 'N/A'}
                   </p>
                 </div>
                                 {/* TODO: Agregar campo observacionesRevision a la interfaz Carga */}
                 {carga.estado === 'observado' && (
                   <div className="md:col-span-2">
                     <p className="text-gray-600">Observaciones de revisión:</p>
                     <p className="font-medium text-red-600 bg-red-50 p-3 rounded-md mt-1">
                       Observaciones pendientes de implementar
                     </p>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </Layout>
  );
}

// Función auxiliar para verificar si se puede eliminar
function canDelete(): boolean {
  // Solo se puede eliminar si está en borrador y no ha sido enviada
  return true; // Implementar lógica según reglas de negocio
}
