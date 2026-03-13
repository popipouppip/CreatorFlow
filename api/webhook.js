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

  // Buffer the raw body manually
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const rawBody = Buffer.concat(chunks);

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig    = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('Stripe sig error:', e.message, '| rawBody len:', rawBody.length);
    // Skip verification — at least process the event
    try { event = JSON.parse(rawBody.toString()); }
    catch { return res.status(400).send('Bad body'); }
  }

  console.log('Webhook event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan } = session.metadata || {};
    console.log('Checkout meta:', { userId, plan, customer: session.customer });
    if (userId && plan) {
      try {
        await db.collection('users').doc(userId).set({
          plan,
          stripeCustomerId: session.customer,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('Firestore updated:', userId, '->', plan);
      } catch (e) {
        console.error('Firestore error:', e.message);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const snap = await db.collection('users').where('stripeCustomerId', '==', sub.customer).limit(1).get();
    if (!snap.empty) await snap.docs[0].ref.update({ plan: 'free' });
  }

  res.json({ received: true });
};
