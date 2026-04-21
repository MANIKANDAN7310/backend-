import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function findCloudName() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const data = await mongoose.connection.db.collection(col.name).find({}).toArray();
            for (const doc of data) {
                const values = Object.values(doc);
                for (const val of values) {
                    if (typeof val === 'string' && val.includes('cloudinary.com')) {
                        console.log(`FOUND Cloudinary URL in ${col.name}: ${val}`);
                        return;
                    }
                }
            }
        }
        console.log("No Cloudinary URLs found in database.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

findCloudName();
