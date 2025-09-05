import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/store/auth-store';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const user = useUser();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Botón de menú para mobile */}
      <div className="flex items-center lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Título de la página */}
      <div className="flex-1 flex items-center justify-center lg:justify-start">
        <h1 className="text-xl font-semibold text-gray-900">
                      SIPIO
        </h1>
      </div>

      {/* Acciones del header */}
      <div className="flex items-center space-x-4">
        {/* Notificaciones */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notificaciones"
          className="relative"
        >
          <Bell className="w-5 h-5" />
          {/* Indicador de notificaciones */}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </Button>

        {/* Perfil del usuario */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.nombre || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.rol === 'ADMIN' ? 'Administrador' : 'Usuario'}
            </p>
          </div>
          <div className="w-8 h-8 bg-gcba-blue rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;








