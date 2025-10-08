import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIsAdmin, useUser } from '@/store/auth-store';
import {
  BarChart3,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  User,
  Database,
  Settings2,
  Plus,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '@/store/auth-store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const pathname = usePathname();
  const user = useUser();
  const isAdmin = useIsAdmin();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      logout(); // Forzar logout local
    }
  };

  const navigationItems = [
    {
      name: 'Inicio',
      href: '/home',
      icon: Menu,
      current: pathname === '/home',
    },
    {
      name: 'Panel',
      href: '/dashboard',
      icon: BarChart3,
      current: pathname === '/dashboard',
    },
    {
      name: 'Carga de Indicadores',
      href: '/carga',
      icon: FileText,
      current: pathname === '/carga',
    },
    {
      name: 'Mis Envíos',
      href: '/mis-envios',
      icon: FileText,
      current: pathname === '/mis-envios',
    },
    {
      name: 'Publicadas',
      href: '/publicadas',
      icon: CheckCircle,
      current: pathname === '/publicadas',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: TrendingUp,
      current: pathname === '/analytics',
    },
    {
      name: 'Manual',
      href: '/manual',
      icon: HelpCircle,
      current: pathname === '/manual',
    },
    ...(isAdmin
      ? [
          {
            name: 'Revisión',
            href: '/revision',
            icon: FileText,
            current: pathname === '/revision',
          },
          {
            name: 'Usuarios',
            href: '/admin/usuarios',
            icon: Users,
            current: pathname === '/admin/usuarios',
          },
          {
            name: 'Gestión',
            href: '/gestion',
            icon: Settings2,
            current: pathname === '/gestion',
          },
          {
            name: 'Creación',
            href: '/creacion',
            icon: Plus,
            current: pathname === '/creacion',
          },
          {
            name: 'Sincronización',
            href: '/admin/sync',
            icon: Settings,
            current: pathname === '/admin/sync',
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Overlay para mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header del sidebar */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gcba-blue rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">SIPIO</h1>
              <p className="text-sm text-gray-500">Sistema de Seguimiento</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Información del usuario */}
        {user && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gcba-blue rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.nombre}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.rol === 'ADMIN' ? 'Administrador' : 'Usuario'}
                </p>
                {user.ministerioId && (
                  <p className="text-xs text-gray-500 truncate">
                    Ministerio: {user.ministerioId}
                  </p>
                )}
              </div>
            </div>
            
            {/* Enlace al perfil */}
            <div className="mt-4">
              <Link
                href="/perfil"
                onClick={() => onClose()}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Mi Perfil</span>
              </Link>
            </div>
            
            {/* Botón Cerrar Sesión */}
            <div className="mt-3">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onClose()}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    item.current
                      ? 'bg-gcba-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </>
  );
};

export default Sidebar;





