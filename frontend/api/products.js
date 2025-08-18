// backend/routes/products.js
const express = require('express');
const multer = require('multer');
const {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  deleteProductById,
  updateProductById,
  uploadProductImage,
  updateProductTags,
  getProductTags,
  setProductActive
} = require('../src/queries/product');

const router = express.Router();
const upload = multer();

router.get('/', async (req, res) => {
  try {
    const { id, category, tags, archive } = req.query;

    if (!id && !category) {
      const products = await getAllProducts();
      return res.json(products);
    }

    if (id && !category && !tags) {
      const product = await getProductById(id);
      return res.json(product);
    }

    if (category) {
      const products = await getProductsByCategory(category);
      return res.json(products);
    }

    if (id && tags === 'true') {
      const tagIds = await getProductTags(parseInt(id));
      return res.json({ tag_ids: tagIds });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { slug, description, price_cents, image_url, category_id, is_available, tag_ids = [] } = req.body;
    const newProduct = await createProduct({ slug, description, price_cents, image_url, category_id, is_available, tag_ids });
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/tags', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { tag_ids } = req.body;
    if (!Array.isArray(tag_ids)) return res.status(400).json({ error: 'tag_ids must be an array' });
    await updateProductTags(productId, tag_ids);
    res.json({ message: 'Tags updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { archive, tag_ids = [], ...updatedData } = req.body;
    if (archive !== undefined) {
      const product = await setProductActive(parseInt(req.params.id), updatedData.active);
      return res.json({ message: product.is_active ? 'Product unarchived' : 'Product archived', product });
    }

    const updatedProduct = await updateProductById(req.params.id, updatedData);
    await updateProductTags(req.params.id, tag_ids);
    const updatedTags = await getProductTags(req.params.id);
    res.json({ ...updatedProduct, tag_ids: updatedTags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
