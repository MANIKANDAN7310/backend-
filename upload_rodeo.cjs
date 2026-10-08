require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGES = [
  "C:\\Users\\MANIKANDAN\\.gemini\\antigravity-ide\\brain\\acbc4d10-ff99-4f14-94eb-ef9b2743a049\\media__1784479084427.jpg",
  "C:\\Users\\MANIKANDAN\\.gemini\\antigravity-ide\\brain\\acbc4d10-ff99-4f14-94eb-ef9b2743a049\\media__1784479084433.jpg"
];

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
    for (const filePath of IMAGES) {
      console.log(`Processing: ${filePath}`);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        continue;
      }
      console.log(`Uploading ${filePath} to Cloudinary...`);
      const secureUrl = await uploadToCloudinary(filePath);
      console.log(`Uploaded! URL: ${secureUrl}`);
    }
  } catch (err) {
    console.error("Migration error:", err);
  }
}

migrate();
