import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { JwtPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const JWT_EXPIRY = '1h';
const BCRYPT_COST = 10;

/** Converts the secret string to a Uint8Array for jose HMAC. */
function getSecret(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
): Promise<string> {
  return new SignJWT({ ...payload } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    return {
      user_id: payload.user_id as string,
      empresa_id: payload.empresa_id as string,
      rol_global: payload.rol_global as JwtPayload['rol_global'],
      suscripcion_id: payload.suscripcion_id as string,
      nombre: (payload.nombre as string) || '',
      email: (payload.email as string) || '',
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

export function getJwtExpiry(): string {
  return JWT_EXPIRY;
}
