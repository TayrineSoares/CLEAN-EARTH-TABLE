// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase/db');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const { data, error } = await supabase.from('carts').select('*').eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { action, userId, productId, quantity } = req.body;

    switch (action) {
      case 'add': {
        const { data: existingItem, error: findErr } = await supabase
          .from('carts')
          .select('*')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .single();

        if (findErr && findErr.code !== 'PGRST116') return res.status(500).json({ error: findErr.message });

        if (existingItem) {
          const { error: updateErr } = await supabase
            .from('carts')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          return res.json({ message: 'Quantity updated' });
        }

        const { error: insertErr } = await supabase
          .from('carts')
          .insert([{ user_id: userId, product_id: productId, quantity }]);
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        return res.json({ message: 'Item added' });
      }

      case 'remove': {
        const { error } = await supabase.from('carts').delete().eq('user_id', userId).eq('product_id', productId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ message: 'Item removed' });
      }

      case 'update': {
        const { error } = await supabase
          .from('carts')
          .update({ quantity })
          .eq('user_id', userId)
          .eq('product_id', productId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ message: 'Quantity set' });
      }

      case 'clear': {
        const { error } = await supabase.from('carts').delete().eq('user_id', userId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ message: 'Cart cleared' });
      }

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
