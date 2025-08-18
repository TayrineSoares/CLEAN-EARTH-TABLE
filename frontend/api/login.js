// backend/routes/login.js
const express = require('express');
const { supabase } = require('../supabase/db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    res.json({ user: data.user, session: data.session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/', async (req, res) => { // reset password
  const { email } = req.body;
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/update-password'
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Reset email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
