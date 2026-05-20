import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { sendEmail, buildPriceChangeEmail } from '@/lib/email';
import { UpdatePlanPrecioRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check: only super_admin
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (user.rol_global !== 'super_admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // 2. Parse body
    const body: UpdatePlanPrecioRequest = await request.json();
    const { plan_id, precio_nuevo, fecha_efectiva, motivo } = body;

    if (!plan_id || precio_nuevo === undefined || !fecha_efectiva || !motivo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: plan_id, precio_nuevo, fecha_efectiva, motivo' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    // 3. Get current price from planes_subscription
    const { data: plan, error: planError } = await supabase
      .from('planes_subscription')
      .select('id, nombre, precio')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const precioAnterior = Number(plan.precio);

    // 4. Update template price
    const { error: updateError } = await supabase
      .from('planes_subscription')
      .update({ precio: precio_nuevo, updated_at: new Date().toISOString() })
      .eq('id', plan_id);

    if (updateError) {
      console.error('Error updating plan price:', updateError);
      return NextResponse.json({ error: 'Error al actualizar el precio del plan' }, { status: 500 });
    }

    // 5. Find all active suscripciones for this plan
    const { data: suscripciones, error: suscError } = await supabase
      .from('suscripciones')
      .select('id, empresa_id, precio')
      .eq('plan_id', plan_id)
      .eq('estado', 'activa');

    if (suscError) {
      console.error('Error fetching suscripciones:', suscError);
      return NextResponse.json({ error: 'Error al buscar suscripciones' }, { status: 500 });
    }

    // 6. Update each suscripcion with precio_proximo and fecha_efectiva
    const suscripcionIds: string[] = (suscripciones || []).map((s) => s.id);

    if (suscripcionIds.length > 0) {
      const { error: batchUpdateError } = await supabase
        .from('suscripciones')
        .update({
          precio_proximo: precio_nuevo,
          fecha_efectiva_proximo_cambio: fecha_efectiva,
          updated_at: new Date().toISOString(),
        })
        .in('id', suscripcionIds);

      if (batchUpdateError) {
        console.error('Error updating suscripciones:', batchUpdateError);
        return NextResponse.json({ error: 'Error al actualizar suscripciones' }, { status: 500 });
      }
    }

    // 7. Log in price_changes_log
    const { error: logError } = await supabase
      .from('price_changes_log')
      .insert({
        plan_id,
        precio_anterior: precioAnterior,
        precio_nuevo,
        fecha_efectiva,
        tipo_cambio: 'global_template',
        motivo,
        created_by: user.id,
      });

    if (logError) {
      console.error('Error logging price change:', logError);
      // Non-fatal: continue
    }

    // 8. Find empresa_admin users for each affected empresa
    const empresaIds = Array.from(new Set((suscripciones || []).map((s) => s.empresa_id)));

    let notificacionesCreadas = 0;
    let notificacionesEnviadas = 0;
    let notificacionesFallidas = 0;

    if (empresaIds.length > 0) {
      // Get all empresa_admin users for these empresas
      const { data: admins } = await supabase
        .from('usuarios')
        .select('id, email, empresa_id')
        .in('empresa_id', empresaIds)
        .eq('rol_global', 'empresa_admin');

      // Create notification rows
      if (admins && admins.length > 0) {
        const notificationInserts = admins.map((admin) => {
          const suscripcion = (suscripciones || []).find((s) => s.empresa_id === admin.empresa_id);
          return {
            empresa_id: admin.empresa_id,
            tipo: 'cambio_precio' as const,
            suscripcion_id: suscripcion?.id || null,
            precio_anterior: precioAnterior,
            precio_nuevo,
            fecha_efectiva,
            destinatario_email: admin.email,
          };
        });

        if (notificationInserts.length > 0) {
          const { data: notifications, error: notifError } = await supabase
            .from('notificaciones_email')
            .insert(notificationInserts)
            .select('id, destinatario_email, empresa_id');

          if (notifError) {
            console.error('Error creating notifications:', notifError);
          } else {
            notificacionesCreadas = notifications?.length || 0;

            // 9. Attempt to send emails
            for (const notif of notifications || []) {
              const emailHtml = buildPriceChangeEmail(
                plan.nombre,
                precioAnterior,
                precio_nuevo,
                fecha_efectiva,
              );

              const result = await sendEmail({
                to: notif.destinatario_email,
                subject: `Cambio de precio en tu plan ${plan.nombre}`,
                html: emailHtml,
              });

              // Update notification status
              const updateData: any = {
                enviado: result.success,
                enviado_en: result.success ? new Date().toISOString() : null,
              };
              if (!result.success) {
                updateData.error_msg = result.error || 'Error desconocido al enviar email';
              }

              await supabase
                .from('notificaciones_email')
                .update(updateData)
                .eq('id', notif.id);

              if (result.success) {
                notificacionesEnviadas++;
              } else {
                notificacionesFallidas++;
              }
            }
          }
        }
      }
    }

    // 10. Return summary
    return NextResponse.json({
      ok: true,
      cambio_template: {
        precio_anterior: precioAnterior,
        precio_nuevo,
      },
      suscripciones_afectadas: suscripcionIds.length,
      notificaciones_email: {
        creadas: notificacionesCreadas,
        enviadas: notificacionesEnviadas,
        fallidas: notificacionesFallidas,
      },
    });
  } catch (error) {
    console.error('Error en POST /api/admin/planes/precio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
