'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BarChart3, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

  console.log('GO INNOVACION CULTURAL');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      console.log('🔐 Intentando login con:', data.email);
      const response = await apiClient.auth.login(data.email, data.password);
      console.log('📊 Respuesta del login:', response);
      
      if (response.success) {
        console.log('✅ Login exitoso, guardando datos...');
        login(response.data.user, response.data.accessToken);
        toast.success('Inicio de sesión exitoso');
        console.log('🚀 Redirigiendo a dashboard...');
        router.push('/dashboard');
      } else {
        console.log('❌ Login falló:', response.message);
        toast.error(response.message || 'Error en el inicio de sesión');
      }
    } catch (error: any) {
      console.error('💥 Error de login:', error);
      const errorMessage = error.response?.data?.message || 'Error en el inicio de sesión';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gcba-blue rounded-full flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            SIPIO
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Seguimiento de Indicadores
          </p>
        </div>

        {/* Formulario de login */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                {...register('email')}
                label="Email"
                type="email"
                placeholder="usuario@ejemplo.com"
                required
                error={errors.email?.message}
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  {...register('password')}
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  error={errors.password?.message}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            {/* Información adicional */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Sistema de Seguimiento de Indicadores PIO
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 Gobierno de la Ciudad de Buenos Aires/GO INNOVACION CULTURAL
          </p>
        </div>
      </div>
    </div>
  );
}








