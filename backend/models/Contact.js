import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  service: String,
  message: { type: String, required: true }
}, { timestamps: true }); // adds createdAt & updatedAt

// Force collection name to "contacts"
export default mongoose.model('Contact', contactSchema, 'contacts');
