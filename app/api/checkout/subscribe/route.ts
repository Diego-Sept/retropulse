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

    const mpResponse = await fetch(`${MP_API}/preapproval`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: `RetroPulse — Plan ${selectedPlan.name}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: selectedPlan.amount,
          currency_id: 'ARS',
        },
        payer_email: authUser.email,
        back_url: `${appUrl}/dashboard/configuracion`,
        external_reference: JSON.stringify({
          empresa_id: authUser.empresa_id,
          plan,
          clusters: selectedPlan.clusters,
          equipos: selectedPlan.equipos,
          precio: selectedPlan.amount,
        }),
        status: 'pending',
      }),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('[MP Preapproval] Error:', JSON.stringify(data));
      return NextResponse.json(
        { error: data.message || data.error || 'Error al crear suscripción' },
        { status: mpResponse.status },
      );
    }

    return NextResponse.json({
      init_point: data.init_point,
      preapproval_id: data.id,
    });
  } catch (error: any) {
    console.error('[Checkout] Error:', error.message, error.stack);
    return NextResponse.json(
      { error: error.message || 'Error al crear suscripción' },
      { status: 500 },
    );
  }
}
