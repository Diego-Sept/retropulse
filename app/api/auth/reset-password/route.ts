import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { sendEmail, buildPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: user } = await supabase
      .from('usuarios')
      .select('id, email, nombre')
      .eq('email', email)
      .maybeSingle();

    // Always return ok to not reveal if email exists
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const { error: tokenError } = await supabase.from('reset_tokens').insert({
      usuario_id: user.id,
      token: hashedToken,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    });

    if (tokenError) throw tokenError;

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password/${rawToken}`;

    // Send email (don't block on failure)
    await sendEmail({
      to: user.email,
      subject: 'Restablecer contraseña - RetroPulse',
      html: buildPasswordResetEmail(resetLink),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ ok: true }); // Still return ok
  }
}
