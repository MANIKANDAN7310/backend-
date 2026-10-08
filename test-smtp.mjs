import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

console.log('SMTP User:', smtpUser);
console.log('SMTP Pass:', smtpPass ? smtpPass.substring(0, 4) + '...' : 'NOT SET');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass }
});

transporter.verify((error, success) => {
    if (error) {
        console.log('❌ SMTP Error:', error.message);
        console.log('Full error:', error);
    } else {
        console.log('✅ SMTP Connected!');
    }
});
