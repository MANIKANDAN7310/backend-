import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { storage } from '../config/cloudinary.js';
import Product from '../models/Product.js';

const router = express.Router();
const upload = multer({ storage });

// Create Product
router.post('/', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'extraImages', maxCount: 3 },
  { name: 'file', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, description, price, originalPrice, category, tags } = req.body;
    
    const imageUrl = req.files['image'] ? req.files['image'][0].path : '';
    const extraImagesUrls = req.files['extraImages'] 
      ? req.files['extraImages'].map(f => f.path) 
      : [];
    const fileUrl = req.files['file'] ? req.files['file'][0].path : '';

    const newProduct = new Product({
      title,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
      tags,
      image: imageUrl,
      extraImages: extraImagesUrls,
      file: fileUrl,
    });

    await newProduct.save();
    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Product Analytics
router.get('/analytics/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Aggregate from purchases.json
    let purchases = [];
    try {
      purchases = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'purchases.json'), 'utf8'));
    } catch (e) {}

    const productPurchases = purchases.filter(p => p.productId === req.params.id);
    
    // Group by email for unique users
    const userMap = {};
    productPurchases.forEach(p => {
        const email = p.clientEmail || 'Anonymous';
        if (!userMap[email]) {
            userMap[email] = { email, count: 0, lastDownload: p.downloadedAt };
        }
        userMap[email].count += 1;
        if (new Date(p.downloadedAt) > new Date(userMap[email].lastDownload)) {
            userMap[email].lastDownload = p.downloadedAt;
        }
    });

    res.json({
      success: true,
      product,
      totalDownloads: product.downloads + productPurchases.length,
      users: Object.values(userMap)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Increment Download Count
router.post('/download/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
    res.json({ success: true, downloads: product.downloads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Product
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

