import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, signJwt } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { RegisterRequest, AuthResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, nombre } = body;

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: 'Email, password y nombre son requeridos' },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password debe tener al menos 6 caracteres' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // Check existing user
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: 'Email ya registrado' },
        { status: 409 },
      );
    }

    // Get Free plan
    const { data: freePlan, error: planError } = await supabase
      .from('planes_subscription')
      .select('*')
      .eq('nombre', 'Gratuito')
      .single();
    if (planError || !freePlan) {
      console.error('Free plan lookup error:', planError);
      return NextResponse.json(
        { error: 'Error de configuración: plan gratuito no encontrado' },
        { status: 500 },
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create empresa (tenant)
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .insert({ nombre })
      .select()
      .single();
    if (empresaError) {
      console.error('Empresa creation error:', empresaError);
      return NextResponse.json(
        { error: 'Error al crear la empresa' },
        { status: 500 },
      );
    }

    // Create suscripcion for the empresa (snapshot from Free plan)
    const { data: suscripcion, error: suscError } = await supabase
      .from('suscripciones')
      .insert({
        empresa_id: empresa.id,
        plan_id: freePlan.id,
        equipos_max: freePlan.equipos_max,
        clusters_ia_mes: freePlan.clusters_ia_mes,
        precio: freePlan.precio,
        fecha_inicio: new Date().toISOString(),
      })
      .select()
      .single();
    if (suscError) {
      console.error('Suscripcion creation error:', suscError);
      return NextResponse.json(
        { error: 'Error al crear la suscripción' },
        { status: 500 },
      );
    }

    // Check if email matches super admin env var
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
    const rolGlobal =
      email.toLowerCase() === superAdminEmail
        ? 'super_admin'
        : ('empresa_admin' as const);

    // Create usuario
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .insert({
        email,
        password_hash: passwordHash,
        nombre,
        rol_global: rolGlobal,
        empresa_id: empresa.id,
      })
      .select()
      .single();
    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 },
      );
    }

    const token = await signJwt({
      user_id: usuario.id,
      empresa_id: empresa.id,
      rol_global: usuario.rol_global as 'super_admin' | 'empresa_admin' | 'member',
      suscripcion_id: suscripcion.id,
    });

    const response = NextResponse.json({
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol_global: usuario.rol_global,
        empresa_id: usuario.empresa_id,
        suscripcion_id: suscripcion.id,
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
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
