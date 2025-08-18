// backend/routes/categories.js
const express = require('express');
const multer = require('multer');
const {
  getAllCategories,
  getHomepageCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage
} = require('../src/queries/category');

const router = express.Router();
const upload = multer(); // memory storage

router.get('/', async (req, res) => {
  try {
    if (req.query.homepage === 'true') {
      const homepageCategories = await getHomepageCategories();
      return res.json(homepageCategories);
    }
    const categories = await getAllCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, image_url, description, show_on_homepage } = req.body;
    const newCategory = await createCategory({ name, image_url, description, show_on_homepage });
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updated = await updateCategory(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteCategory(req.params.id);
    res.json({ message: `Category ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = await uploadCategoryImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
