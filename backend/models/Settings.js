import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  isStoreEnabled: { type: Boolean, default: true },
  currency: { type: String, default: 'USD ($)' },
  adminEmail: { type: String, default: 'admin@octoink.com' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Settings', settingsSchema);
