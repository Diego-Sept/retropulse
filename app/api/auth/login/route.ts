import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, signJwt } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { LoginRequest, AuthResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y password son requeridos' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // Find user by email
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Login lookup error:', userError);
      return NextResponse.json(
        { error: 'Error al buscar el usuario' },
        { status: 500 },
      );
    }

    if (!usuario) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 },
      );
    }

    // Verify password
    const valid = await verifyPassword(password, usuario.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 },
      );
    }

    // Get active suscripcion for the empresa
    const { data: suscripcion, error: suscError } = await supabase
      .from('suscripciones')
      .select('id')
      .eq('empresa_id', usuario.empresa_id)
      .eq('estado', 'activa')
      .maybeSingle();

    // suscripcion is optional — allow login even if missing
    const suscripcionId = suscripcion?.id || '';

    const token = await signJwt({
      user_id: usuario.id,
      empresa_id: usuario.empresa_id,
      rol_global: usuario.rol_global as 'super_admin' | 'empresa_admin' | 'member',
      suscripcion_id: suscripcionId,
      nombre: usuario.nombre,
      email: usuario.email,
    });

    const response = NextResponse.json({
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol_global: usuario.rol_global,
        empresa_id: usuario.empresa_id,
        suscripcion_id: suscripcionId,
      },
      token,
    } satisfies AuthResponse);

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
