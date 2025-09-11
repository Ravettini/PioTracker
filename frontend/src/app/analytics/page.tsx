'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useIsAdmin } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Download,
  RefreshCw,
  Filter,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Users,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface Ministerio {
  id: string;
  nombre: string;
  sigla: string;
}

interface Compromiso {
  id: string;
  titulo: string;
  ministerioId: string;
}

interface Indicador {
  id: string;
  nombre: string;
  lineaId: string;
}

interface AnalyticsData {
  ministerio: string;
  compromiso: string;
  indicador: string;
  tipo: 'porcentaje' | 'cantidad';
  datos: {
    periodos: string[];
    valores: number[];
    metas?: number[];
  };
  configuracion: {
    tipoGrafico: string;
    colores: string[];
    opciones: any;
  };
}

interface ResumenData {
  totalMinisterios: number;
  totalCompromisos: number;
  totalIndicadores: number;
  cargasValidadas: number;
  cargasPendientes: number;
  porcentajeCumplimiento: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300'];

export default function AnalyticsPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [compromisos, setCompromisos] = useState<Compromiso[]>([]);
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [selectedMinisterio, setSelectedMinisterio] = useState<string>('');
  const [selectedCompromiso, setSelectedCompromiso] = useState<string>('');
  const [selectedIndicador, setSelectedIndicador] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [resumenData, setResumenData] = useState<ResumenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<string>('auto');
  const [showChartGuide, setShowChartGuide] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadMinisterios();
    loadResumen();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (selectedMinisterio) {
      loadCompromisos(selectedMinisterio);
      setSelectedCompromiso('');
      setSelectedIndicador('');
    }
  }, [selectedMinisterio]);

  useEffect(() => {
    if (selectedCompromiso) {
      loadIndicadores(selectedCompromiso);
      setSelectedIndicador('');
    }
  }, [selectedCompromiso]);

  useEffect(() => {
    if (selectedIndicador) {
      loadAnalyticsData();
    }
  }, [selectedIndicador]);

  const loadMinisterios = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.analytics.getMinisterios();
      if (response.success) {
        setMinisterios(response.data);
      }
    } catch (error) {
      console.error('Error cargando ministerios:', error);
      toast.error('Error al cargar los ministerios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompromisos = async (ministerioId: string) => {
    try {
      const response = await apiClient.analytics.getCompromisos(ministerioId);
      if (response.success) {
        setCompromisos(response.data);
      }
    } catch (error) {
      console.error('Error cargando compromisos:', error);
      toast.error('Error al cargar los compromisos');
    }
  };

  const loadIndicadores = async (compromisoId: string) => {
    try {
      const response = await apiClient.analytics.getIndicadores(compromisoId);
      if (response.success) {
        setIndicadores(response.data);
      }
    } catch (error) {
      console.error('Error cargando indicadores:', error);
      toast.error('Error al cargar los indicadores');
    }
  };

  const loadAnalyticsData = async () => {
    if (!selectedIndicador) return;

    try {
      setIsLoadingData(true);
      const response = await apiClient.analytics.getDatos({
        indicadorId: selectedIndicador,
      });
      
      // Debug: Log de datos recibidos
      console.log('📊 Datos recibidos del backend:', response);
      console.log('📊 Períodos:', response.datos.periodos);
      console.log('📊 Valores:', response.datos.valores);
      console.log('📊 Metas:', response.datos.metas);
      
      setAnalyticsData(response);
    } catch (error) {
      console.error('Error cargando datos de analytics:', error);
      toast.error('Error al cargar los datos del indicador');
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadResumen = async () => {
    try {
      const response = await apiClient.analytics.getResumen();
      setResumenData(response);
    } catch (error) {
      console.error('Error cargando resumen:', error);
    }
  };

  const formatChartData = (data: AnalyticsData) => {
    return data.datos.periodos.map((periodo, index) => ({
      periodo,
      valor: data.datos.valores[index],
      meta: data.datos.metas?.[index],
    }));
  };

  const renderChart = () => {
    if (!analyticsData) return null;

    const chartData = formatChartData(analyticsData);
    const { tipo, configuracion } = analyticsData;

    // Determinar el tipo de gráfico a mostrar
    const chartType = selectedChartType === 'auto' ? 
      (tipo === 'porcentaje' ? 'line' : 'bar') : 
      selectedChartType;

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis domain={tipo === 'porcentaje' ? [0, 100] : [0, 'dataMax + 10']} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke={configuracion.colores[0]} 
                strokeWidth={2}
                name="Valor"
              />
              {analyticsData.datos.metas && (
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke={configuracion.colores[1]} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Meta"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="valor" 
                fill={configuracion.colores[0]}
                name="Valor"
              />
              {analyticsData.datos.metas && (
                <Bar 
                  dataKey="meta" 
                  fill={configuracion.colores[1]}
                  name="Meta"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="valor" 
                stroke={configuracion.colores[0]}
                fill={configuracion.colores[0]}
                fillOpacity={0.3}
                name="Valor"
              />
              {analyticsData.datos.metas && (
                <Area 
                  type="monotone" 
                  dataKey="meta" 
                  stroke={configuracion.colores[1]}
                  fill={configuracion.colores[1]}
                  fillOpacity={0.3}
                  name="Meta"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.valor}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="valor"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="periodo" />
              <PolarRadiusAxis />
              <Radar
                name="Valor"
                dataKey="valor"
                stroke={configuracion.colores[0]}
                fill={configuracion.colores[0]}
                fillOpacity={0.3}
              />
              {analyticsData.datos.metas && (
                <Radar
                  name="Meta"
                  dataKey="meta"
                  stroke={configuracion.colores[1]}
                  fill={configuracion.colores[1]}
                  fillOpacity={0.3}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="valor" 
                fill={configuracion.colores[0]}
                name="Valor"
              />
              <Line 
                type="monotone" 
                dataKey="meta" 
                stroke={configuracion.colores[1]} 
                strokeWidth={2}
                name="Meta"
              />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="periodo" />
              <YAxis domain={tipo === 'porcentaje' ? [0, 100] : [0, 'dataMax + 10']} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke={configuracion.colores[0]} 
                strokeWidth={2}
                name="Valor"
              />
              {analyticsData.datos.metas && (
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke={configuracion.colores[1]} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Meta"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderChartGuide = () => {
    if (!analyticsData) return null;

    const chartType = selectedChartType === 'auto' ? 
      (analyticsData.tipo === 'porcentaje' ? 'line' : 'bar') : 
      selectedChartType;

    const guideData = {
      line: {
        title: "📈 Gráfico de Línea - Interpretación",
        description: "Este gráfico muestra la evolución temporal de los valores del indicador.",
        tips: [
          "📊 **Eje X (horizontal)**: Representa los períodos de tiempo",
          "📊 **Eje Y (vertical)**: Muestra los valores del indicador",
          "📈 **Línea continua**: Valores reales alcanzados",
          "📈 **Línea punteada**: Meta objetivo (cuando está disponible)",
          "📈 **Tendencia ascendente**: Mejora en el indicador",
          "📉 **Tendencia descendente**: Deterioro en el indicador",
          "➡️ **Tendencia estable**: Mantenimiento del nivel actual"
        ],
        insights: [
          "🔍 **Puntos de inflexión**: Identifica cuándo cambió la tendencia",
          "🎯 **Cumplimiento de metas**: Compara valores reales vs. objetivos",
          "📊 **Variabilidad**: Observa la estabilidad de los resultados"
        ]
      },
      bar: {
        title: "📊 Gráfico de Barras - Interpretación",
        description: "Este gráfico permite comparar valores entre diferentes períodos.",
        tips: [
          "📊 **Eje X (horizontal)**: Representa los períodos de tiempo",
          "📊 **Eje Y (vertical)**: Muestra los valores del indicador",
          "📊 **Altura de las barras**: Indica la magnitud del valor",
          "📊 **Barras más altas**: Valores más altos del indicador",
          "📊 **Barras más bajas**: Valores más bajos del indicador",
          "📊 **Comparación directa**: Fácil visualización de diferencias"
        ],
        insights: [
          "🔍 **Picos y valles**: Identifica períodos de máximo y mínimo rendimiento",
          "📈 **Patrones estacionales**: Observa si hay patrones repetitivos",
          "🎯 **Cumplimiento**: Compara con metas cuando están disponibles"
        ]
      },
      area: {
        title: "🌊 Gráfico de Área - Interpretación",
        description: "Este gráfico muestra el volumen y la acumulación de datos a lo largo del tiempo.",
        tips: [
          "📊 **Eje X (horizontal)**: Representa los períodos de tiempo",
          "📊 **Eje Y (vertical)**: Muestra los valores del indicador",
          "🌊 **Área sombreada**: Representa el volumen de datos",
          "🌊 **Área más grande**: Mayor volumen o acumulación",
          "🌊 **Transparencia**: Permite ver múltiples series superpuestas",
          "🌊 **Acumulación**: Útil para mostrar totales o volúmenes"
        ],
        insights: [
          "🔍 **Volumen total**: Observa la magnitud acumulada",
          "📈 **Crecimiento**: Identifica períodos de expansión",
          "📉 **Contracción**: Detecta períodos de reducción"
        ]
      },
      pie: {
        title: "🥧 Gráfico de Torta - Interpretación",
        description: "Este gráfico muestra la distribución proporcional de los valores por período.",
        tips: [
          "🥧 **Tamaño de las porciones**: Indica la proporción del total",
          "🥧 **Porciones más grandes**: Mayor proporción del total",
          "🥧 **Porciones más pequeñas**: Menor proporción del total",
          "🥧 **Colores diferentes**: Distinguen entre períodos",
          "🥧 **Porcentajes**: Muestran la distribución exacta",
          "🥧 **Total**: Siempre suma 100%"
        ],
        insights: [
          "🔍 **Distribución**: Identifica qué períodos tienen mayor peso",
          "📊 **Concentración**: Observa si los valores están concentrados o distribuidos",
          "🎯 **Dominancia**: Detecta períodos dominantes"
        ]
      },
      radar: {
        title: "🎯 Gráfico de Radar - Interpretación",
        description: "Este gráfico muestra múltiples dimensiones o períodos en un formato circular.",
        tips: [
          "🎯 **Ejes radiales**: Cada eje representa un período",
          "🎯 **Distancia desde el centro**: Indica la magnitud del valor",
          "🎯 **Forma del polígono**: Muestra el patrón de distribución",
          "🎯 **Área del polígono**: Representa el volumen total",
          "🎯 **Simetría**: Indica distribución equilibrada",
          "🎯 **Asimetría**: Muestra concentración en ciertos períodos"
        ],
        insights: [
          "🔍 **Patrones**: Identifica formas características en los datos",
          "📊 **Balance**: Observa si hay períodos dominantes",
          "🎯 **Optimización**: Detecta oportunidades de mejora"
        ]
      },
      composed: {
        title: "🔀 Gráfico Combinado - Interpretación",
        description: "Este gráfico combina barras y líneas para mostrar diferentes aspectos de los datos.",
        tips: [
          "📊 **Barras**: Muestran los valores reales del indicador",
          "📈 **Líneas**: Representan las metas o tendencias",
          "📊 **Altura de barras**: Magnitud de los valores reales",
          "📈 **Posición de líneas**: Comparación con objetivos",
          "📊 **Diferencias**: Fácil visualización de brechas",
          "📈 **Tendencias**: Observa la dirección de las metas"
        ],
        insights: [
          "🔍 **Cumplimiento**: Compara directamente valores vs. metas",
          "📊 **Brechas**: Identifica dónde hay desviaciones",
          "🎯 **Eficiencia**: Mide qué tan cerca estás de los objetivos"
        ]
      }
    };

    const guide = guideData[chartType as keyof typeof guideData] || guideData.line;

    return (
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">{guide.title}</h3>
        <p className="text-blue-800 mb-4">{guide.description}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-2">📋 Cómo leer el gráfico:</h4>
            <ul className="space-y-2">
              {guide.tips.map((tip, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start">
                  <span className="mr-2">•</span>
                  <span dangerouslySetInnerHTML={{ __html: tip }} />
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-900 mb-2">🔍 Insights clave:</h4>
            <ul className="space-y-2">
              {guide.insights.map((insight, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start">
                  <span className="mr-2">•</span>
                  <span dangerouslySetInnerHTML={{ __html: insight }} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

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
                Analytics y Gráficos
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
                Visualiza y analiza los indicadores de cumplimiento
              </p>
            </div>
          </div>
                     <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
             <Button
               variant="outline"
               onClick={() => {
                 loadResumen();
                 if (selectedMinisterio) loadCompromisos(selectedMinisterio);
                 if (selectedCompromiso) loadIndicadores(selectedCompromiso);
                 if (selectedIndicador) loadAnalyticsData();
               }}
               disabled={isLoading}
               className="w-full sm:w-auto"
             >
               <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
               Actualizar
             </Button>
           </div>
        </div>

        {/* Resumen KPIs */}
        {resumenData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 items-center justify-center py-2 md:py-8">
            <Card className="flex justify-center items-center hover:shadow-md transition-shadow">
              <CardContent className="p-6 pt-15 p-6 w-full text-center">
                <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4">
                  <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Ministerios</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{resumenData.totalMinisterios}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex justify-center items-center hover:shadow-md transition-shadow">
              <CardContent className="p-6 pt-15 p-6 w-full text-center">
                <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4">
                  <div className="p-2 md:p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Compromisos</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{resumenData.totalCompromisos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex justify-center items-center hover:shadow-md transition-shadow">
              <CardContent className="p-6 pt-15 p-6 w-full text-center">
                <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4">
                  <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Indicadores</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{resumenData.totalIndicadores}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex justify-center items-center hover:shadow-md transition-shadow">
              <CardContent className="p-6 pt-15 p-6 w-full text-center">
                <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4">
                  <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Cumplimiento</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{resumenData.porcentajeCumplimiento}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos de Resumen */}
        {resumenData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Torta - Estado de Cargas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Estado de Cargas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Validadas', value: resumenData.cargasValidadas, color: '#10B981' },
                        { name: 'Pendientes', value: resumenData.cargasPendientes, color: '#F59E0B' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Validadas', value: resumenData.cargasValidadas, color: '#10B981' },
                        { name: 'Pendientes', value: resumenData.cargasPendientes, color: '#F59E0B' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Barras - Distribución por Ministerio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribución por Ministerio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Ministerios', value: resumenData.totalMinisterios },
                    { name: 'Compromisos', value: resumenData.totalCompromisos },
                    { name: 'Indicadores', value: resumenData.totalIndicadores }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Progreso Circular - Cumplimiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Progreso de Cumplimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="relative">
                    <svg width="200" height="200">
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="12"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 80}`}
                        strokeDashoffset={`${2 * Math.PI * 80 * (1 - resumenData.porcentajeCumplimiento / 100)}`}
                        transform="rotate(-90 100 100)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {resumenData.porcentajeCumplimiento}%
                        </div>
                        <div className="text-sm text-gray-600">Cumplimiento</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Filter className="h-5 w-5" />
              Filtros de Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ministerio
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compromiso
                </label>
                <Select
                  value={selectedCompromiso}
                  onValueChange={(value) => setSelectedCompromiso(value)}
                  disabled={!selectedMinisterio}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un compromiso" />
                  </SelectTrigger>
                  <SelectContent>
                    {compromisos.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indicador
                </label>
                <Select
                  value={selectedIndicador}
                  onValueChange={(value) => setSelectedIndicador(value)}
                  disabled={!selectedCompromiso}
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico */}
        {analyticsData && (
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <CardTitle className="text-lg md:text-xl">
                    {analyticsData.indicador}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {analyticsData.ministerio} - {analyticsData.compromiso}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de Gráfico:</label>
                  <Select
                    value={selectedChartType}
                    onValueChange={(value) => setSelectedChartType(value)}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Selecciona tipo de gráfico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automático</SelectItem>
                      <SelectItem value="line">Línea</SelectItem>
                      <SelectItem value="bar">Barras</SelectItem>
                      <SelectItem value="area">Área</SelectItem>
                      <SelectItem value="pie">Torta</SelectItem>
                      <SelectItem value="radar">Radar</SelectItem>
                      <SelectItem value="composed">Combinado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando datos...</span>
                </div>
              ) : (
                                 <div>
                   {renderChart()}
                   <div className="mt-4 flex flex-col sm:flex-row justify-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                     <Button
                       variant="outline"
                       onClick={() => setShowChartGuide(!showChartGuide)}
                       className="w-full sm:w-auto"
                     >
                       {showChartGuide ? 'Ocultar Explicación' : 'Mostrar Explicación'}
                     </Button>
                     <Button variant="outline" className="w-full sm:w-auto">
                       <Download className="h-4 w-4 mr-2" />
                       Exportar
                     </Button>
                   </div>
                   {showChartGuide && renderChartGuide()}
                 </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mensaje cuando no hay datos */}
        {!analyticsData && selectedIndicador && !isLoadingData && (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay datos disponibles
              </h3>
              <p className="text-gray-600">
                No se encontraron datos para el indicador seleccionado
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
