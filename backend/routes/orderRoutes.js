import express from 'express';
import multer from 'multer';
import { orderStorage } from '../config/cloudinary.js';
import Order from '../models/Order.js';

const router = express.Router();
const upload = multer({ storage: orderStorage });

// Create Order (with custom design)
router.post('/', upload.fields([
  { name: 'customDesign', maxCount: 1 },
  { name: 'refFiles', maxCount: 5 }
]), async (req, res) => {
  try {
    const { email, category, fileName, width, height, colors, requirement } = req.body;
    
    const customDesignUrl = req.files['customDesign'] ? req.files['customDesign'][0].path : '';
    const refFilesUrls = req.files['refFiles'] 
      ? req.files['refFiles'].map(f => f.path) 
      : [];

    const newOrder = new Order({
      email,
      category,
      fileName,
      width,
      height,
      colors,
      requirement,
      customDesignUrl,
      refFiles: refFilesUrls,
    });

    await newOrder.save();
    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// New endpoint: Get only custom design orders (where customDesignUrl is set)
router.get('/custom-designs', async (req, res) => {
  try {
    const customOrders = await Order.find({ customDesignUrl: { $exists: true, $ne: '' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, orders: customOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Order
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
