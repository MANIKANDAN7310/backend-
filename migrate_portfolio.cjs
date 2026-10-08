require('dotenv').config();
const { MongoClient } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const FALLBACK_PORTFOLIO = [
  { id: 1, category: "Embroidery Design", image: "/portfolio/emb1.webp", title: "Custom Embroidery" },
  { id: 2, category: "Enamel Pin Collection", image: "/portfolio/91SPgUm6UEL._AC_UY1100_.webp", title: "Custom Pins" },
  { id: 3, category: "Medals Design", image: "/portfolio/die-cast-medals.webp", title: "Custom Medals" },
  { id: 4, category: "Coins Design", image: "/portfolio/coinimage1.webp", title: "Custom Coins" },
  { id: 5, category: "Vector Art and Poster", image: "/portfolio/vector3.webp", title: "Vector Illustration" },
  { id: 6, category: "Embroidery Design", image: "/portfolio/applique.webp", title: "Applique" },
  { id: 7, category: "Enamel Pin Collection", image: "/portfolio/pin2.webp", title: "Custom Pins" },
  { id: 8, category: "Enamel Pin Collection", image: "/portfolio/soft-vs-hard.webp", title: "Soft vs Hard" },
  { id: 9, category: "Vector Art and Poster", image: "/portfolio/vector2.webp", title: "Vector Art" },
  { id: 10, category: "Medals Design", image: "/portfolio/1754917181858.webp", title: "Running Medals" },
  { id: 11, category: "Medals Design", image: "/portfolio/Ornanment2.webp", title: "Custom Ornament" },
  { id: 12, category: "Coins Design", image: "/portfolio/coinimage2.webp", title: "Commemorative Coin" },
  { id: 13, category: "Coins Design", image: "/portfolio/coinimage3.webp", title: "Commemorative Coin" },
  { id: 14, category: "Embroidery Design", image: "/portfolio/emb2.webp", title: "Anime Embroidery" },
  { id: 15, category: "Vector Art and Poster", image: "/portfolio/poster.webp", title: "Poster Design" },
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
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const portfolios = db.collection('portfolios');

    // Clear existing portfolios just in case
    await portfolios.deleteMany({});

    for (const item of FALLBACK_PORTFOLIO) {
      console.log(`Processing: ${item.title}`);
      const filePath = path.join(publicDir, item.image);
      
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        continue;
      }

      console.log(`Uploading ${filePath} to Cloudinary...`);
      const secureUrl = await uploadToCloudinary(filePath);
      console.log(`Uploaded! URL: ${secureUrl}`);

      const doc = {
        title: item.title,
        category: item.category,
        image: secureUrl,
        order: item.id,
        createdAt: new Date()
      };

      await portfolios.insertOne(doc);
      console.log(`Inserted into MongoDB: ${item.title}`);
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.close();
  }
}

migrate();
