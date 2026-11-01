import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { priceId, groupId, plan } = await request.json();

    if (!priceId || !groupId || !plan) {
      return NextResponse.json({ error: "Preencha os campos obrigatórios" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      locale: 'pt-BR',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/admin/dashboard?payment=success&plan=${plan}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/?payment=cancelled`,
      metadata: { groupId, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento" }, { status: 500 });
  }
}
