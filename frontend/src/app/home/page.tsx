'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useUser, useIsAdmin } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BarChart3, 
  FileText, 
  Users, 
  TrendingUp, 
  Plus,
  Eye,
  Settings,
  Upload,
  Download,
  Calendar,
  Target,
  Building,
  Activity,
  CheckCircle
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const menuOptions = [
    {
      title: 'Dashboard',
      description: 'Vista general del sistema y estadísticas',
      icon: <BarChart3 className="h-8 w-8" />,
      href: '/dashboard',
      color: 'bg-blue-500',
      available: true
    },
    {
      title: 'Carga de Indicadores',
      description: 'Registra nuevos datos de indicadores',
      icon: <FileText className="h-8 w-8" />,
      href: '/carga',
      color: 'bg-green-500',
      available: true
    },
    {
      title: 'Mis Envíos',
      description: 'Consulta el estado de tus cargas enviadas',
      icon: <FileText className="h-8 w-8" />,
      href: '/mis-envios',
      color: 'bg-yellow-500',
      available: true
    },
    {
      title: 'Publicadas',
      description: 'Ver cargas ya publicadas y validadas',
      icon: <CheckCircle className="h-8 w-8" />,
      href: '/publicadas',
      color: 'bg-emerald-500',
      available: true
    },
    {
      title: 'Analytics',
      description: 'Visualiza y analiza los indicadores con gráficos',
      icon: <TrendingUp className="h-8 w-8" />,
      href: '/analytics',
      color: 'bg-purple-500',
      available: true
    },
    {
      title: 'Manual',
      description: 'Guía de uso y documentación del sistema',
      icon: <Activity className="h-8 w-8" />,
      href: '/manual',
      color: 'bg-indigo-500',
      available: true
    },
    ...(isAdmin ? [
      {
        title: 'Revisión',
        description: 'Revisa y valida cargas pendientes',
        icon: <FileText className="h-8 w-8" />,
        href: '/revision',
        color: 'bg-red-500',
        available: true
      },
      {
        title: 'Configuración',
        description: 'Configuración del sistema',
        icon: <Settings className="h-8 w-8" />,
        href: '/configuracion',
        color: 'bg-slate-600',
        available: true,
        isSubMenu: true,
        subMenuItems: [
          {
            title: 'Usuarios',
            description: 'Gestiona usuarios del sistema',
            icon: <Users className="h-6 w-6" />,
            href: '/admin/usuarios',
            color: 'bg-pink-500'
          },
          {
            title: 'Gestión',
            description: 'Administra ministerios, líneas e indicadores',
            icon: <Settings className="h-6 w-6" />,
            href: '/gestion',
            color: 'bg-gray-500'
          },
          {
            title: 'Creación',
            description: 'Crea nuevos ministerios, compromisos e indicadores',
            icon: <Plus className="h-6 w-6" />,
            href: '/creacion',
            color: 'bg-orange-500'
          },
          {
            title: 'Sincronización',
            description: 'Sincroniza datos con Google Sheets',
            icon: <Settings className="h-6 w-6" />,
            href: '/admin/sync',
            color: 'bg-teal-500'
          }
        ]
      }
    ] : [])
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido a SIPIO
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de Indicadores de Plan de Inversión y Obras
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              Hola, <span className="font-medium">{user.nombre}</span>
              {isAdmin && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Administrador</span>}
            </p>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {menuOptions.map((option, index) => (
            <div key={index} className="w-full">
              <Card 
                className={`hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 w-full h-full ${
                  !option.available ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => option.available && !option.isSubMenu && router.push(option.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg text-white ${option.color} flex-shrink-0`}>
                      {option.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{option.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4">
                    {option.description}
                  </p>
                  {option.available && !option.isSubMenu && (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(option.href);
                      }}
                    >
                      Acceder
                    </Button>
                  )}
                  {option.isSubMenu && (
                    <div className="space-y-3">
                      {option.subMenuItems.map((subItem, subIndex) => (
                        <Button 
                          key={subIndex}
                          className="w-full justify-start h-auto py-3 px-4" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(subItem.href);
                          }}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className={`p-2 rounded text-white ${subItem.color} flex-shrink-0`}>
                              {subItem.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{subItem.title}</div>
                              <div className="text-xs text-gray-500">{subItem.description}</div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <p className="text-lg font-bold text-gray-900">Activo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Período</p>
                  <p className="text-lg font-bold text-gray-900">2025</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Indicadores</p>
                  <p className="text-lg font-bold text-gray-900">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Building className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Ministerios</p>
                  <p className="text-lg font-bold text-gray-900">Conectados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>¿Necesitas ayuda?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Flujo de trabajo básico</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Dashboard:</strong> Vista general del sistema</li>
                  <li>• <strong>Carga de Indicadores:</strong> Registra nuevos datos</li>
                  <li>• <strong>Mis Envíos:</strong> Consulta el estado de tus cargas</li>
                  <li>• <strong>Publicadas:</strong> Ver cargas ya validadas</li>
                  <li>• <strong>Analytics:</strong> Gráficos y análisis de datos</li>
                  <li>• <strong>Manual:</strong> Documentación y guías</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Funciones administrativas</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Revisión:</strong> Valida cargas pendientes</li>
                  <li>• <strong>Usuarios:</strong> Gestiona acceso al sistema</li>
                  <li>• <strong>Gestión:</strong> Administra catálogos</li>
                  <li>• <strong>Creación:</strong> Crea nuevos elementos</li>
                  <li>• <strong>Sincronización:</strong> Conecta con Google Sheets</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
