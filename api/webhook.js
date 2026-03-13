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

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig    = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, plan } = session.metadata;
    if (userId && plan) {
      await db.collection('users').doc(userId).update({
        plan,
        stripeCustomerId: session.customer,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const snap = await db.collection('users').where('stripeCustomerId','==',sub.customer).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({ plan: 'free' });
    }
  }

  res.json({ received: true });
};
