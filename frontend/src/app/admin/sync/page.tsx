'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useIsAdmin } from '@/store/auth-store';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Settings, 
  Upload, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface SyncStatus {
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
  totalRecords: number;
  syncedRecords: number;
}

interface GoogleSheetsInfo {
  spreadsheetId: string;
  sheetName: string;
  url: string;
  lastModified: string;
}

export default function SyncPage() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    status: 'idle',
    message: '',
    totalRecords: 0,
    syncedRecords: 0,
  });
  const [sheetsInfo, setSheetsInfo] = useState<GoogleSheetsInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      router.push('/home');
      return;
    }

    loadSyncInfo();
  }, [isAuthenticated, isAdmin, router]);

  const loadSyncInfo = async () => {
    try {
      // Configurado con la URL real de tu planilla PIO
      setSheetsInfo({
        spreadsheetId: '1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA',
        sheetName: 'PIO_Indicadores',
        url: 'https://docs.google.com/spreadsheets/d/1oOsW1ph6eFo0WcK28XdVjOaMZ9VqvB1T48Zje7MN7IA',
        lastModified: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error cargando información de sincronización:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel')) {
      setSelectedFile(file);
      toast.success(`Archivo seleccionado: ${file.name}`);
    } else {
      toast.error('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo primero');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Llamada real a la API
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/sync/import-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Archivo importado exitosamente');
        setSyncStatus({
          lastSync: new Date().toISOString(),
          status: 'success',
          message: `Importación completada: ${result.data.ministeriosCreados} ministerios, ${result.data.indicadoresCreados} indicadores, ${result.data.cargasCreadas} cargas`,
          totalRecords: result.data.ministeriosCreados + result.data.indicadoresCreados + result.data.cargasCreadas,
          syncedRecords: result.data.ministeriosCreados + result.data.indicadoresCreados + result.data.cargasCreadas,
        });
        
        if (result.data.errores && result.data.errores.length > 0) {
          toast.error(`Importación completada con ${result.data.errores.length} errores`);
        }
      } else {
        toast.error(result.message || 'Error al importar el archivo');
        setSyncStatus(prev => ({ ...prev, status: 'error', message: result.message }));
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      toast.error('Error al subir el archivo');
      setSyncStatus(prev => ({ ...prev, status: 'error', message: 'Error de conexión' }));
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  const handleSyncToSheets = async () => {
    setIsLoading(true);
    setSyncStatus(prev => ({ ...prev, status: 'syncing', message: 'Sincronizando con Google Sheets...' }));

    try {
      // Llamada real a la API
      const response = await fetch('https://sigepi-backend.onrender.com/api/v1/sync/sync-to-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sincronización completada exitosamente');
        setSyncStatus({
          lastSync: new Date().toISOString(),
          status: 'success',
          message: 'Sincronización con Google Sheets completada',
          totalRecords: 150,
          syncedRecords: 150,
        });
      } else {
        toast.error(result.message || 'Error en la sincronización');
        setSyncStatus(prev => ({ ...prev, status: 'error', message: result.message }));
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      setSyncStatus(prev => ({ ...prev, status: 'error', message: 'Error de conexión' }));
      toast.error('Error en la sincronización');
    } finally {
      setIsLoading(false);
    }
  };


  const getStatusIcon = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
              <Settings className="h-6 w-6 md:h-8 md:w-8 text-gcba-blue" />
              Sincronización
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
              Gestiona la sincronización de datos con Google Sheets e importa desde Excel
            </p>
          </div>
        </div>

        {/* Estado de sincronización */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              Estado de Sincronización
              {getStatusIcon()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600">Última Sincronización</p>
                <p className="text-base md:text-lg font-semibold">
                  {syncStatus.lastSync 
                    ? new Date(syncStatus.lastSync).toLocaleString('es-AR')
                    : 'Nunca'
                  }
                </p>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600">Total de Registros</p>
                <p className="text-base md:text-lg font-semibold">{syncStatus.totalRecords}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs md:text-sm text-gray-600">Registros Sincronizados</p>
                <p className="text-base md:text-lg font-semibold">{syncStatus.syncedRecords}</p>
              </div>
            </div>
            
            {syncStatus.message && (
              <div className={`mt-4 p-3 rounded-lg ${getStatusColor()}`}>
                {syncStatus.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información de Google Sheets */}
        {sheetsInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                Google Sheets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div>
                    <p className="text-sm text-gray-600">ID de la Planilla</p>
                    <p className="font-mono text-xs md:text-sm bg-gray-100 p-2 rounded">
                      {sheetsInfo.spreadsheetId}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(sheetsInfo.url, '_blank')}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir en Sheets
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre de la Hoja</p>
                    <p className="font-semibold">{sheetsInfo.sheetName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Última Modificación</p>
                    <p className="font-semibold">
                      {new Date(sheetsInfo.lastModified).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones de sincronización */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Sincronización con Google Sheets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <RefreshCw className="h-6 w-6 text-blue-600" />
                Sincronizar con Google Sheets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Envía los datos del sistema a Google Sheets para mantener la planilla actualizada.
              </p>
              <Button
                onClick={handleSyncToSheets}
                loading={isLoading}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Sincronizando...' : 'Sincronizar Ahora'}
              </Button>
            </CardContent>
          </Card>

          {/* Importación desde Excel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Upload className="h-6 w-6 text-green-600" />
                Importar desde Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Sube un archivo Excel para importar ministerios, compromisos e indicadores automáticamente al sistema.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">¿Qué hace la importación?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Lee tu archivo Excel</strong> con ministerios, compromisos e indicadores</li>
                  <li>• <strong>Valida automáticamente</strong> que los datos sean correctos</li>
                  <li>• <strong>Importa todo al sistema</strong> sin duplicados</li>
                  <li>• <strong>Los hace disponibles</strong> para todos los usuarios</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gcba-blue file:text-white hover:file:bg-blue-700"
                />
                
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileSpreadsheet className="h-4 w-4" />
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
                
                <Button
                  onClick={handleFileUpload}
                  loading={isLoading}
                  disabled={!selectedFile || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Procesando...' : 'Importar Datos'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Sincronización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <h4>¿Cómo funciona?</h4>
              <ul>
                <li><strong>Sincronización a Google Sheets:</strong> Envía todos los datos del sistema a la planilla configurada</li>
                <li><strong>Importación desde Excel:</strong> Permite cargar ministerios, compromisos e indicadores desde archivos Excel</li>
                <li><strong>Validación automática:</strong> Los datos se validan antes de ser procesados</li>
                <li><strong>Auditoría completa:</strong> Todas las operaciones quedan registradas en el sistema</li>
              </ul>
              
              <h4>Formato esperado del Excel</h4>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm font-medium mb-2">Tu archivo Excel debe tener estas columnas:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold">Ministerios:</p>
                    <ul className="text-gray-600">
                      <li>• ID (ej: "DES", "MEC")</li>
                      <li>• Nombre</li>
                      <li>• Descripción</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">Compromisos:</p>
                    <ul className="text-gray-600">
                      <li>• ID</li>
                      <li>• Nombre</li>
                      <li>• Ministerio ID</li>
                      <li>• Descripción</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">Indicadores:</p>
                    <ul className="text-gray-600">
                      <li>• ID</li>
                      <li>• Nombre</li>
                      <li>• Compromiso ID</li>
                      <li>• Periodicidad</li>
                      <li>• Meta</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <h4>Formatos soportados</h4>
              <ul>
                <li>Excel (.xlsx, .xls)</li>
                <li>Google Sheets (sincronización automática)</li>
                <li>CSV (próximamente)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}





