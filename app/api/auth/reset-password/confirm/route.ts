import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token, new_password } = await request.json();

    if (!token || !new_password) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son requeridos' },
        { status: 400 },
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // Hash the received token to match what's stored in DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const { data: resetToken, error: findError } = await supabase
      .from('reset_tokens')
      .select('*')
      .eq('token', hashedToken)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (findError) {
      console.error('Token lookup error:', findError);
      return NextResponse.json(
        { error: 'Error al verificar el token' },
        { status: 500 },
      );
    }

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 },
      );
    }

    // Update password
    const passwordHash = await hashPassword(new_password);
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', resetToken.usuario_id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña' },
        { status: 500 },
      );
    }

    // Mark token as used
    const { error: markError } = await supabase
      .from('reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id);

    if (markError) {
      console.error('Mark token used error:', markError);
      // Non-fatal — password was already updated
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Confirm reset error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
