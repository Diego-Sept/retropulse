import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.tuproveedor.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  ...(smtpUser && smtpPass ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
});

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const fromName = process.env.SMTP_FROM || 'Retro Scrum <noreply@tuempresa.com>';
    await transporter.sendMail({
      from: fromName,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message || 'Error al enviar email' };
  }
}

export function buildPasswordResetEmail(link: string): string {
  return `
    <h2>Restablecer tu contraseña</h2>
    <p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
    <p><a href="${link}">${link}</a></p>
    <p>Este enlace expira en 1 hora.</p>
    <p>Si no solicitaste este cambio, ignorá este mensaje.</p>
  `;
}

export function buildPriceChangeEmail(planNombre: string, precioAnterior: number, precioNuevo: number, fechaEfectiva: string): string {
  return `
    <h2>Cambio de precio en tu plan</h2>
    <p>Te informamos que el plan <strong>${planNombre}</strong> tendrá un cambio de precio.</p>
    <ul>
      <li>Precio anterior: <strong>$${precioAnterior.toFixed(2)}</strong></li>
      <li>Precio nuevo: <strong>$${precioNuevo.toFixed(2)}</strong></li>
      <li>Fecha efectiva: <strong>${fechaEfectiva}</strong></li>
    </ul>
    <p>Si tenés dudas, contactate con soporte.</p>
  `;
}

export function buildInvitationEmail(equipoNombre: string, invitationLink: string): string {
  return `
    <h2>Invitación a RetroPulse</h2>
    <p>Te invitaron a unirte al equipo <strong>${equipoNombre}</strong>.</p>
    <p>Hacé clic en el siguiente enlace para aceptar la invitación:</p>
    <p><a href="${invitationLink}">${invitationLink}</a></p>
    <p>Este enlace expira en 7 días.</p>
  `;
}
