require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGES = [
  "/portfolio/embroidery_before.png",
  "/portfolio/embroidery_after.png",
  "/portfolio/vector_before.png",
  "/portfolio/vector_after.png",
  "/portfolio/pin_before.png",
  "/portfolio/pin_after.png"
];

const publicDir = path.join(__dirname, '../octoink/octoink/vite-project/public');

async function uploadToCloudinary(filePath) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { folder: 'octoink_portfolio' }, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });
  });
}

async function migrate() {
  try {
    for (const imagePath of IMAGES) {
      console.log(`Processing: ${imagePath}`);
      const filePath = path.join(publicDir, imagePath);
      
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        continue;
      }

      console.log(`Uploading ${filePath} to Cloudinary...`);
      const secureUrl = await uploadToCloudinary(filePath);
      console.log(`Uploaded! URL: ${secureUrl}`);
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

migrate();
