// backend/routes/tags.js
const express = require('express');
const { getAllTags } = require('../src/queries/tags');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tags = await getAllTags();
    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
