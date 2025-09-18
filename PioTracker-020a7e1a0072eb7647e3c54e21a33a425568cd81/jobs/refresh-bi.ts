#!/usr/bin/env ts-node

/**
 * Script para refrescar datasets de Power BI
 * 
 * Este script está diseñado para ser ejecutado como un job programado
 * o llamado desde un endpoint de la API para refrescar automáticamente
 * los datasets de Power BI cuando se sincronizan nuevos datos.
 * 
 * REQUISITOS:
 * - Configurar variables de entorno de Power BI
 * - Tener credenciales de servicio configuradas
 * - Ejecutar desde un entorno con acceso a internet
 */

import { config } from 'dotenv';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

// Cargar variables de entorno
config();

interface PowerBIConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  groupId: string;
  datasetId: string;
}

class PowerBIRefreshService {
  private config: PowerBIConfig;
  private graphClient: Client;

  constructor() {
    this.config = {
      tenantId: process.env.POWERBI_TENANT_ID || '',
      clientId: process.env.POWERBI_CLIENT_ID || '',
      clientSecret: process.env.POWERBI_CLIENT_SECRET || '',
      groupId: process.env.POWERBI_GROUP_ID || '',
      datasetId: process.env.POWERBI_DATASET_ID || '',
    };

    this.validateConfig();
    this.initializeGraphClient();
  }

  private validateConfig(): void {
    const requiredFields = ['tenantId', 'clientId', 'clientSecret', 'groupId', 'datasetId'];
    const missingFields = requiredFields.filter(field => !this.config[field as keyof PowerBIConfig]);

    if (missingFields.length > 0) {
      throw new Error(`Configuración incompleta. Faltan: ${missingFields.join(', ')}`);
    }
  }

  private initializeGraphClient(): void {
    const credential = new ClientSecretCredential(
      this.config.tenantId,
      this.config.clientId,
      this.config.clientSecret
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });

    this.graphClient = Client.initWithMiddleware({
      authProvider: authProvider
    });
  }

  async refreshDataset(): Promise<void> {
    try {
      console.log('🔄 Iniciando refresh del dataset de Power BI...');
      
      // Llamar a la API de Microsoft Graph para refrescar el dataset
      const response = await this.graphClient
        .api(`/v1.0/myorg/groups/${this.config.groupId}/datasets/${this.config.datasetId}/refreshes`)
        .post({});

      console.log('✅ Dataset refrescado exitosamente');
      console.log('📊 Detalles del refresh:', response);
      
    } catch (error) {
      console.error('❌ Error al refrescar dataset:', error);
      throw error;
    }
  }

  async getDatasetStatus(): Promise<any> {
    try {
      const response = await this.graphClient
        .api(`/v1.0/myorg/groups/${this.config.groupId}/datasets/${this.config.datasetId}`)
        .get();

      return response;
    } catch (error) {
      console.error('❌ Error al obtener estado del dataset:', error);
      throw error;
    }
  }

  async getRefreshHistory(): Promise<any[]> {
    try {
      const response = await this.graphClient
        .api(`/v1.0/myorg/groups/${this.config.groupId}/datasets/${this.config.datasetId}/refreshes`)
        .get();

      return response.value || [];
    } catch (error) {
      console.error('❌ Error al obtener historial de refreshes:', error);
      throw error;
    }
  }
}

// Función principal
async function main() {
  try {
    // Verificar si Power BI está habilitado
    if (process.env.POWERBI_REFRESH_ENABLED !== 'true') {
      console.log('⚠️ Power BI refresh está deshabilitado. Configurar POWERBI_REFRESH_ENABLED=true para habilitar.');
      return;
    }

    const service = new PowerBIRefreshService();
    
    // Obtener estado actual del dataset
    const status = await service.getDatasetStatus();
    console.log('📊 Estado actual del dataset:', status.name);
    
    // Refrescar el dataset
    await service.refreshDataset();
    
    // Esperar un momento y verificar el historial
    await new Promise(resolve => setTimeout(resolve, 5000));
    const history = await service.getRefreshHistory();
    
    if (history.length > 0) {
      const lastRefresh = history[0];
      console.log('🕒 Último refresh:', {
        startTime: lastRefresh.startTime,
        endTime: lastRefresh.endTime,
        status: lastRefresh.status
      });
    }
    
  } catch (error) {
    console.error('💥 Error fatal en el script de refresh:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

export { PowerBIRefreshService };








