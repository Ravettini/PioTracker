'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useUser } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { apiClient } from '@/lib/api';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Mail, 
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PerfilPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres';
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Confirma la nueva contraseña';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.auth.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (response.success) {
        toast.success('Contraseña cambiada exitosamente');
        // Cerrar modal y limpiar formulario
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setErrors({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }, 100);
      } else {
        toast.error(response.message || 'Error al cambiar la contraseña');
      }
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      const errorMessage = error.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-6 max-w-4xl mx-auto">
        {/* Header */}
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
              Mi Perfil
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
              Gestiona tu información personal y contraseña
            </p>
          </div>
        </div>

        {/* Información del usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900">
                    {user.nombre}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <div className="flex items-center">
                    <Badge variant={user.rol === 'ADMIN' ? 'default' : 'outline'} className="text-sm">
                      <Shield className="h-4 w-4 mr-2" />
                      {user.rol === 'ADMIN' ? 'Administrador' : 'Usuario'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ministerio
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900">
                    {user.ministerioId ? user.ministerioId : 'No asignado'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de la cuenta
                  </label>
                  <div className="flex items-center space-x-2">
                    <Badge variant="success" className="text-sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activo
                    </Badge>
                    {user.claveTemporal && (
                      <Badge variant="warning" className="text-sm">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Contraseña Temporal
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cambiar contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {user.claveTemporal 
                  ? 'Tienes una contraseña temporal. Te recomendamos cambiarla por una contraseña segura.'
                  : 'Cambia tu contraseña actual por una nueva contraseña segura.'
                }
              </p>
              
              <Button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full md:w-auto"
              >
                <Lock className="h-4 w-4 mr-2" />
                {user.claveTemporal ? 'Cambiar Contraseña Temporal' : 'Cambiar Contraseña'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Cambiar Contraseña
              </h2>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Contraseña actual"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    error={errors.currentPassword}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Nueva contraseña"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    error={errors.newPassword}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirmar nueva contraseña"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    error={errors.confirmPassword}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Recomendaciones:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Mínimo 8 caracteres</li>
                    <li>• Incluye mayúsculas y minúsculas</li>
                    <li>• Agrega números y símbolos</li>
                    <li>• No uses información personal</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={closePasswordModal}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Cambiar Contraseña
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
