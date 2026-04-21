import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dghzu6wlx',
  api_key: process.env.CLOUDINARY_API_KEY || '332843736632742',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'H8x-qTsT3H2xyyRhNNCFWyRVXuU',
});

cloudinary.uploader.upload('test.zip', {
  folder: 'octoink_products',
  resource_type: 'auto',
  allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'zip', 'pdf', 'svg']
}).then(res => {
  console.log("Success:", res.secure_url);
}).catch(err => {
  console.error("Cloudinary Error:", err);
});
