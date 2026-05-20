export interface Usuario {
  id: string;
  email: string;
  password_hash: string;
  nombre: string;
  rol_global: 'super_admin' | 'empresa_admin' | 'member';
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  user_id: string;
  empresa_id: string;
  rol_global: Usuario['rol_global'];
  suscripcion_id: string;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol_global: Usuario['rol_global'];
  empresa_id: string;
  suscripcion_id: string;
}

export interface ResetToken {
  id: string;
  usuario_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

// API contracts
export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetRequest {
  token: string;
  new_password: string;
}
