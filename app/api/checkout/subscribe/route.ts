import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';

const MP_API = 'https://api.mercadopago.com';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !['small_team', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'Configuración de pago no disponible' }, { status: 500 });
    }

    const plans: Record<string, { amount: number; name: string; clusters: number; equipos: number }> = {
      small_team: { amount: 20000, name: 'Small Team', clusters: 30, equipos: 1 },
      enterprise: { amount: 100000, name: 'Enterprise', clusters: 500, equipos: 10 },
    };

    const selectedPlan = plans[plan];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Use Checkout Pro preference — reliable with test users
    const mpResponse = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          title: `RetroPulse — ${selectedPlan.name} (mensual)`,
          quantity: 1,
          unit_price: selectedPlan.amount,
          currency_id: 'ARS',
        }],
        payer: { email: authUser.email },
        back_urls: {
          success: `${appUrl}/dashboard/configuracion?status=success`,
          failure: `${appUrl}/dashboard/configuracion?status=failure`,
          pending: `${appUrl}/dashboard/configuracion?status=pending`,
        },
        auto_return: 'approved',
        external_reference: JSON.stringify({
          empresa_id: authUser.empresa_id,
          plan,
          clusters: selectedPlan.clusters,
          equipos: selectedPlan.equipos,
          precio: selectedPlan.amount,
        }),
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      }),
    });

    const responseText = await mpResponse.text();
    console.error('[MP Preference] Status:', mpResponse.status, 'Body:', responseText.substring(0, 500));

    let data: any;
    try { data = JSON.parse(responseText); } catch { data = {}; }

    if (!mpResponse.ok) {
      return NextResponse.json(
        { error: data.message || data.error || `Error MP: ${mpResponse.status}` },
        { status: 502 },
      );
    }

    return NextResponse.json({
      init_point: data.init_point || data.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('[Checkout] Error:', error.message);
    return NextResponse.json({ error: 'Error al crear preferencia' }, { status: 500 });
  }
}
