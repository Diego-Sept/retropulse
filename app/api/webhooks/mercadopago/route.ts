import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[MP Webhook]', JSON.stringify(body, null, 2));

    const type = body.type || body.action;
    const data = body.data || {};

    if (type === 'subscription_preapproval' || type === 'created' || type === 'updated') {
      // Subscription authorized — user agreed to recurring payments
      const preapprovalId = data.id || body.preapproval_id;
      if (!preapprovalId) {
        return NextResponse.json({ ok: true });
      }

      const externalRef = body.external_reference;
      if (!externalRef) {
        return NextResponse.json({ ok: true });
      }

      const ref = typeof externalRef === 'string' ? JSON.parse(externalRef) : externalRef;
      const empresaId = ref.empresa_id;
      const planName = ref.plan === 'small_team' ? 'Small Team' : 'Enterprise';
      const clustersIaMes = ref.clusters;
      const equiposMax = ref.equipos;
      const precio = ref.precio;

      if (!empresaId) {
        return NextResponse.json({ ok: true });
      }

      const supabase = getSupabaseServerClient();

      // Get plan_id
      const { data: plan } = await supabase
        .from('planes_subscription')
        .select('id')
        .eq('nombre', planName)
        .maybeSingle();

      if (!plan) {
        console.error('[MP Webhook] Plan not found:', planName);
        return NextResponse.json({ ok: true });
      }

      // Update or create suscripcion
      const { data: existingSusc } = await supabase
        .from('suscripciones')
        .select('id')
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (existingSusc) {
        await supabase
          .from('suscripciones')
          .update({
            plan_id: plan.id,
            equipos_max: equiposMax,
            clusters_ia_mes: clustersIaMes,
            precio,
            estado: 'activa',
            updated_at: new Date().toISOString(),
          })
          .eq('empresa_id', empresaId);
      } else {
        await supabase
          .from('suscripciones')
          .insert({
            empresa_id: empresaId,
            plan_id: plan.id,
            equipos_max: equiposMax,
            clusters_ia_mes: clustersIaMes,
            precio,
            estado: 'activa',
            fecha_inicio: new Date().toISOString(),
          });
      }

      console.log(`[MP Webhook] Subscription updated: empresa=${empresaId} plan=${planName}`);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[MP Webhook] Error:', error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
