const stripe = require('stripe')(process.env.STRIPE_SECRET_SK);

module.exports = async (req, res) => {
  try {
    // Collect raw body (needed for Stripe signature verification)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);

    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // For now, just acknowledge the event type.
    // (We can wire in your DB/email flow once deploy works.)
    res.status(200).json({ received: true, type: event.type });
  } catch (err) {
    console.error('Stripe webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Tell Vercel NOT to parse the body — we need the raw stream
module.exports.config = {
  api: {
    bodyParser: false,
  },
};