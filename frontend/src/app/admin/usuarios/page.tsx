'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useIsAdmin } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Usuario, Ministerio, CreateUsuarioRequest, UpdateUsuarioRequest } from '@/types';
import { apiClient } from '@/lib/api';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  UserPlus,
  Shield,
  Mail,
  Calendar,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminUsuariosPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterMinisterio, setFilterMinisterio] = useState('');

  const [createForm, setCreateForm] = useState<CreateUsuarioRequest>({
    email: '',
    nombre: '',
    rol: 'USUARIO',
    ministerioId: '',
  });

  const [editForm, setEditForm] = useState<UpdateUsuarioRequest>({
    id: '',
    email: '',
    nombre: '',
    rol: 'USUARIO',
    ministerioId: '',
    activo: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [isAuthenticated, isAdmin, router]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usuariosRes, ministeriosRes] = await Promise.all([
        apiClient.admin.getUsuarios(),
        apiClient.admin.getMinisterios(),
      ]);
      
      setUsuarios(usuariosRes.data || []);
      setMinisterios(ministeriosRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUsuario = async () => {
    if (!createForm.email || !createForm.nombre) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      const response = await apiClient.admin.createUsuario(createForm);
      
      if (response.success) {
        toast.success('Usuario creado exitosamente');
        setShowCreateModal(false);
        setCreateForm({
          email: '',
          nombre: '',
          rol: 'USUARIO',
          ministerioId: '',
        });
        loadData(); // Recargar lista
      } else {
        toast.error(response.message || 'Error al crear el usuario');
      }
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear el usuario';
      toast.error(errorMessage);
    }
  };

  const handleUpdateUsuario = async () => {
    if (!editForm.id || !editForm.email || !editForm.nombre) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      const response = await apiClient.admin.updateUsuario(editForm.id, editForm);
      
      if (response.success) {
        toast.success('Usuario actualizado exitosamente');
        setShowEditModal(false);
        setSelectedUsuario(null);
        setEditForm({
          id: '',
          email: '',
          nombre: '',
          rol: 'USUARIO',
          ministerioId: '',
          activo: true,
        });
        loadData(); // Recargar lista
      } else {
        toast.error(response.message || 'Error al actualizar el usuario');
      }
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar el usuario';
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (usuarioId: string) => {
    try {
      const response = await apiClient.admin.toggleUsuarioStatus(usuarioId);
      
      if (response.success) {
        toast.success('Estado del usuario actualizado');
        loadData(); // Recargar lista
      } else {
        toast.error(response.message || 'Error al actualizar el estado');
      }
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar el estado';
      toast.error(errorMessage);
    }
  };

  const handleResetPassword = async (usuarioId: string) => {
    if (!confirm('¿Estás seguro de que quieres resetear la contraseña de este usuario?')) {
      return;
    }

    try {
      const response = await apiClient.admin.resetPassword(usuarioId);
      
      if (response.success) {
        toast.success('Contraseña reseteada exitosamente');
        loadData(); // Recargar lista
      } else {
        toast.error(response.message || 'Error al resetear la contraseña');
      }
    } catch (error: any) {
      console.error('Error reseteando contraseña:', error);
      const errorMessage = error.response?.data?.message || 'Error al resetear la contraseña';
      toast.error(errorMessage);
    }
  };

  const openEditModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setEditForm({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      ministerioId: usuario.ministerioId || '',
      activo: usuario.activo,
    });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm({
      email: '',
      nombre: '',
      rol: 'USUARIO',
      ministerioId: '',
    });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUsuario(null);
    setEditForm({
      id: '',
      email: '',
      nombre: '',
      rol: 'USUARIO',
      ministerioId: '',
      activo: true,
    });
  };

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRol = !filterRol || usuario.rol === filterRol;
    const matchesMinisterio = !filterMinisterio || usuario.ministerioId === filterMinisterio;
    
    return matchesSearch && matchesRol && matchesMinisterio;
  });

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const rolOptions: SelectOption[] = [
    { value: '', label: 'Todos los roles' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'USUARIO', label: 'Usuario' },
  ];

  const ministerioOptions: SelectOption[] = [
    { value: '', label: 'Todos los ministerios' },
    ...ministerios.map(m => ({
      value: m.id,
      label: `${m.sigla} - ${m.nombre}`,
    })),
  ];

  const createRolOptions: SelectOption[] = [
    { value: 'USUARIO', label: 'Usuario' },
    { value: 'ADMIN', label: 'Administrador' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Administración de Usuarios
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona los usuarios del sistema
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Buscar"
                placeholder="Nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <Select
                label="Rol"
                options={rolOptions}
                value={filterRol}
                onChange={(e) => setFilterRol(e.target.value)}
              />
              
              <Select
                label="Ministerio"
                options={ministerioOptions}
                value={filterMinisterio}
                onChange={(e) => setFilterMinisterio(e.target.value)}
              />
              
              <div className="flex items-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRol('');
                    setFilterMinisterio('');
                  }}
                  size="sm"
                >
                  Limpiar
                </Button>
                <Button
                  onClick={loadData}
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>
              Usuarios ({filteredUsuarios.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gcba-blue"></div>
                <span className="ml-2 text-gray-600">Cargando...</span>
              </div>
            ) : filteredUsuarios.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay usuarios
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza creando el primer usuario del sistema
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Usuario
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Rol
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Ministerio
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Estado
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Último Login
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsuarios.map((usuario) => (
                      <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {usuario.nombre}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {usuario.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={usuario.rol === 'ADMIN' ? 'default' : 'secondary'}>
                            {usuario.rol === 'ADMIN' ? (
                              <Shield className="h-3 w-3 mr-1" />
                            ) : (
                              <UserCheck className="h-3 w-3 mr-1" />
                            )}
                            {usuario.rol}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          {usuario.ministerioId ? (
                            <Badge variant="outline">
                              {ministerios.find(m => m.id === usuario.ministerioId)?.sigla || usuario.ministerioId}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">No asignado</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {usuario.activo ? (
                              <Badge variant="success">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <UserX className="h-3 w-3 mr-1" />
                                Inactivo
                              </Badge>
                            )}
                            {usuario.claveTemporal && (
                              <Badge variant="warning">Clave Temporal</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600">
                            {usuario.ultimoLogin ? (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(usuario.ultimoLogin), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </div>
                            ) : (
                              <span className="text-gray-400">Nunca</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(usuario)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            
                            <Button
                              size="sm"
                              variant={usuario.activo ? 'destructive' : 'success'}
                              onClick={() => handleToggleStatus(usuario.id)}
                            >
                              {usuario.activo ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Activar
                                </>
                              )}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetPassword(usuario.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reset Clave
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Crear Nuevo Usuario
              </h2>

              <div className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />

                <Input
                  label="Nombre"
                  placeholder="Nombre completo"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                />

                <Select
                  label="Rol"
                  options={createRolOptions}
                  value={createForm.rol}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, rol: e.target.value as any }))}
                  required
                />

                <Select
                  label="Ministerio (Opcional)"
                  options={ministerioOptions.filter(m => m.value !== '')}
                  value={createForm.ministerioId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, ministerioId: e.target.value }))}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeCreateModal}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateUsuario}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Editar Usuario
              </h2>

              <div className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />

                <Input
                  label="Nombre"
                  placeholder="Nombre completo"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                />

                <Select
                  label="Rol"
                  options={createRolOptions}
                  value={editForm.rol}
                  onChange={(e) => setEditForm(prev => ({ ...prev, rol: e.target.value as any }))}
                  required
                />

                <Select
                  label="Ministerio (Opcional)"
                  options={ministerioOptions.filter(m => m.value !== '')}
                  value={editForm.ministerioId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, ministerioId: e.target.value }))}
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={editForm.activo}
                    onChange={(e) => setEditForm(prev => ({ ...prev, activo: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                    Usuario activo
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeEditModal}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateUsuario}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Actualizar
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








