'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useIsAdmin } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectOption } from '@/components/ui/Select';
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
  UserX,
  Copy,
  CheckCircle
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [tempUserEmail, setTempUserEmail] = useState('');
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
      router.push('/home');
      return;
    }

    loadData();
  }, [isAuthenticated, isAdmin, router]);

  const loadData = async () => {
    console.log('🔍 DEBUG: Iniciando carga de datos');
    try {
      setIsLoading(true);
      console.log('🔍 DEBUG: Llamando a API para obtener usuarios y ministerios');
      const [usuariosRes, ministeriosRes] = await Promise.all([
        apiClient.admin.getUsuarios(),
        apiClient.admin.getMinisterios(),
      ]);
      
      console.log('🔍 DEBUG: Respuesta completa de usuarios:', JSON.stringify(usuariosRes, null, 2));
      console.log('🔍 DEBUG: Respuesta completa de ministerios:', JSON.stringify(ministeriosRes, null, 2));
      
      const usuariosData = usuariosRes.usuarios || usuariosRes.data || usuariosRes || [];
      const ministeriosData = ministeriosRes.data || ministeriosRes || [];
      
      console.log('🔍 DEBUG: Datos de usuarios a establecer:', usuariosData);
      console.log('🔍 DEBUG: Datos de ministerios a establecer:', ministeriosData);
      
      setUsuarios(usuariosData);
      setMinisterios(ministeriosData);
      
      console.log('🔍 DEBUG: Datos establecidos correctamente');
    } catch (error) {
      console.error('🔍 DEBUG: Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
      console.log('🔍 DEBUG: Carga de datos finalizada');
    }
  };

  const handleCreateUsuario = async () => {
    if (!createForm.email || !createForm.nombre) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      console.log('🔍 DEBUG: Iniciando creación de usuario');
      console.log('🔍 DEBUG: Datos del formulario:', createForm);
      
      console.log('🔍 DEBUG: Llamando a API para crear usuario');
      const response = await apiClient.admin.createUsuario(createForm);
      
      console.log('🔍 DEBUG: Respuesta de la API:', response);
      
      // Verificar si la respuesta es exitosa (puede ser success: true o message con éxito)
      const isSuccess = response.success || (response.message && response.message.includes('exitosamente'));
      
      if (isSuccess) {
        console.log('🔍 DEBUG: Usuario creado exitosamente');
        
        // Obtener la contraseña temporal
        const passwordTemporal = response.passwordTemporal || response.usuario?.passwordTemporal;
        console.log('🔍 DEBUG: Contraseña temporal:', passwordTemporal);
        
        // Cerrar modal de creación
        console.log('🔍 DEBUG: Cerrando modal de creación');
        setShowCreateModal(false);
        
        // Limpiar formulario
        setCreateForm({
          email: '',
          nombre: '',
          rol: 'USUARIO',
          ministerioId: '',
        });
        
        // Recargar lista
        console.log('🔍 DEBUG: Recargando lista de usuarios');
        await loadData();
        
        // Mostrar modal de contraseña temporal
        if (passwordTemporal) {
          console.log('🔍 DEBUG: Mostrando modal de contraseña temporal');
          setTempPassword(passwordTemporal);
          setTempUserEmail(createForm.email);
          setShowPasswordModal(true);
        } else {
          toast.success('Usuario creado exitosamente', {
            icon: '✅',
          });
        }
      } else {
        toast.error(response.message || 'Error al crear el usuario', {
          icon: '❌',
        });
      }
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      const errorMessage = error.response?.data?.message || 'Error al crear el usuario';
      toast.error(errorMessage, {
        icon: '❌',
      });
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
        toast.success('Usuario actualizado exitosamente', {
          icon: '✅',
        });
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
        toast.error(response.message || 'Error al actualizar el usuario', {
          icon: '❌',
        });
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
        toast.success('Estado del usuario actualizado', {
          icon: '✅',
        });
        loadData(); // Recargar lista
      } else {
        toast.error(response.message || 'Error al actualizar el estado', {
          icon: '❌',
        });
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
        toast.success('Contraseña reseteada exitosamente', {
          icon: '✅',
        });
        loadData(); // Recargar lista
      } else {
        toast.error(response.message || 'Error al resetear la contraseña', {
          icon: '❌',
        });
      }
    } catch (error: any) {
      console.error('Error reseteando contraseña:', error);
      const errorMessage = error.response?.data?.message || 'Error al resetear la contraseña';
      toast.error(errorMessage, {
        icon: '❌',
      });
    }
  };

  const handleDeleteUsuario = async (usuarioId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await apiClient.admin.deleteUsuario(usuarioId);
      
      // Verificar si la respuesta es exitosa (puede ser success: true o message con éxito)
      const isSuccess = response.success || (response.message && response.message.includes('exitosamente'));
      
      if (isSuccess) {
        toast.success('Usuario eliminado exitosamente', {
          icon: '✅',
        });
        
        // Actualizar la lista inmediatamente sin recargar
        setUsuarios(prevUsuarios => prevUsuarios.filter(u => u.id !== usuarioId));
      } else {
        toast.error(response.message || 'Error al eliminar el usuario', {
          icon: '❌',
        });
      }
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar el usuario';
      toast.error(errorMessage, {
        icon: '❌',
      });
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

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setTempPassword('');
    setTempUserEmail('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      toast.success('Contraseña copiada al portapapeles', {
        icon: '✅',
      });
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      toast.error('Error al copiar al portapapeles', {
        icon: '❌',
      });
    }
  };

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRol = !filterRol || filterRol === 'all' || usuario.rol === filterRol;
    const matchesMinisterio = !filterMinisterio || filterMinisterio === 'all' || usuario.ministerioId === filterMinisterio;
    
    return matchesSearch && matchesRol && matchesMinisterio;
  });

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const rolOptions: SelectOption[] = [
    { value: 'all', label: 'Todos los roles' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'USUARIO', label: 'Usuario' },
  ];

  const ministerioOptions: SelectOption[] = [
    { value: 'all', label: 'Todos los ministerios' },
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
                Administración de Usuarios
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
                Gestiona los usuarios del sistema
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Buscar"
                placeholder="Nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <Select value={filterRol} onValueChange={setFilterRol}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ministerio</label>
                <Select value={filterMinisterio} onValueChange={setFilterMinisterio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un ministerio" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministerioOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col sm:flex-row items-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRol('');
                    setFilterMinisterio('');
                  }}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Limpiar
                </Button>
                <Button
                  onClick={loadData}
                  size="sm"
                  className="w-full sm:w-auto"
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
             <CardTitle className="text-lg md:text-xl">
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
                 <Button 
                   onClick={() => setShowCreateModal(true)}
                   className="w-full sm:w-auto"
                 >
                   <UserPlus className="h-4 w-4 mr-2" />
                   Crear Usuario
                 </Button>
               </div>
             ) : (
                               <div className="overflow-x-auto max-w-full">
                  <table className="w-full min-w-full">
                    <thead className="hidden md:table-header-group">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">
                          Usuario
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">
                          Rol
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">
                          Estado
                        </th>
                        <th className="text-left py-4 px-6 font-medium text-gray-700 text-sm">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                                         <tbody>
                       {filteredUsuarios.map((usuario) => (
                         <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                           {/* Desktop view */}
                           <td className="hidden md:table-cell py-4 px-6">
                             <div className="space-y-2">
                               <p className="font-medium text-gray-900 text-sm">
                                 {usuario.nombre}
                               </p>
                               <p className="text-sm text-gray-600 flex items-center">
                                 <Mail className="h-4 w-4 mr-2" />
                                 {usuario.email}
                               </p>
                               <p className="text-sm text-gray-500">
                                 {usuario.ministerioId ? (
                                   <Badge variant="outline" className="text-sm">
                                     {ministerios.find(m => m.id === usuario.ministerioId)?.sigla || usuario.ministerioId}
                                   </Badge>
                                 ) : (
                                   <span className="text-gray-400">No asignado</span>
                                 )}
                               </p>
                             </div>
                           </td>
                           <td className="hidden md:table-cell py-4 px-6">
                             <Badge variant={usuario.rol === 'ADMIN' ? 'default' : 'outline'} className="text-sm">
                               <Shield className="h-4 w-4 mr-2" />
                               {usuario.rol === 'ADMIN' ? 'Administrador' : 'Usuario'}
                             </Badge>
                           </td>
                           <td className="hidden md:table-cell py-4 px-6">
                             <div className="flex flex-col space-y-2">
                               {usuario.activo ? (
                                 <Badge variant="success" className="text-sm">
                                   <UserCheck className="h-4 w-4 mr-2" />
                                   Activo
                                 </Badge>
                               ) : (
                                 <Badge variant="destructive" className="text-sm">
                                   <UserX className="h-4 w-4 mr-2" />
                                   Inactivo
                                 </Badge>
                               )}
                               {usuario.claveTemporal && (
                                 <Badge variant="warning" className="text-sm">Clave Temporal</Badge>
                               )}
                             </div>
                           </td>
                           <td className="hidden md:table-cell py-4 px-6">
                             <div className="flex flex-col gap-2">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => openEditModal(usuario)}
                                 className="text-sm px-3 py-2 h-8"
                               >
                                 <Edit className="h-4 w-4 mr-2" />
                                 Editar
                               </Button>
                               
                               <Button
                                 size="sm"
                                 variant={usuario.activo ? 'destructive' : 'success'}
                                 onClick={() => handleToggleStatus(usuario.id)}
                                 className="text-sm px-3 py-2 h-8"
                               >
                                 {usuario.activo ? (
                                   <>
                                     <UserX className="h-4 w-4 mr-2" />
                                     Desactivar
                                   </>
                                 ) : (
                                   <>
                                     <UserCheck className="h-4 w-4 mr-2" />
                                     Activar
                                   </>
                                 )}
                               </Button>
                               
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleResetPassword(usuario.id)}
                                 className="text-sm px-3 py-2 h-8"
                               >
                                 <RefreshCw className="h-4 w-4 mr-2" />
                                 Reset
                               </Button>
                               
                               <Button
                                 size="sm"
                                 variant="destructive"
                                 onClick={() => handleDeleteUsuario(usuario.id)}
                                 className="text-sm px-3 py-2 h-8"
                               >
                                 <Trash2 className="h-4 w-4 mr-2" />
                                 Eliminar
                               </Button>
                             </div>
                           </td>
                           
                           {/* Mobile view - Card layout */}
                           <td className="md:hidden p-3">
                             <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                               <div className="flex justify-between items-start">
                                 <div className="flex-1">
                                   <p className="font-medium text-gray-900 text-sm">
                                     {usuario.nombre}
                                   </p>
                                   <p className="text-xs text-gray-600 flex items-center">
                                     <Mail className="h-3 w-3 mr-1" />
                                     {usuario.email}
                                   </p>
                                 </div>
                                 <Badge variant={usuario.rol === 'ADMIN' ? 'default' : 'outline'} className="text-xs ml-2">
                                   <Shield className="h-3 w-3 mr-1" />
                                   {usuario.rol === 'ADMIN' ? 'Admin' : 'User'}
                                 </Badge>
                               </div>
                               
                               <div className="flex justify-between items-center">
                                 <div>
                                   {usuario.ministerioId ? (
                                     <Badge variant="outline" className="text-xs">
                                       {ministerios.find(m => m.id === usuario.ministerioId)?.sigla || usuario.ministerioId}
                                     </Badge>
                                   ) : (
                                     <span className="text-gray-400 text-xs">No asignado</span>
                                   )}
                                 </div>
                                 <div className="flex flex-col space-y-1">
                                   {usuario.activo ? (
                                     <Badge variant="success" className="text-xs">
                                       <UserCheck className="h-3 w-3 mr-1" />
                                       Activo
                                     </Badge>
                                   ) : (
                                     <Badge variant="destructive" className="text-xs">
                                       <UserX className="h-3 w-3 mr-1" />
                                       Inactivo
                                     </Badge>
                                   )}
                                   {usuario.claveTemporal && (
                                     <Badge variant="warning" className="text-xs">Clave Temporal</Badge>
                                   )}
                                 </div>
                               </div>
                               
                               <div className="pt-2 grid grid-cols-2 gap-1">
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => openEditModal(usuario)}
                                   className="text-xs px-1 py-1 h-6"
                                 >
                                   <Edit className="h-3 w-3 mr-1" />
                                   Editar
                                 </Button>
                                 
                                 <Button
                                   size="sm"
                                   variant={usuario.activo ? 'destructive' : 'success'}
                                   onClick={() => handleToggleStatus(usuario.id)}
                                   className="text-xs px-1 py-1 h-6"
                                 >
                                   {usuario.activo ? (
                                     <>
                                       <UserX className="h-3 w-3 mr-1" />
                                       Desactivar
                                     </>
                                   ) : (
                                     <>
                                       <UserCheck className="h-3 w-3 mr-1" />
                                       Activar
                                     </>
                                   )}
                                 </Button>
                                 
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleResetPassword(usuario.id)}
                                   className="text-xs px-1 py-1 h-6"
                                 >
                                   <RefreshCw className="h-3 w-3 mr-1" />
                                   Reset
                                 </Button>
                                 
                                 <Button
                                   size="sm"
                                   variant="destructive"
                                   onClick={() => handleDeleteUsuario(usuario.id)}
                                   className="text-xs px-1 py-1 h-6"
                                 >
                                   <Trash2 className="h-3 w-3 mr-1" />
                                   Eliminar
                                 </Button>
                               </div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rol *</label>
                  <Select value={createForm.rol} onValueChange={(value) => setCreateForm(prev => ({ ...prev, rol: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {createRolOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ministerio (Opcional)</label>
                  <Select value={createForm.ministerioId} onValueChange={(value) => setCreateForm(prev => ({ ...prev, ministerioId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un ministerio" />
                    </SelectTrigger>
                    <SelectContent>
                      {ministerioOptions.filter(m => m.value !== '').map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Rol *</label>
                   <Select value={editForm.rol} onValueChange={(value) => setEditForm(prev => ({ ...prev, rol: value as any }))}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecciona un rol" />
                     </SelectTrigger>
                     <SelectContent>
                       {createRolOptions.map((option) => (
                         <SelectItem key={option.value} value={option.value}>
                           {option.label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Ministerio (Opcional)</label>
                   <Select value={editForm.ministerioId} onValueChange={(value) => setEditForm(prev => ({ ...prev, ministerioId: value }))}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecciona un ministerio" />
                     </SelectTrigger>
                     <SelectContent>
                       {ministerioOptions.filter(m => m.value !== '').map((option) => (
                         <SelectItem key={option.value} value={option.value}>
                           {option.label}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>

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

       {/* Modal de contraseña temporal */}
       {showPasswordModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg max-w-md w-full">
             <div className="p-6">
               <div className="flex items-center mb-4">
                 <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                 <h2 className="text-xl font-semibold text-gray-900">
                   Usuario Creado Exitosamente
                 </h2>
               </div>

               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                 <p className="text-sm text-blue-800 mb-2">
                   <strong>Información importante:</strong>
                 </p>
                 <p className="text-sm text-blue-700">
                   Se ha generado una contraseña temporal para el usuario. 
                   Esta contraseña debe ser compartida de forma segura con el usuario.
                 </p>
               </div>

               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Email del usuario
                   </label>
                   <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900">
                     {tempUserEmail}
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Contraseña temporal
                   </label>
                   <div className="flex items-center space-x-2">
                     <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono text-gray-900">
                       {tempPassword}
                     </div>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={copyToClipboard}
                       className="px-3 py-2"
                     >
                       <Copy className="h-4 w-4 mr-1" />
                       Copiar
                     </Button>
                   </div>
                 </div>

                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                   <p className="text-sm text-yellow-800">
                     <strong>⚠️ Importante:</strong> El usuario deberá cambiar esta contraseña 
                     en su primer inicio de sesión.
                   </p>
                 </div>

                 <div className="flex justify-end pt-4">
                   <Button
                     onClick={closePasswordModal}
                     className="bg-green-600 hover:bg-green-700"
                   >
                     <CheckCircle className="h-4 w-4 mr-2" />
                     Entendido
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








