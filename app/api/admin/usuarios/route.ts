import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-middleware';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (authUser.rol_global !== 'empresa_admin' && authUser.rol_global !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();

    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol_global, created_at')
      .eq('empresa_id', authUser.empresa_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching usuarios:', error);
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
    }

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error('GET /api/admin/usuarios error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (authUser.rol_global !== 'empresa_admin' && authUser.rol_global !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, nombre, rol_global } = body;

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: 'Email, password y nombre son requeridos' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 },
      );
    }

    const targetRol = rol_global === 'empresa_admin' ? 'empresa_admin' : 'member';
    const normalizedEmail = email.trim().toLowerCase();

    const supabase = getSupabaseServerClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const { data: usuario, error: createError } = await supabase
      .from('usuarios')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        nombre: nombre.trim(),
        rol_global: targetRol,
        empresa_id: authUser.empresa_id,
      })
      .select('id, email, nombre, rol_global, created_at')
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 },
      );
    }

    return NextResponse.json({ usuario }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/usuarios error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
