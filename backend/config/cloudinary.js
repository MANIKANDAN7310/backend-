import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: 'octoink',
  api_key: '332843736632742',
  api_secret: 'H8x-qTsT3H2xyyRhNNCFWyRVXuU',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'octoink_products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'zip', 'pdf', 'svg'],
    resource_type: 'auto',
  },
});

const orderStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'octoink_custom_designs',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

export { cloudinary, storage, orderStorage };
