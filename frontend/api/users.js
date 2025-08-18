// backend/routes/users.js
const express = require('express');
const { getAllUsers, getUserByAuthId, updateUserByAuthId } = require('../queries/user');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { id } = req.query;
    if (id) {
      const user = await getUserByAuthId(id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user);
    }
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const allowedFields = ['first_name','last_name','country','phone_number','is_admin','address_line1','address_line2','city','province','postal_code'];
    const updates = {};
    for (const key of allowedFields) if (req.body[key] !== undefined) updates[key] = req.body[key];
    const updatedUser = await updateUserByAuthId(req.params.id, updates);
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
