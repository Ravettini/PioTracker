'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useAuthStore } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import toast from 'react-hot-toast';

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
  activo: boolean;
}

interface Indicador {
  id: string;
  nombre: string;
  lineaId: string;
  unidadDefecto: string;
  periodicidad: string;
  activo: boolean;
}

export default function CargaPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { token } = useAuthStore();
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [filteredMinisterios, setFilteredMinisterios] = useState<Ministerio[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [selectedMinisterio, setSelectedMinisterio] = useState<string>('');
  const [selectedLinea, setSelectedLinea] = useState<string>('');
  const [selectedIndicador, setSelectedIndicador] = useState<string>('');
  const [periodo, setPeriodo] = useState<string>('2024');
  const [mes, setMes] = useState<string>('');
  const [valor, setValor] = useState<string>('0.00');
  const [unidad, setUnidad] = useState<string>('');
  const [meta, setMeta] = useState<string>('0.00');
  const [fuente, setFuente] = useState<string>('');
  const [responsableNombre, setResponsableNombre] = useState<string>('');
  const [responsableEmail, setResponsableEmail] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCompromiso, setShowNewCompromiso] = useState(false);
  const [newCompromiso, setNewCompromiso] = useState<string>('');
  const [showNewIndicador, setShowNewIndicador] = useState(false);
  const [newIndicador, setNewIndicador] = useState<string>('');
  const [showNewMeta, setShowNewMeta] = useState(false);
  const [newMeta, setNewMeta] = useState<string>('');
  const [metas, setMetas] = useState<Array<{id: string, nombre: string}>>([]);

  // Función para obtener el placeholder del período según el indicador
  const getPeriodoPlaceholder = () => {
    const indicador = indicadores.find(i => i.id === selectedIndicador);
    if (!indicador) return 'Selecciona un indicador primero';
    
    switch (indicador.periodicidad) {
      case 'mensual':
        return 'YYYY-MM (ej: 2025-08)';
      case 'trimestral':
        return 'YYYYQn (ej: 2025Q1)';
      case 'semestral':
        return 'YYYYSn (ej: 2025S1)';
      case 'anual':
        return 'YYYY (ej: 2025)';
      default:
        return 'Formato según periodicidad';
    }
  };

  // Función para validar el formato del período
  const validarPeriodo = (periodo: string, periodicidad: string): boolean => {
    // Validar tanto "2024" como "2025-2027"
    return periodo === '2024' || periodo === '2025-2027';
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadMinisterios();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMinisterios();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedMinisterio) {
      loadLineas(selectedMinisterio).then(lineasData => {
        setLineas(lineasData);
        setSelectedLinea(''); // Reset línea seleccionada
        setSelectedIndicador(''); // Reset indicador seleccionado
        setIndicadores([]); // Reset indicadores
      });
    }
  }, [selectedMinisterio]);

  useEffect(() => {
    if (selectedLinea) {
      loadIndicadores(selectedLinea).then(indicadoresData => {
        setIndicadores(indicadoresData);
        setSelectedIndicador(''); // Reset indicador seleccionado
      });
    }
  }, [selectedLinea]);

  useEffect(() => {
    if (selectedMinisterio) {
      setSelectedLinea('');
      setSelectedIndicador('');
    }
  }, [selectedMinisterio]);

  useEffect(() => {
    if (selectedLinea) {
      setSelectedIndicador('');
    }
  }, [selectedLinea]);

  const loadMinisterios = async () => {
    try {
      setIsLoading(true);

      console.log('🔄 Cargando ministerios desde la API...');
      
      // Llamada a la API para obtener ministerios
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/catalogos/ministerios', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos de la API:', data);
        setMinisterios(data.data || data || []);
        setFilteredMinisterios(data.data || data || []);
      } else {
        console.error('❌ Error obteniendo ministerios de la API:', response.status);
        toast.error('Error al cargar los ministerios desde la API');
      }
    } catch (error) {
      console.error('❌ Error cargando ministerios:', error);
      toast.error('Error al cargar los ministerios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLineas = async (ministerioId: string) => {
    console.log(`🔍 Frontend enviando ministerioId: "${ministerioId}"`);
    try {
      const response = await fetch(`https://sigepi-backend.onrender.com/api/v1/catalogos/lineas?ministerioId=${ministerioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Líneas recibidas:', data);
        return data.data || data || [];
      } else {
        console.error('❌ Error obteniendo líneas:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error cargando líneas:', error);
      return [];
    }
  };

  const loadIndicadores = async (lineaId: string) => {
    try {
      const response = await fetch(`https://sigepi-backend.onrender.com/api/v1/catalogos/indicadores?linea_id=${lineaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Indicadores recibidos:', data);
        return data.data || data || [];
      } else {
        console.error('❌ Error obteniendo indicadores:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error cargando indicadores:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMinisterio || !selectedLinea || !selectedIndicador || !periodo || !mes || !valor || !unidad || !fuente || !responsableNombre || !responsableEmail) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar el formato del período según el indicador
    const indicador = indicadores.find(i => i.id === selectedIndicador);
    if (!indicador) {
      toast.error('Indicador no encontrado');
      return;
    }

    if (!validarPeriodo(periodo, indicador.periodicidad)) {
              toast.error('El período debe ser "2024" o "2025-2027"');
      return;
    }

    setIsLoading(true);
    try {
      // Crear la carga
      const cargaData = {
        ministerioId: selectedMinisterio,
        lineaId: selectedLinea,
        indicadorId: selectedIndicador,
        periodo,
        mes,
        valor: parseFloat(valor),
        unidad,
        meta: parseFloat(meta) || undefined,
        fuente,
        responsableNombre,
        responsableEmail,
        observaciones: observaciones || undefined,
      };

      // Llamada a la API para crear la carga
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/cargas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cargaData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Carga enviada para revisión correctamente');
        
        // Limpiar formulario
        setSelectedMinisterio('');
        setSelectedLinea('');
        setSelectedIndicador('');
        setPeriodo('2024');
        setValor('0.00');
        setUnidad('');
        setMeta('0.00');
        setFuente('');
        setResponsableNombre('');
        setResponsableEmail('');
        setObservaciones('');
        
        // Redirigir a mis envíos
        router.push('/mis-envios');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al enviar la carga');
      }
      
    } catch (error) {
      console.error('Error enviando carga:', error);
      toast.error('Error al enviar la carga');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineaChange = (value: string) => {
    setSelectedLinea(value);
    setShowNewCompromiso(false); // Cerrar si se selecciona una línea existente
    setNewCompromiso(''); // Limpiar campos de nuevo compromiso
  };

  const handleCreateNewCompromiso = async () => {
    if (!newCompromiso.trim()) {
      toast.error('Por favor, completa el nombre del nuevo compromiso.');
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
        body: JSON.stringify({
          titulo: newCompromiso,
          ministerioId: selectedMinisterio,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Nuevo compromiso creado con éxito.');
        setLineas(prev => [...prev, result.data]); // Actualizar la lista de líneas
        setSelectedLinea(result.data.id); // Seleccionar el nuevo compromiso
        setShowNewCompromiso(false);
        setNewCompromiso('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al crear el nuevo compromiso.');
      }
    } catch (error) {
      console.error('Error creando nuevo compromiso:', error);
      toast.error('Error al crear el nuevo compromiso.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewIndicador = async () => {
    if (!newIndicador.trim() || !selectedLinea) {
      toast.error('Por favor, completa el nombre del nuevo indicador y asegúrate de tener un compromiso seleccionado.');
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
        body: JSON.stringify({
          nombre: newIndicador,
          lineaId: selectedLinea,
          unidadDefecto: 'unidad',
          periodicidad: 'anual',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Nuevo indicador creado con éxito.');
        setIndicadores(prev => [...prev, result.data]); // Actualizar la lista de indicadores
        setSelectedIndicador(result.data.id); // Seleccionar el nuevo indicador
        setShowNewIndicador(false);
        setNewIndicador('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al crear el nuevo indicador.');
      }
    } catch (error) {
      console.error('Error creando nuevo indicador:', error);
      toast.error('Error al crear el nuevo indicador.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewMeta = async () => {
    if (!newMeta.trim()) {
      toast.error('Por favor, completa el nombre de la nueva meta.');
      return;
    }

    setIsLoading(true);
    try {
      // Crear la nueva meta (por ahora solo localmente)
      const nuevaMeta = {
        id: `meta_${Date.now()}`,
        nombre: newMeta.trim()
      };
      
      setMetas(prev => [...prev, nuevaMeta]);
      setMeta(nuevaMeta.id);
      setNewMeta('');
      setShowNewMeta(false);
      toast.success('Meta creada exitosamente');
    } catch (error) {
      console.error('Error creando nueva meta:', error);
      toast.error('Error al crear la nueva meta.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Carga de Indicadores</h1>
            <p className="text-gray-600 mt-2">
              Completa la información del indicador a cargar
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información del Indicador */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Indicador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ministerio */}
                <div>
                  <label htmlFor="ministerio" className="block text-sm font-medium text-gray-700 mb-1">
                    Ministerio *
                  </label>
                  <Select
                    value={selectedMinisterio}
                    onValueChange={(value) => setSelectedMinisterio(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un ministerio" />
                    </SelectTrigger>
                    <SelectContent>
                      {ministerios.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Compromisos */}
                <div>
                  <label htmlFor="linea" className="block text-sm font-medium text-gray-700 mb-1">
                    Compromisos *
                  </label>
                  <Select
                    value={selectedLinea}
                    onValueChange={handleLineaChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un compromiso" />
                    </SelectTrigger>
                    <SelectContent>
                      {lineas.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Opción para crear nuevo compromiso */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCompromiso(!showNewCompromiso)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {showNewCompromiso ? '−' : '+'} Crear nuevo compromiso
                    </button>
                    
                    {showNewCompromiso && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="newCompromiso" className="block text-sm font-medium text-gray-700 mb-1">
                              Nuevo Compromiso
                            </label>
                            <input
                              type="text"
                              id="newCompromiso"
                              value={newCompromiso}
                              onChange={(e) => setNewCompromiso(e.target.value)}
                              placeholder="Escribe el nuevo compromiso..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCreateNewCompromiso}
                              disabled={!newCompromiso.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              Crear Compromiso
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewCompromiso(false);
                                setNewCompromiso('');
                              }}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                                 {/* Indicador */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Indicador *
                   </label>
                   <Select
                     value={selectedIndicador}
                     onValueChange={(value) => setSelectedIndicador(value)}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Selecciona un indicador" />
                     </SelectTrigger>
                     <SelectContent>
                       {indicadores.map(i => (
                         <SelectItem key={i.id} value={i.id}>
                           {i.nombre}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                   
                   {/* Opción para crear nuevo indicador */}
                   <div className="mt-2">
                     <button
                       type="button"
                       onClick={() => setShowNewIndicador(!showNewIndicador)}
                       className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                     >
                       {showNewIndicador ? '−' : '+'} Crear nuevo indicador
                     </button>
                     
                     {showNewIndicador && (
                       <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                         <div className="space-y-3">
                           <div>
                             <label htmlFor="newIndicador" className="block text-sm font-medium text-gray-700 mb-1">
                               Nuevo Indicador
                             </label>
                             <input
                               type="text"
                               id="newIndicador"
                               value={newIndicador}
                               onChange={(e) => setNewIndicador(e.target.value)}
                               placeholder="Escribe el nuevo indicador..."
                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             />
                           </div>
                           <div className="flex gap-2">
                             <button
                               type="button"
                               onClick={handleCreateNewIndicador}
                               disabled={!newIndicador.trim() || !selectedLinea}
                               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                             >
                               Crear Indicador
                             </button>
                             <button
                               type="button"
                               onClick={() => {
                                 setShowNewIndicador(false);
                                 setNewIndicador('');
                               }}
                               className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                             >
                               Cancelar
                             </button>
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>

                {/* Período */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período *
                  </label>
                  <Select
                    value={periodo}
                    onValueChange={(value) => setPeriodo(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025-2027">2025-2027</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Formato específico según la periodicidad del indicador seleccionado
                  </p>
                </div>

                {/* Mes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mes *
                  </label>
                  <Select
                    value={mes}
                    onValueChange={(value) => setMes(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enero">Enero</SelectItem>
                      <SelectItem value="febrero">Febrero</SelectItem>
                      <SelectItem value="marzo">Marzo</SelectItem>
                      <SelectItem value="abril">Abril</SelectItem>
                      <SelectItem value="mayo">Mayo</SelectItem>
                      <SelectItem value="junio">Junio</SelectItem>
                      <SelectItem value="julio">Julio</SelectItem>
                      <SelectItem value="agosto">Agosto</SelectItem>
                      <SelectItem value="septiembre">Septiembre</SelectItem>
                      <SelectItem value="octubre">Octubre</SelectItem>
                      <SelectItem value="noviembre">Noviembre</SelectItem>
                      <SelectItem value="diciembre">Diciembre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Meta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta *
                  </label>
                  <Select
                    value={meta}
                    onValueChange={(value) => setMeta(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una meta" />
                    </SelectTrigger>
                    <SelectContent>
                      {metas.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Opción para crear nueva meta */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewMeta(!showNewMeta)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {showNewMeta ? '−' : '+'} Crear nueva meta
                    </button>
                    
                    {showNewMeta && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="newMeta" className="block text-sm font-medium text-gray-700 mb-1">
                              Nueva Meta
                            </label>
                            <input
                              type="text"
                              id="newMeta"
                              value={newMeta}
                              onChange={(e) => setNewMeta(e.target.value)}
                              placeholder="Escribe la nueva meta..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCreateNewMeta}
                              disabled={isLoading}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isLoading ? 'Creando...' : 'Crear Meta'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewMeta(false);
                                setNewMeta('');
                              }}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valores y Metadatos */}
            <Card>
              <CardHeader>
                <CardTitle>Valores y Metadatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Alcanzado *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
                </div>

                {/* Unidad de Medida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad de Medida *
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej: Porcentaje, Cantidad, etc."
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                  />
                </div>

                {/* Fuente de los Datos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuente de los Datos *
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej: Encuesta, Censo, etc."
                    value={fuente}
                    onChange={(e) => setFuente(e.target.value)}
                  />
                </div>

                {/* Responsable Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable *
                  </label>
                  <Input
                    type="text"
                    placeholder="Nombre completo del responsable"
                    value={responsableNombre}
                    onChange={(e) => setResponsableNombre(e.target.value)}
                  />
                </div>

                {/* Responsable Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email del Responsable *
                  </label>
                  <Input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={responsableEmail}
                    onChange={(e) => setResponsableEmail(e.target.value)}
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones (Opcional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Observaciones adicionales"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Enviando...' : 'Enviar Carga'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
