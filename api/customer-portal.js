const Stripe = require('stripe');
const admin  = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const snap = await db.collection('users').doc(userId).get();
  const customerId = snap.data()?.stripeCustomerId;
  if (!customerId) return res.status(400).json({ error: 'No subscription found' });

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const siteUrl = (process.env.SITE_URL || 'https://creator-flow-beryl.vercel.app').trim().replace(/\/$/, '');

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl}/account.html`,
  });

  res.json({ url: session.url });
};
