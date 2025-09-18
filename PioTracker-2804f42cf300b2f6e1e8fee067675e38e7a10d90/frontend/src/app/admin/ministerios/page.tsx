'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useIsAdmin } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  TrendingUp,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Ministerio {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  lineas?: Linea[];
}

interface Linea {
  id: string;
  nombre: string;
  descripcion?: string;
  indicadores?: Indicador[];
}

interface Indicador {
  id: string;
  nombre: string;
  periodicidad: string;
  activo: boolean;
}

export default function MinisteriosPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [filteredMinisterios, setFilteredMinisterios] = useState<Ministerio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMinisterio, setSelectedMinisterio] = useState<Ministerio | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    loadMinisterios();
  }, [isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMinisterios(ministerios);
    } else {
      const filtered = ministerios.filter(ministerio =>
        ministerio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ministerio.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMinisterios(filtered);
    }
  }, [searchTerm, ministerios]);

  const loadMinisterios = async () => {
    try {
      setIsLoading(true);
      
      // Llamada a la API para obtener ministerios
      console.log('🔍 Consultando API de ministerios...');
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/catalogos/ministerios');
      
      console.log('📡 Status de respuesta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos de la API:', data);
        setMinisterios(data.data || []);
        setFilteredMinisterios(data.data || []);
      } else {
        // Si no hay datos, mostrar ministerios de ejemplo
        const ministeriosEjemplo: Ministerio[] = [
          {
            id: 'MJ',
            nombre: 'Ministerio de Justicia',
            descripcion: 'Ministerio responsable de la administración de justicia',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L1',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal del Ministerio de Justicia',
                indicadores: [
                  { id: 'I1', nombre: 'Compromiso 1: Sumar 50 mujeres...', periodicidad: 'mensual', activo: true },
                  { id: 'I2', nombre: 'Compromiso 2: Mejorar acceso...', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'JG',
            nombre: 'Jefatura de Gabinete',
            descripcion: 'Jefatura de Gabinete de Ministros',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L2',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal de Jefatura de Gabinete',
                indicadores: [
                  { id: 'I3', nombre: 'Compromiso 1: Coordinación interministerial', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'EDU',
            nombre: 'Educación',
            descripcion: 'Ministerio de Educación',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L3',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal de Educación',
                indicadores: [
                  { id: 'I4', nombre: 'Compromiso 1: Mejorar calidad educativa', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'ERSP',
            nombre: 'Ente Regulador de Servicios Públicos',
            descripcion: 'Ente regulador de servicios públicos',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L4',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal del ERSP',
                indicadores: [
                  { id: 'I5', nombre: 'Compromiso 1: Regular servicios', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'SEG',
            nombre: 'Seguridad',
            descripcion: 'Ministerio de Seguridad',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L5',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal de Seguridad',
                indicadores: [
                  { id: 'I6', nombre: 'Compromiso 1: Mejorar seguridad ciudadana', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'VJ',
            nombre: 'Vicejefatura',
            descripcion: 'Vicejefatura de Gabinete',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L6',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal de Vicejefatura',
                indicadores: [
                  { id: 'I7', nombre: 'Compromiso 1: Apoyo a jefatura', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'EP',
            nombre: 'Espacio Público',
            descripcion: 'Ministerio de Espacio Público',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L7',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal de Espacio Público',
                indicadores: [
                  { id: 'I8', nombre: 'Compromiso 1: Mejorar espacios públicos', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'HF',
            nombre: 'Hacienda y Finanzas',
            descripcion: 'Ministerio de Hacienda y Finanzas',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L8',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal de Hacienda y Finanzas',
                indicadores: [
                  { id: 'I9', nombre: 'Compromiso 1: Gestión financiera eficiente', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'SAL',
            nombre: 'Salud',
            descripcion: 'Ministerio de Salud',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L9',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal de Salud',
                indicadores: [
                  { id: 'I10', nombre: 'Compromiso 1: Mejorar atención sanitaria', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'MDHYH',
            nombre: 'MDHyH',
            descripcion: 'Ministerio de Desarrollo Humano y Hábitat',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L10',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal de MDHyH',
                indicadores: [
                  { id: 'I11', nombre: 'Compromiso 1: Desarrollo social', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          },
          {
            id: 'COMP',
            nombre: 'Compromisos',
            descripcion: 'Área de Compromisos Generales',
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lineas: [
              {
                id: 'L11',
                nombre: 'Línea Principal',
                descripcion: 'Línea principal de Compromisos',
                indicadores: [
                  { id: 'I12', nombre: 'Compromiso 1: Seguimiento general', periodicidad: 'mensual', activo: true }
                ]
              }
            ]
          }
        ];
        
        setMinisterios(ministeriosEjemplo);
        setFilteredMinisterios(ministeriosEjemplo);
      }
    } catch (error) {
      console.error('Error cargando ministerios:', error);
      toast.error('Error al cargar los ministerios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const getTotalIndicadores = (ministerio: Ministerio): number => {
    return ministerio.lineas?.reduce((total, linea) => 
      total + (linea.indicadores?.length || 0), 0) || 0;
  };

  const getTotalLineas = (ministerio: Ministerio): number => {
    return ministerio.lineas?.length || 0;
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-gcba-blue" />
              Ministerios y Áreas
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona los ministerios, áreas y sus indicadores del sistema PIO
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Ministerio
          </Button>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar ministerios..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Badge variant="secondary">
                {filteredMinisterios.length} ministerios
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lista de ministerios */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gcba-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando ministerios...</p>
          </div>
        ) : filteredMinisterios.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron ministerios</h3>
              <p className="text-gray-600">No hay ministerios que coincidan con tu búsqueda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
            {filteredMinisterios.map((ministerio) => (
              <Card key={ministerio.id} className="hover:shadow-lg transition-shadow w-full max-w-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                        {ministerio.nombre}
                      </CardTitle>
                      {ministerio.descripcion && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {ministerio.descripcion}
                        </p>
                      )}
                    </div>
                    <Badge variant={ministerio.activo ? "default" : "secondary"}>
                      {ministerio.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-600">Compromisos</span>
                      </div>
                      <p className="text-lg font-semibold text-blue-900">
                        {getTotalLineas(ministerio)}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Indicadores</span>
                      </div>
                      <p className="text-lg font-semibold text-green-900">
                        {getTotalIndicadores(ministerio)}
                      </p>
                    </div>
                  </div>

                  {/* Líneas */}
                  {ministerio.lineas && ministerio.lineas.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Compromisos:</h4>
                      {ministerio.lineas.slice(0, 2).map((linea) => (
                        <div key={linea.id} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {linea.nombre}
                        </div>
                      ))}
                                              {ministerio.lineas.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{ministerio.lineas.length - 2} compromisos más
                          </p>
                        )}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
