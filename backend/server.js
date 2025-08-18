// server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const { createOrderWithProducts, getOrderByStripeSessionId } = require('./src/queries/order');
const { sendEmail } = require('./src/utils/email');
const { renderCustomerOrderEmail, renderOwnerOrderEmail } = require('./src/utils/emailTemplates');
const { getUserByAuthId } = require('./src/queries/user');

const categoriesRouter = require('./src/routes/categoriesRoutes');
const productsRouter = require('./src/routes/productsRoutes');
const ordersRouter = require('./src/routes/ordersRoutes');
const usersRouter = require('./src/routes/usersRoutes');
const loginRouter = require('./src/routes/loginRoutes');
const registerRouter = require('./src/routes/registerRoutes');
const logoutRouter = require('./src/routes/logoutRoutes');
const contactRouter = require('./src/routes/contactRoutes');
const tagsRouter = require('./src/routes/tagsRoutes');
const cartRouter = require('./src/routes/cartRoutes');
const testEmailRouter = require('./src/routes/testEmail');

require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_SK);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const app = express();
const PORT = process.env.PORT || 8080;

// ----------- MIDDLEWARE ----------- //
app.use(cors({
  origin: [
    'https://earth-table-2qzv2we1t-earth-table.vercel.app/',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// ----------- STRIPE WEBHOOK ----------- //
// Must be before express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const pickupDate = metadata.pickup_date || null;
      const pickupSlot = metadata.pickup_time_slot || null;
      const specialNote = metadata.special_note || null;
      const delivery = metadata.delivery || false;

      let buyerPhoneNumber = session.customer_details?.phone || null;
      const email =
        session.customer_email ||
        session.customer_details?.email ||
        metadata.email ||
        'unknown';
      const buyerName = session.customer_details?.name;
      const userId = metadata.userId || null;
      const cart = JSON.parse(metadata.cart || '[]');

      if (userId) {
        const user = await getUserByAuthId(userId);
        if (user) buyerPhoneNumber = user.phone_number || buyerPhoneNumber;
      }

      try {
        await createOrderWithProducts({
          user_id: userId || null,
          buyer_email: email,
          buyer_name: buyerName,
          buyer_phone_number: buyerPhoneNumber,
          buyer_stripe_payment_info: JSON.stringify({
            session_id: session.id,
            payment_intent: session.payment_intent,
            amount_total: session.amount_total,
            currency: session.currency,
            payment_status: session.payment_status,
            customer_name: session.customer_details?.name || '',
            customer_phone: session.customer_details?.phone || '',
            customer_address: session.customer_details?.address || {}
          }),
          status: session.payment_status,
          stripe_session_id: session.id,
          total_cents: session.amount_total,
          products: cart,
          pickup_date: pickupDate,
          pickup_time_slot: pickupSlot,
          delivery: delivery,
          special_note: specialNote,
        });

        const detailedOrder = await getOrderByStripeSessionId(session.id);

        // Email to customer
        const { subject, html, text } = renderCustomerOrderEmail(detailedOrder);
        await sendEmail({ to: email, subject, html, text, replyTo: 'hello@earthtableco.ca' });

        // Email to owner
        const ownerTo = (process.env.OWNER_NOTIFICATIONS_TO || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

        const ownerMsg = renderOwnerOrderEmail(detailedOrder);
        await sendEmail({ to: ownerTo, subject: ownerMsg.subject, html: ownerMsg.html, text: ownerMsg.text });

      } catch (err) {
        console.error("Failed to save order:", err.message);
      }
    } else {
      console.log(`Skipped event: ${event.type}`);
    }

    res.status(200).send();
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ----------- TEST ROUTES ----------- //
app.get('/', (req, res) => res.send('Backend is running'));

// ----------- STRIPE CHECKOUT ----------- //
app.post('/api/create-checkout-session', async (req, res) => {
  const { cartItems, email, userId, pickup_date, pickup_time_slot, special_note, delivery } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cartItems.map(item => ({
        price_data: {
          currency: 'cad',
          product_data: { name: `${item.slug} (includes tax)`, images: [item.image_url] },
          unit_amount: Math.round(item.price_cents * 1.13),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: 'http://localhost:5173/confirmation?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173/cart',
      ...(userId && email ? { customer_email: email } : {}),
      phone_number_collection: { enabled: true },
      metadata: {
        email: email || '',
        userId: userId || '',
        pickup_date: pickup_date || '',
        pickup_time_slot: pickup_time_slot || '',
        delivery: delivery || false,
        special_note: special_note || '',
        cart: JSON.stringify(cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price_cents: item.price_cents
        }))),
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation failed', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ----------- API ROUTES ----------- //
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);
app.use('/api/register', registerRouter);
app.use('/api/logout', logoutRouter);
app.use('/api/contact', contactRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/dev', testEmailRouter);

// ----------- START SERVER ----------- //
app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
