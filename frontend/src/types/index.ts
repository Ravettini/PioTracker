export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'USUARIO';
  ministerioId?: string;
  activo: boolean;
  claveTemporal: boolean;
  ultimoLogin?: string;
  intentosFallidos: number;
  bloqueadoHasta?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Ministerio {
  id: string;
  nombre: string;
  sigla: string;
  activo: boolean;
}

export interface Linea {
  id: string;
  titulo: string;
  ministerioId: string;
  activo: boolean;
}

export interface Indicador {
  id: string;
  nombre: string;
  lineaId: string;
  unidadDefecto: string;
  periodicidad: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  activo: boolean;
  valorMin?: number;
  valorMax?: number;
}

export interface Carga {
  id: string;
  ministerioId: string;
  lineaId: string;
  indicadorId: string;
  periodicidad: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  periodo: string;
  valor: number;
  unidad: string;
  meta?: number;
  fuente: string;
  responsableNombre: string;
  responsableEmail: string;
  observaciones?: string;
  estado: 'borrador' | 'pendiente' | 'validado' | 'observado' | 'rechazado';
  publicado: boolean;
  creadoPor: string;
  actualizadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CargaConRelaciones extends Carga {
  ministerio: Ministerio;
  linea: Linea;
  indicador: Indicador;
  creadoPorUsuario: Usuario;
  actualizadoPorUsuario: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Usuario;
  accessToken: string;
}

export interface CreateCargaRequest {
  ministerioId: string;
  lineaId: string;
  indicadorId: string;
  periodicidad: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  periodo: string;
  valor: number;
  unidad: string;
  meta?: number;
  fuente: string;
  responsableNombre: string;
  responsableEmail: string;
  observaciones?: string;
}

export interface CreateCargaDto {
  indicadorId: string;
  periodo: string;
  valor: string;
  unidad: string;
  fuente: string;
  responsable: string;
  observaciones?: string;
  metadata?: Record<string, string>;
}

export interface UpdateCargaRequest extends Partial<CreateCargaRequest> {
  id: string;
}

export interface RevisionRequest {
  estado: 'validado' | 'observado' | 'rechazado';
  observaciones?: string;
}

export interface CreateUsuarioRequest {
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'USUARIO';
  ministerioId?: string;
}

export interface UpdateUsuarioRequest extends Partial<CreateUsuarioRequest> {
  id: string;
  activo?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterOptions {
  estado?: string;
  ministerioId?: string;
  lineaId?: string;
  indicadorId?: string;
  periodo?: string;
  page?: number;
  limit?: number;
}

export interface SyncStatus {
  totalCargas: number;
  cargasPublicadas: number;
  cargasPendientes: number;
  ultimaSincronizacion?: string;
  estado: 'ok' | 'error' | 'pending';
}
