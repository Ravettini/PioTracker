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
  CheckCircle,
  BookOpen,
  Cog
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
      title: 'Gestión Operativa',
      description: 'Tareas diarias de carga y revisión',
      icon: <FileText className="h-8 w-8" />,
      href: '/gestion-operativa',
      color: 'bg-green-600',
      available: true,
      isSubMenu: true,
      subMenuItems: [
        {
          title: 'Carga de Indicadores',
          description: 'Registra nuevos datos de indicadores',
          icon: <Upload className="h-6 w-6" />,
          href: '/carga',
          color: 'bg-green-500'
        },
        {
          title: 'Mis Envíos',
          description: 'Consulta el estado de tus cargas',
          icon: <Eye className="h-6 w-6" />,
          href: '/mis-envios',
          color: 'bg-yellow-500'
        },
        {
          title: 'Publicadas',
          description: 'Ver cargas ya validadas',
          icon: <CheckCircle className="h-6 w-6" />,
          href: '/publicadas',
          color: 'bg-emerald-500'
        },
        ...(isAdmin ? [{
          title: 'Revisión',
          description: 'Valida cargas pendientes',
          icon: <CheckCircle className="h-6 w-6" />,
          href: '/revision',
          color: 'bg-red-500'
        }] : [])
      ]
    },
    {
      title: 'Análisis y Reportes',
      description: 'Visualización de datos y gráficos',
      icon: <BarChart3 className="h-8 w-8" />,
      href: '/analisis',
      color: 'bg-blue-600',
      available: true,
      isSubMenu: true,
      subMenuItems: [
        {
          title: 'Dashboard',
          description: 'Vista general del sistema',
          icon: <BarChart3 className="h-6 w-6" />,
          href: '/dashboard',
          color: 'bg-blue-500'
        },
        {
          title: 'Analytics',
          description: 'Gráficos y análisis detallados',
          icon: <TrendingUp className="h-6 w-6" />,
          href: '/analytics',
          color: 'bg-purple-500'
        }
      ]
    },
    ...(isAdmin ? [
      {
        title: 'Configuración del Sistema',
        description: 'Administración y ayuda',
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
            description: 'Administra ministerios e indicadores',
            icon: <Cog className="h-6 w-6" />,
            href: '/gestion',
            color: 'bg-gray-500'
          },
          {
            title: 'Sincronización',
            description: 'Conecta con Google Sheets',
            icon: <Download className="h-6 w-6" />,
            href: '/admin/sync',
            color: 'bg-teal-500'
          },
          {
            title: 'Manual',
            description: 'Guía de uso del sistema',
            icon: <BookOpen className="h-6 w-6" />,
            href: '/manual',
            color: 'bg-indigo-500'
          }
        ]
      }
    ] : [
      {
        title: 'Ayuda',
        description: 'Manual y documentación',
        icon: <BookOpen className="h-8 w-8" />,
        href: '/ayuda',
        color: 'bg-indigo-600',
        available: true,
        isSubMenu: true,
        subMenuItems: [
          {
            title: 'Manual',
            description: 'Guía de uso del sistema',
            icon: <BookOpen className="h-6 w-6" />,
            href: '/manual',
            color: 'bg-indigo-500'
          }
        ]
      }
    ])
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span>Gestión Operativa</span>
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Carga:</strong> Registra datos de indicadores</li>
                  <li>• <strong>Mis Envíos:</strong> Revisa tus cargas</li>
                  <li>• <strong>Publicadas:</strong> Ver cargas validadas</li>
                  {isAdmin && <li>• <strong>Revisión:</strong> Valida cargas pendientes</li>}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span>Análisis y Reportes</span>
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Dashboard:</strong> Vista general del sistema</li>
                  <li>• <strong>Analytics:</strong> Gráficos y análisis detallados</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-slate-600" />
                  <span>Configuración</span>
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {isAdmin && (
                    <>
                      <li>• <strong>Usuarios:</strong> Gestiona acceso</li>
                      <li>• <strong>Gestión:</strong> Administra catálogos</li>
                      <li>• <strong>Sincronización:</strong> Google Sheets</li>
                    </>
                  )}
                  <li>• <strong>Manual:</strong> Guía de uso completa</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
