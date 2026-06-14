import express from 'express';
import fs from 'fs';
import path from 'path';
import Client from '../models/Client.js';
import Contact from '../models/Contact.js';
import Settings from '../models/Settings.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = express.Router();

// Stats Summary (supports ?month=6&year=2026)
router.get('/stats/summary', async (req, res) => {
  try {
    const now = new Date();
    const y = parseInt(req.query.year) || now.getFullYear();
    const m = req.query.month ? parseInt(req.query.month) - 1 : now.getMonth(); // convert 1-indexed to 0-indexed

    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);

    const [clients, orders, products] = await Promise.all([
      Client.find({ createdAt: { $gte: start, $lte: end } }),
      Order.find({ status: 'Paid', createdAt: { $gte: start, $lte: end } }),
      Product.find()
    ]);

    // Count downloads that occurred in the selected month
    const Download = (await import('../models/Download.js')).default;
    const CustomDesign = (await import('../models/CustomDesign.js')).default;

    const [downloads, designs] = await Promise.all([
      Download.find({ date: { $gte: start, $lte: end } }),
      CustomDesign.find({ createdAt: { $gte: start, $lte: end } })
    ]);

    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Unique clients from all sources
    const emails = new Set();
    orders.forEach(o => o.clientInfo?.email && emails.add(o.clientInfo.email.toLowerCase()));
    designs.forEach(d => d.email && emails.add(d.email.toLowerCase()));
    downloads.forEach(d => d.email && d.email !== 'Anonymous' && emails.add(d.email.toLowerCase()));

    res.json({
      success: true,
      totalClients: emails.size,
      totalOrders: downloads.length,
      customDesigns: designs.length,
      revenue: revenue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// All Months Detail (Historical Stats)
router.get('/stats/all-months-detail', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Mocking some historical data based on real data if available, or just aggregate
    const stats = await Promise.all(months.map(async (month, index) => {
      const monthIndex = index + 1;
      // In a real app, you'd filter by date range. 
      // For now, we'll return some data for the current year to make it look alive.
      const isCurrentMonth = index === new Date().getMonth() && year === new Date().getFullYear();
      
      if (isCurrentMonth) {
        const clients = await Client.find().limit(5);
        const products = await Product.find();
        const totalDownloads = products.reduce((sum, p) => sum + (p.downloads || 0), 0);
        const ordersCount = await Order.countDocuments();
        let purchases = [];
        try {
          purchases = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'purchases.json'), 'utf8'));
        } catch (e) {}
        const revenue = purchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        return {
          month,
          monthIndex,
          totalClients: await Client.countDocuments(),
          totalOrders: totalDownloads,
          customDesigns: ordersCount,
          revenue,
          clientList: clients.map(c => ({
            id: c._id,
            name: c.client_name || 'Anonymous',
            email: c.email,
            type: 'Customer'
          }))
        };
      }

      return {
        month,
        monthIndex,
        totalClients: 0,
        totalOrders: 0,
        customDesigns: 0,
        revenue: 0,
        clientList: []
      };
    }));

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { isStoreEnabled, currency, adminEmail } = req.body;
    let settings = await Settings.findOneAndUpdate({}, 
      { isStoreEnabled, currency, adminEmail, updatedAt: Date.now() }, 
      { new: true, upsert: true }
    );
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    if (clients.length === 0) {
        try {
            const jsonData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'clients.json'), 'utf8'));
            return res.json({ success: true, clients: jsonData });
        } catch (e) {}
    }
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Purchases (Enriched with Client Info)
router.get('/purchases', async (req, res) => {
  try {
    const jsonData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'purchases.json'), 'utf8'));
    
    // Fetch clients to map names/emails
    const clients = await Client.find();
    let clientJson = [];
    try {
        clientJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'clients.json'), 'utf8'));
    } catch (e) {}

    const enrichedPurchases = jsonData.map(p => {
        const client = clients.find(c => c._id.toString() === p.clientId) || 
                       clientJson.find(c => c._id === p.clientId);
        return {
            ...p,
            clientName: client ? client.client_name : 'Unknown',
            clientEmail: client ? client.email : 'N/A'
        };
    });

    res.json({ success: true, purchases: enrichedPurchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Contact/Mails
router.get('/contact', async (req, res) => {
  try {
    let messages = await Contact.find().sort({ createdAt: -1 });
    // If DB is empty, fall back to static JSON file
    if (!messages.length) {
      try {
        const jsonData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'contacts.json'), 'utf8'));
        messages = jsonData;
      } catch (e) {}
    }
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Contact (For main site)
router.post('/contact', async (req, res) => {
  try {
    const { name, email, service, message } = req.body;
    const newMessage = new Contact({ name, email, service, message });
    await newMessage.save();
    console.log('New contact message saved:', newMessage);
    res.status(201).json({ success: true, message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Contact
router.delete('/contact/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

