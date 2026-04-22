import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dghzu6wlx',
  api_key: process.env.CLOUDINARY_API_KEY || '332843736632742',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'H8x-qTsT3H2xyyRhNNCFWyRVXuU',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Check if the file is the zip file payload
    const isZip = file.fieldname === 'file' && file.originalname.match(/\.zip$/i);
    
    return {
      folder: isZip ? 'octoink_products/zips' : 'octoink_products',
      resource_type: isZip ? 'raw' : 'auto',
    };
  },
});

const orderStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'octoink_custom_designs',
    resource_type: 'auto',
  },
});

export { cloudinary, storage, orderStorage };
