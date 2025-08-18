// backend/routes/register.js
const express = require('express');
const { supabase } = require('../supabase/db');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const { SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY } = process.env;

router.post('/', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone_number } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'http://localhost:5173/auth/callback', data: { first_name, last_name, phone_number } }
    });
    if (error) return res.status(400).json({ error: error.message });
    res.status(202).json({ ok: true, needs_confirmation: true, user: { id: data.user.id, email: data.user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const userClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const { first_name, last_name, phone_number } = user.user_metadata || {};
    const { error: upsertErr } = await userClient.from('users').upsert({
      auth_user_id: user.id,
      email: user.email,
      first_name,
      last_name,
      phone_number,
      is_admin: false
    }, { onConflict: 'auth_user_id' });
    if (upsertErr) return res.status(400).json({ error: upsertErr.message });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
