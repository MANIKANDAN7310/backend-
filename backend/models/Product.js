import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String },
  tags: { type: String },
  image: { type: String }, // Cloudinary URL
  extraImages: [{ type: String }], // Cloudinary URLs
  file: { type: String }, // Cloudinary URL for digital asset
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Product', productSchema);
