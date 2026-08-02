import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body; // 'small_team' | 'enterprise'

    if (!plan || !['small_team', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: 'Configuración de pago no disponible' }, { status: 500 });
    }

    const plans: Record<string, { amount: number; name: string; clusters: number; equipos: number }> = {
      small_team: { amount: 15, name: 'Small Team', clusters: 30, equipos: 1 },
      enterprise: { amount: 49, name: 'Enterprise', clusters: 500, equipos: 10 },
    };

    const selectedPlan = plans[plan];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const client = new MercadoPagoConfig({ accessToken });

    const preapproval = new PreApproval(client);

    const result = await preapproval.create({
      body: {
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
      },
    });

    return NextResponse.json({
      init_point: result.init_point,
      preapproval_id: result.id,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear suscripción' },
      { status: 500 },
    );
  }
}
