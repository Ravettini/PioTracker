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
  Activity
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
      title: 'Carga de Indicadores',
      description: 'Registra nuevos datos de indicadores',
      icon: <Plus className="h-8 w-8" />,
      href: '/carga',
      color: 'bg-blue-500',
      available: true
    },
    {
      title: 'Mis Envíos',
      description: 'Consulta el estado de tus cargas enviadas',
      icon: <FileText className="h-8 w-8" />,
      href: '/mis-envios',
      color: 'bg-green-500',
      available: true
    },
    {
      title: 'Analytics y Gráficos',
      description: 'Visualiza y analiza los indicadores',
      icon: <BarChart3 className="h-8 w-8" />,
      href: '/analytics',
      color: 'bg-purple-500',
      available: true
    },
    {
      title: 'Dashboard',
      description: 'Vista general del sistema',
      icon: <TrendingUp className="h-8 w-8" />,
      href: '/dashboard',
      color: 'bg-orange-500',
      available: true
    },
    ...(isAdmin ? [
      {
        title: 'Revisión de Cargas',
        description: 'Revisa y valida cargas pendientes',
        icon: <Eye className="h-8 w-8" />,
        href: '/revision',
        color: 'bg-red-500',
        available: true
      },
      {
        title: 'Administración',
        description: 'Gestiona usuarios, ministerios y configuración',
        icon: <Settings className="h-8 w-8" />,
        href: '/admin',
        color: 'bg-gray-500',
        available: true
      },
      {
        title: 'Sincronización',
        description: 'Sincroniza datos con Google Sheets',
        icon: <Upload className="h-8 w-8" />,
        href: '/admin/sync',
        color: 'bg-indigo-500',
        available: true
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuOptions.map((option, index) => (
            <Card 
              key={index} 
              className={`hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                !option.available ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => option.available && router.push(option.href)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg text-white ${option.color}`}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm">
                  {option.description}
                </p>
                {option.available && (
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(option.href);
                    }}
                  >
                    Acceder
                  </Button>
                )}
              </CardContent>
            </Card>
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
                <h4 className="font-medium text-gray-900 mb-2">Primeros pasos</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Selecciona "Carga de Indicadores" para registrar datos</li>
                  <li>• Usa "Analytics" para ver gráficos y tendencias</li>
                  <li>• Consulta "Mis Envíos" para ver el estado de tus cargas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Para administradores</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Revisa cargas pendientes en "Revisión"</li>
                  <li>• Gestiona usuarios en "Administración"</li>
                  <li>• Sincroniza datos en "Sincronización"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
