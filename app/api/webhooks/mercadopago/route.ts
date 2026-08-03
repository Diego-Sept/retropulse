import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

const MP_API = 'https://api.mercadopago.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[MP Webhook]', JSON.stringify(body).substring(0, 500));

    // Checkout Pro sends payment notifications
    const type = body.type || body.action || '';
    const paymentId = body.data?.id || body.id || '';

    if (!paymentId && (type === 'payment' || body.topic === 'payment')) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // If we have a payment ID, look it up
    if (paymentId && body.topic !== 'merchant_order') {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      if (!accessToken) {
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      const paymentRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const payment = await paymentRes.json();

      if (payment.status !== 'approved') {
        console.log('[MP Webhook] Payment not approved:', payment.status);
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      const externalRef = payment.external_reference;
      if (!externalRef) {
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      let ref: any;
      try { ref = JSON.parse(externalRef); } catch { ref = null; }
      if (!ref || !ref.empresa_id) {
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      const empresaId = ref.empresa_id;
      const planName = ref.plan === 'small_team' ? 'Small Team' : 'Enterprise';
      const clustersIaMes = ref.clusters;
      const equiposMax = ref.equipos;
      const precio = ref.precio;

      const supabase = getSupabaseServerClient();

      // Get plan_id
      const { data: plan } = await supabase
        .from('planes_subscription')
        .select('id')
        .eq('nombre', planName)
        .maybeSingle();

      if (!plan) {
        console.error('[MP Webhook] Plan not found:', planName);
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Update suscripcion
      const { data: existing } = await supabase
        .from('suscripciones')
        .select('id')
        .eq('empresa_id', empresaId)
        .maybeSingle();

      if (existing) {
        await supabase.from('suscripciones').update({
          plan_id: plan.id,
          equipos_max: equiposMax,
          clusters_ia_mes: clustersIaMes,
          precio,
          estado: 'activa',
          updated_at: new Date().toISOString(),
        }).eq('empresa_id', empresaId);
      } else {
        await supabase.from('suscripciones').insert({
          empresa_id: empresaId,
          plan_id: plan.id,
          equipos_max: equiposMax,
          clusters_ia_mes: clustersIaMes,
          precio,
          estado: 'activa',
          fecha_inicio: new Date().toISOString(),
        });
      }

      console.log(`[MP Webhook] Subscription activated: empresa=${empresaId} plan=${planName}`);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[MP Webhook] Error:', error);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
