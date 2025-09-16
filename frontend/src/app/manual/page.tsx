'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Send, 
  Eye, 
  Settings2, 
  Plus,
  HelpCircle,
  Search,
  Download
} from 'lucide-react';

export default function ManualPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const sections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: BarChart3,
      description: 'Vista principal con estadísticas generales',
      content: [
        'Muestra estadísticas generales del sistema',
        'Total de cargas, pendientes, validadas y publicadas',
        'Datos actualizados desde Google Sheets',
        'Acceso rápido a todas las funcionalidades'
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: TrendingUp,
      description: 'Gráficos y análisis de indicadores',
      content: [
        'Selecciona Ministerio → Compromiso → Indicador',
        'Elige tipo de gráfico (línea, barras, torta, etc.)',
        'Cambia entre Vista Total y Avance por Mes',
        'Exporta gráficos como imagen PNG',
        'Lee la explicación de cada tipo de gráfico'
      ]
    },
    {
      id: 'carga',
      title: 'Carga',
      icon: FileText,
      description: 'Cargar nuevos datos de indicadores',
      content: [
        'Selecciona el ministerio correspondiente',
        'Elige la línea de compromiso',
        'Selecciona el indicador específico',
        'Completa valor, meta, fuente y responsable',
        'Adjunta archivos de respaldo si es necesario',
        'Envía para validación'
      ]
    },
    {
      id: 'mis-envios',
      title: 'Mis Envíos',
      icon: Send,
      description: 'Historial de cargas enviadas',
      content: [
        'Ve todas tus cargas enviadas',
        'Filtra por estado (pendiente, validado, observado)',
        'Revisa observaciones de los administradores',
        'Edita cargas observadas si es necesario'
      ]
    },
    {
      id: 'revision',
      title: 'Revisión',
      icon: Eye,
      description: 'Validar cargas pendientes (Solo Administradores)',
      content: [
        'Revisa cargas pendientes de validación',
        'Valida, observa o rechaza cada carga',
        'Agrega observaciones específicas',
        'Publica cargas validadas'
      ]
    },
    {
      id: 'gestion',
      title: 'Gestión',
      icon: Settings2,
      description: 'Administrar elementos del sistema (Solo Administradores)',
      content: [
        'Gestiona ministerios, compromisos e indicadores',
        'Usa los tabs para navegar entre categorías',
        'Elimina elementos con confirmación',
        'Paginación de 15 elementos por página',
        'Filtros de búsqueda disponibles'
      ]
    },
    {
      id: 'creacion',
      title: 'Creación',
      icon: Plus,
      description: 'Crear nuevos elementos (Solo Administradores)',
      content: [
        'Crea nuevos ministerios con nombre y sigla',
        'Crea líneas de compromiso por ministerio',
        'Crea indicadores con unidad y periodicidad',
        'Formularios con validación automática'
      ]
    }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-blue-600" />
                Manual de Usuario
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Guía rápida para usar todas las funcionalidades
              </p>
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en el manual..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-0 outline-none text-gray-900 placeholder-gray-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Secciones del Manual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card key={section.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{section.title}</div>
                      <div className="text-sm text-gray-600 font-normal">
                        {section.description}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.content.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Información Adicional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Información Adicional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Roles de Usuario</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• <strong>Usuario:</strong> Cargar datos, ver historial</li>
                  <li>• <strong>Administrador:</strong> Todas las funciones + validación</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Estados de Carga</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• <strong>Pendiente:</strong> Esperando validación</li>
                  <li>• <strong>Validado:</strong> Aprobado por admin</li>
                  <li>• <strong>Observado:</strong> Requiere corrección</li>
                  <li>• <strong>Rechazado:</strong> No cumple requisitos</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Soporte</h4>
              <p className="text-sm text-gray-700">
                Si necesitas ayuda adicional, contacta al administrador del sistema o revisa la documentación técnica disponible.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
