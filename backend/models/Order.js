import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  category: { type: String },
  fileName: { type: String },
  width: { type: String },
  height: { type: String },
  colors: { type: String },
  customDesignUrl: { type: String }, // Main custom design
  refFiles: [{ type: String }], // Reference files
  requirement: { type: String },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Order', orderSchema);
