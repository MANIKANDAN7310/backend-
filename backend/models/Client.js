import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  client_name: { type: String, required: true },
  company_name: String,
  location: String,
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Client', clientSchema);
