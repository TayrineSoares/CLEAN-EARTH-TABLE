// backend/routes/orders.js
const express = require('express');
const {
  getAllOrders,
  getOrderById,
  getOrderByUserId,
  getOrderByStripeSessionId,
  setOrderPickedUp
} = require('../queries/order');
const { getProductsForOrder } = require('../queries/order_product');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { id, user, session, products, picked_up } = req.query;

    if (!id && !user && !session) {
      const allOrders = await getAllOrders();
      return res.json(allOrders);
    }

    if (session) {
      const order = await getOrderByStripeSessionId(session);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.json(order);
    }

    if (id && products === 'true') {
      const prods = await getProductsForOrder(id);
      return res.json(prods);
    }

    if (user) {
      const userOrders = await getOrderByUserId(user);
      return res.json(userOrders);
    }

    if (id && !products) {
      const order = await getOrderById(id);
      return res.json(order);
    }

    if (id && picked_up !== undefined) {
      const updated = await setOrderPickedUp(id, picked_up === 'true');
      return res.json(updated);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
