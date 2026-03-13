const Stripe = require('stripe');

const PRICES = {
  pro:    process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_MAXIMUM,
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { plan, userId, email } = req.body;
    if (!PRICES[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const siteUrl = (process.env.SITE_URL || 'https://creator-flow-beryl.vercel.app').trim().replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      metadata: { userId, plan },
      success_url: `${siteUrl}/dashboard.html?upgraded=1`,
      cancel_url:  `${siteUrl}/dashboard.html`,
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
