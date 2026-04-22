import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dghzu6wlx',
  api_key: process.env.CLOUDINARY_API_KEY || '332843736632742',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'H8x-qTsT3H2xyyRhNNCFWyRVXuU',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'octoink_products',
    resource_type: 'auto'
  },
});

const upload = multer({ storage });

const app = express();
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file });
});

// also error handler
app.use((err, req, res, next) => {
  console.error("Multer error:", err);
  res.status(500).json({ error: err.message });
});

app.listen(3000, async () => {
  console.log('Server started');
  // run test
  try {
    const fd = new FormData();
    const blob = new Blob(['dummy zip content'], { type: 'application/zip' });
    fd.append('file', blob, 'test.zip');
    const res = await fetch('http://localhost:3000/upload', { method: 'POST', body: fd });
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
  process.exit(0);
});
