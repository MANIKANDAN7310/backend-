import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dns from "dns";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import crypto from "crypto";
import imapSimple from "imap-simple";
import { simpleParser } from "mailparser";


// Forcing Google DNS to resolve MongoDB and Gmail hostnames more reliably
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnvPath = path.join(__dirname, "../.env");
const srcEnvPath = path.join(__dirname, ".env");
if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
} else {
    dotenv.config({ path: srcEnvPath });
}

const app = express();
const PORT = process.env.PORT || 4999;

app.use(cors());
app.use(express.json());
app.use("/uploads/images", cors(), express.static(path.join(__dirname, "uploads/images"), {
    maxAge: '7d',
    immutable: true,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    }
}));
app.use("/uploads/files", cors(), express.static(path.join(__dirname, "uploads/files"), {
    setHeaders: (res) => {
        res.setHeader('Content-Disposition', 'attachment');
    }
}));

// ── Razorpay Instance ─────────────────────────────────────
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy_key_id",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret",
});

// ── MongoDB ───────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Error:", err));

// ── Product Schema ────────────────────────────────────────
const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    description: { type: String },
    tags: { type: String },
    image: { type: String },
    extraImages: [{ type: String }],
    file: { type: String },
    downloads: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});
const Product = mongoose.model("Product", productSchema);

// ── Banner Schema ─────────────────────────────────────────
const bannerSchema = new mongoose.Schema({
    imageUrl: { type: String },
    image: { type: String },
    heading: { type: String, required: true },
    subHeading: { type: String },
    description: { type: String },
    button1Text: { type: String },
    button1Link: { type: String },
    button2Text: { type: String },
    button2Link: { type: String },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});
const Banner = mongoose.model("Banner", bannerSchema);

// ── CustomDesign Schema ───────────────────────────────────
const customDesignSchema = new mongoose.Schema({
    email: { type: String, required: true },
    fileName: { type: String },
    category: { type: String },
    width: { type: String },
    height: { type: String },
    colors: { type: String },
    requirement: { type: String },
    designFile: { type: String },
    designFileOriginalName: { type: String },
    customDesignUrl: { type: String },
    refFiles: [{ path: String, originalName: String }],
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now },
});
const CustomDesign = mongoose.model("CustomDesign", customDesignSchema);

// ── Contact Schema (NEW) ──────────────────────────────────
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    service: { type: String },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.model("Contact", contactSchema);

// ── User Schema ───────────────────────────────────────────
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    downloadHistory: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            productTitle: String,
            downloadedAt: { type: Date, default: Date.now },
            paymentId: { type: String }, // For uniqueness
        },
    ],
    createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

// ── Order Schema ──────────────────────────────────────────
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            title: String,
            quantity: { type: Number, default: 1 },
            price: Number,
        },
    ],
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    status: { type: String, default: "Pending" },
    orderType: { type: String, default: "Product" },
    clientInfo: {
        name: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        country: String,
        companyName: String,
    },
    customDesignId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomDesign" },
    createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema);

// ── Download Schema (NEW - for tracking) ──────────────────
const downloadSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    email: { type: String },
    productName: { type: String },
    category: { type: String },
    price: { type: Number },
    downloadsCount: { type: Number, default: 1 },
    date: { type: Date, default: Date.now },
    fileUrl: { type: String },
    productImage: { type: String },
    isCustomOrder: { type: Boolean, default: false },
    paymentId: { type: String }, // For uniqueness logic
});
const Download = mongoose.model("Download", downloadSchema);

// ── Client Schema (NEW - for dashboard tracking) ──────────
const clientSchema = new mongoose.Schema({
    client_name: { type: String },
    company_name: { type: String, default: "N/A" },
    location: { type: String, default: "N/A" },
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});
const Client = mongoose.model("Client", clientSchema);

// ── Settings Schema (NEW) ─────────────────────────────────
const settingsSchema = new mongoose.Schema({
    isStoreEnabled: { type: Boolean, default: true },
    currency: { type: String, default: "USD ($)" },
    updatedAt: { type: Date, default: Date.now },
});
const Settings = mongoose.model("Settings", settingsSchema);

// ── Email Outreach Schemas ───────────────────────────────
const emailClientSchema = new mongoose.Schema({
    email: { type: String, required: true },
    name: { type: String },
    company: { type: String },
    service: { type: String },
    status: { type: String, enum: ['Pending', 'Sending', 'Sent', 'Failed', 'Opened', 'Clicked', 'Replied', 'Unsubscribed', 'Already Sent', 'Already Contacted', 'New', 'Contacted'], default: 'Pending' },
    lastEmailSent: { type: Date },
    opened: { type: Boolean, default: false },
    clicked: { type: Boolean, default: false },
    replied: { type: Boolean, default: false },
    nextFollowUp: { type: Date },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign' },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    followUpStatus: { type: String, enum: ['active', 'stopped', 'Stopped — Replied'], default: 'active' },
    sortOrder: { type: Number },
    createdAt: { type: Date, default: Date.now },
    sentFrom: { type: String }
});
emailClientSchema.index({ campaignId: 1, email: 1 }, { unique: true });
const EmailClient = mongoose.model("EmailClient", emailClientSchema);
// Programmatically drop old global index on email if it exists
EmailClient.collection.dropIndex("email_1").catch(() => {});

const emailCampaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String },
    body: { type: String },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmailClient' }],
    attachments: [{ type: String }],
    scheduleType: { type: String, enum: ['Immediate', 'Scheduled'], default: 'Immediate' },
    scheduledTime: { type: Date },
    status: { type: String, enum: ['Draft', 'Scheduled', 'Running', 'Completed', 'Paused', 'Failed'], default: 'Draft' },
    followUpSettings: [{
        delayDays: { type: Number },
        subject: { type: String },
        body: { type: String }
    }],
    createdAt: { type: Date, default: Date.now }
});
const EmailCampaign = mongoose.model("EmailCampaign", emailCampaignSchema);

const sentEmailSchema = new mongoose.Schema({
    recipient: { type: String, required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailClient' },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign' },
    subject: { type: String },
    body: { type: String },
    messageId: { type: String }, // For reply tracking
    sentTime: { type: Date, default: Date.now },
    deliveryStatus: { type: String, enum: ['Sent', 'Delivered', 'Bounced', 'Failed'], default: 'Sent' },
    openStatus: { type: Boolean, default: false },
    clickStatus: { type: Boolean, default: false },
    replyStatus: { type: Boolean, default: false },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    repliedAt: { type: Date },
    
    // New fields for outbound email requirement
    recipientEmail: { type: String },
    recipientName: { type: String },
    normalizedEmail: { type: String },
    status: { type: String, enum: ['Pending', 'Sending', 'Sent', 'Failed', 'Opened', 'Clicked', 'Replied', 'Unsubscribed'], default: 'Pending' },
    sentAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    error: { type: String },
    step: { type: Number, default: 0 }
});
sentEmailSchema.index({ campaignId: 1, normalizedEmail: 1, step: 1 }, { unique: true });
const SentEmail = mongoose.model("SentEmail", sentEmailSchema);

const emailEventSchema = new mongoose.Schema({
    sentEmailId: { type: mongoose.Schema.Types.ObjectId, ref: 'SentEmail' },
    eventType: { type: String, enum: ['Open', 'Click', 'Bounce', 'Delivery'] },
    url: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
});
const EmailEvent = mongoose.model("EmailEvent", emailEventSchema);

const emailReplySchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailClient' },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign' },
    sentEmailId: { type: mongoose.Schema.Types.ObjectId, ref: 'SentEmail' },
    subject: { type: String },
    body: { type: String },
    sender: { type: String },
    messageId: { type: String },
    replyDate: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});
const EmailReply = mongoose.model("EmailReply", emailReplySchema);

const emailFollowUpSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailClient' },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign' },
    step: { type: Number },
    subject: { type: String },
    body: { type: String },
    sendAt: { type: Date },
    status: { type: String, enum: ['Scheduled', 'Waiting', 'Sent', 'Paused', 'Cancelled', 'Stopped — Replied', 'Completed'], default: 'Scheduled' },
    sentEmailId: { type: mongoose.Schema.Types.ObjectId, ref: 'SentEmail' },
    createdAt: { type: Date, default: Date.now }
});
const EmailFollowUp = mongoose.model("EmailFollowUp", emailFollowUpSchema);

const emailTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String },
    body: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);

const emailSettingsSchema = new mongoose.Schema({
    senderName: { type: String, default: 'Octoink Studios' },
    senderEmail: { type: String, default: '' },
    replyTo: { type: String, default: '' },
    dailyLimit: { type: Number, default: 500 },
    trackingEnabled: { type: Boolean, default: true },
    defaultFollowUpDelay: { type: Number, default: 2 },
    timezone: { type: String, default: 'Asia/Kolkata' },
    sendingSchedule: {
        days: [{ type: Number }], // 0-6 for Sunday-Saturday
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '18:00' }
    }
});
const EmailSettings = mongoose.model("EmailSettings", emailSettingsSchema);

const initializeDefaultTemplates = async () => {
    try {
        const outreachTemplate = await EmailTemplate.findOne({ name: "Default Outreach Template" });
        if (!outreachTemplate) {
            await new EmailTemplate({
                name: "Default Outreach Template",
                subject: "Hi {{name}}, checking in from Octoink Studios",
                body: `<p>Hi {{name}},</p>\n<p>I hope you are doing well.</p>\n<p>We wanted to reach out regarding our embroidery services. Please let us know if you would be interested in learning more.</p>\n<p>Best regards,<br/>Octoink Studios</p>`
            }).save();
            console.log("Initialized Default Outreach Template");
        }

        const followupTemplate = await EmailTemplate.findOne({ name: "Default Follow-up Template" });
        if (!followupTemplate) {
            await new EmailTemplate({
                name: "Default Follow-up Template",
                subject: "Re: Checking in - Octoink Studios",
                body: `<p>Hi {{name}},</p>\n<p>Just checking in to see if you had a chance to read my previous email.</p>\n<p>Would love to chat if you have a few minutes this week.</p>\n<p>Best regards,<br/>Octoink Studios</p>`
            }).save();
            console.log("Initialized Default Follow-up Template");
        }
    } catch (err) {
        console.error("Error initializing default templates:", err);
    }
};

mongoose.connection.on('connected', () => {
    initializeDefaultTemplates();
});
if (mongoose.connection.readyState === 1) {
    initializeDefaultTemplates();
}


// ── Middlewares ──────────────────────────────────────────
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ success: false, message: "Invalid token" });
    }
};

const checkStoreStatus = async (req, res, next) => {
    try {
        const settings = await Settings.findOne();
        if (settings && settings.isStoreEnabled === false) {
            return res.status(503).json({ success: false, message: "Store is currently unavailable", isStoreDisabled: true });
        }
        next();
    } catch (err) {
        next();
    }
};

// ── Multer Storage ────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isImage = file.mimetype.startsWith("image");
        const folder = isImage ? "uploads/images" : "uploads/files";
        fs.mkdirSync(path.join(__dirname, folder), { recursive: true });
        cb(null, path.join(__dirname, folder));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// ── PRODUCT ROUTES ────────────────────────────────────────
app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/products",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "extraImages", maxCount: 3 },
        { name: "file", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { title, category, price, originalPrice, description, tags } = req.body;
            const imagePath = req.files?.image?.[0] ? "uploads/images/" + req.files.image[0].filename : "";
            const extraImagePaths = (req.files?.extraImages || []).map(f => "uploads/images/" + f.filename);
            const filePath = req.files?.file?.[0] ? "uploads/files/" + req.files.file[0].filename : "";
            const product = new Product({ title, category, price, originalPrice, description, tags, image: imagePath, extraImages: extraImagePaths, file: filePath });
            await product.save();
            res.status(201).json({ success: true, product });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
);

app.put("/api/products/:id",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "extraImages", maxCount: 3 },
        { name: "file", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const updates = { ...req.body };
            if (req.files?.image?.[0]) updates.image = "uploads/images/" + req.files.image[0].filename;
            if (req.files?.extraImages) updates.extraImages = req.files.extraImages.map(f => "uploads/images/" + f.filename);
            if (req.files?.file?.[0]) updates.file = "uploads/files/" + req.files.file[0].filename;
            const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
            if (!product) return res.status(404).json({ success: false, message: "Not found" });
            res.json({ success: true, product });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
);

app.delete("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.patch("/api/products/:id/download", async (req, res) => {
    try {
        const { email, paymentId } = req.body;
        const productId = req.params.id;

        // Check if there is already a download record with this paymentId and productId to prevent duplication
        if (paymentId) {
            const existingDownload = await Download.findOne({ productId, paymentId });
            if (existingDownload) {
                return res.json({ success: true, message: "Download already recorded", downloads: 0 }); // We don't increment again
            }
        }

        const product = await Product.findByIdAndUpdate(productId, { $inc: { downloads: 1 } }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        
        // Record detailed download log
        const downloadRecord = new Download({
            productId: product._id,
            email: email || "Anonymous",
            productName: product.title,
            category: product.category,
            price: product.price,
            fileUrl: product.file,
            productImage: product.image,
            paymentId: paymentId || null,
        });
        await downloadRecord.save();

        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Add to history only if it's not already there with the same paymentId
                const user = await User.findById(decoded.id);
                const alreadyInHistory = user.downloadHistory.some(d => 
                    d.productId.toString() === productId && d.paymentId === paymentId
                );

                if (!alreadyInHistory) {
                    await User.findByIdAndUpdate(decoded.id, {
                        $push: {
                            downloadHistory: {
                                productId: product._id,
                                productTitle: product.title,
                                downloadedAt: new Date(),
                                paymentId: paymentId || null,
                            },
                        },
                    });
                }
            } catch (err) {
                console.log("Token verification failed in download route:", err.message);
            }
        }
        res.json({ success: true, downloads: product.downloads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Alias for dashboard frontend (POST instead of PATCH) - unified to prevent duplication
app.post("/api/products/download/:id", async (req, res) => {
    // Just reuse the same logic
    const { email, paymentId } = req.body;
    const productId = req.params.id;

    try {
        if (paymentId) {
            const existingDownload = await Download.findOne({ productId, paymentId });
            if (existingDownload) {
                return res.json({ success: true, message: "Already recorded", downloads: 0 });
            }
        }

        const product = await Product.findByIdAndUpdate(productId, { $inc: { downloads: 1 } }, { new: true });
        if (product) {
            const downloadRecord = new Download({
                productId: product._id,
                email: email || "Anonymous",
                productName: product.title,
                category: product.category,
                price: product.price,
                fileUrl: product.file,
                productImage: product.image,
                paymentId: paymentId || null,
            });
            await downloadRecord.save();
        }
        res.json({ success: true, downloads: product?.downloads || 0 });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── AUTH ROUTES ───────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ success: false, message: "All fields required" });
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ success: true, token, user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "User not found" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ success: true, token, user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/auth/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── BANNER ROUTES ─────────────────────────────────────────
app.get("/api/banners", async (req, res) => {
    try {
        let banners = await Banner.find().sort({ order: 1 });
        if (banners.length === 0) {
            const defaultBanners = [
                {
                    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwhGCCKhNF2OQSeM3i_HEHkcLVvXI4SDG_Ew&s",
                    heading: "Transform Your Brand", subHeading: "Stunning Custom Designs",
                    description: "Expert enamel pins, vector art, and embroidery design.",
                    button1Text: "Start Your Project", button1Link: "#services",
                    button2Text: "View Our Work", button2Link: "#portfolio", order: 1
                },
                {
                    imageUrl: "https://images-cdn.ubuy.co.in/63a34c27da9b6328f52b7822-benbo-9-pieces-cute-enamel-pins-set.jpg",
                    heading: "Premium Enamel Pins", subHeading: "Crafted with Precision",
                    description: "High-quality pins for every occasion.",
                    button1Text: "Order Now", button1Link: "#services",
                    button2Text: "Portfolio", button2Link: "#portfolio", order: 2
                }
            ];
            await Banner.insertMany(defaultBanners);
            banners = await Banner.find().sort({ order: 1 });
        }
        res.json({ success: true, banners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/banners",
    upload.fields([{ name: "image", maxCount: 1 }]),
    async (req, res) => {
        try {
            const { heading, mainHeading, subHeading, description, button1Text, button1Link, button2Text, button2Link, order } = req.body;
            const finalHeading = heading || mainHeading;
            if (!finalHeading) return res.status(400).json({ success: false, message: "Heading is required" });
            const imagePath = req.files?.image?.[0] ? "uploads/images/" + req.files.image[0].filename : "";
            const banner = new Banner({
                heading: finalHeading,
                subHeading, description, button1Text, button1Link, button2Text, button2Link,
                image: imagePath,
                order: order ?? 0,
            });
            await banner.save();
            res.status(201).json({ success: true, banner });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
);

app.put("/api/banners/reorder", async (req, res) => {
    try {
        const { banners } = req.body;
        const bulkOps = banners.map(b => ({
            updateOne: { filter: { _id: b._id }, update: { $set: { order: b.order } } }
        }));
        await Banner.bulkWrite(bulkOps);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put("/api/banners/:id",
    upload.fields([{ name: "image", maxCount: 1 }]),
    async (req, res) => {
        try {
            const { heading, mainHeading, subHeading, description, button1Text, button1Link, button2Text, button2Link } = req.body;
            const finalHeading = heading || mainHeading;
            const updates = { heading: finalHeading, subHeading, description, button1Text, button1Link, button2Text, button2Link };
            if (req.files?.image?.[0]) updates.image = "uploads/images/" + req.files.image[0].filename;
            const banner = await Banner.findByIdAndUpdate(req.params.id, updates, { new: true });
            if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
            res.json({ success: true, banner });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
);

app.delete("/api/banners/:id", async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── NODEMAILER ────────────────────────────────────────────
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
});

global.smtpConnectionStatus = 'Checking...';
global.smtpError = null;

transporter.verify((error) => {
    if (error) {
        console.log("❌ Nodemailer Error:", error);
        global.smtpConnectionStatus = 'Disconnected';
        global.smtpError = error.message;
    } else {
        console.log("✅ Nodemailer Ready");
        global.smtpConnectionStatus = 'Connected';
        global.smtpError = null;
    }
});

// ── CONTACT ROUTES ────────────────────────────────────────

// POST - save to MongoDB + send email
app.post("/api/contact", async (req, res) => {
    const { name, email, service, message } = req.body;
    if (!name || !email || !message)
        return res.status(400).json({ success: false, message: "Name, email, message required." });
    try {
        // Save to MongoDB
        const contact = new Contact({ name, email, service, message });
        await contact.save();

        // Send email
        await transporter.sendMail({
            from: `"Website Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `New Contact Message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nService: ${service || "N/A"}\n\nMessage:\n${message}`,
        });
        res.status(200).json({ success: true, message: "Message sent!" });
    } catch (error) {
        console.error("❌ Email Error:", error);
        res.status(500).json({ success: false, message: "Failed to send." });
    }
});

// GET - all contact messages for dashboard
app.get("/api/contact", async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE ALL - contact messages
app.delete("/api/contact/delete-all", async (req, res) => {
    try {
        await Contact.deleteMany({});
        res.json({ success: true, message: "All contact messages deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE - a contact message
app.delete("/api/contact/:id", async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── CUSTOM DESIGN ROUTE ───────────────────────────────────
app.post("/api/custom-design",
    upload.fields([
        { name: "file", maxCount: 1 },
        { name: "refFiles", maxCount: 10 }
    ]),
    async (req, res) => {
        try {
            const { fileName, category, width, height, colors, requirement, email } = req.body;
            if (!email) return res.status(400).json({ success: false, message: "Email is required." });

            const designFileData = req.files?.file?.[0]
                ? { path: "uploads/images/" + req.files.file[0].filename, originalName: req.files.file[0].originalname }
                : null;
            const refFilesData = (req.files?.refFiles || []).map(f => ({
                path: f.mimetype.startsWith("image") ? "uploads/images/" + f.filename : "uploads/files/" + f.filename,
                originalName: f.originalname,
            }));

            const newOrder = new CustomDesign({
                email,
                fileName: fileName || designFileData?.originalName || "N/A",
                category: category || "N/A",
                width: width || "N/A",
                height: height || "N/A",
                colors: colors || "N/A",
                requirement: requirement || "",
                designFile: designFileData?.path || "",
                designFileOriginalName: designFileData?.originalName || "",
                refFiles: refFilesData,
            });
            await newOrder.save();

            // Send email notification immediately (Payment no longer mandatory)
            try {
                let attachments = [];
                if (designFileData) {
                    attachments.push({ filename: designFileData.originalName || "design", path: path.join(__dirname, designFileData.path) });
                }
                if (refFilesData && refFilesData.length > 0) {
                    refFilesData.forEach(ref => {
                        attachments.push({ filename: ref.originalName, path: path.join(__dirname, ref.path) });
                    });
                }

                const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">New Custom Design Order</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Octoink Studio</p>
    </div>
    <div style="padding: 30px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; width: 40%; border-bottom: 1px solid #ede9fe;">From</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${email}</td>
        </tr>
        <tr style="background: #f8f5ff;">
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #ede9fe;">Category</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${category || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #ede9fe;">File Name</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${fileName || "N/A"}</td>
        </tr>
        <tr style="background: #f8f5ff;">
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #ede9fe;">Size</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${width || "N/A"} × ${height || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #ede9fe;">Colors</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${colors || "N/A"}</td>
        </tr>
      </table>
      ${requirement ? `<div style="margin-top: 24px; padding: 16px; background: #f8f5ff; border-left: 4px solid #7c3aed; border-radius: 4px;"><p style="font-weight: bold; color: #7c3aed; margin: 0 0 8px;">Requirements:</p><p style="margin: 0; color: #333; line-height: 1.6;">${requirement}</p></div>` : ""}
      ${attachments.length > 0 ? `<div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;"><p style="font-weight: bold; color: #16a34a; margin: 0 0 8px;">📎 ${attachments.length} file(s) attached</p>${attachments.map(a => `<p style="margin: 4px 0; color: #555; font-size: 14px;">• ${a.filename}</p>`).join("")}</div>` : ""}
    </div>
    <div style="background: #f8f5ff; padding: 16px; text-align: center;">
      <p style="margin: 0; color: #888; font-size: 12px;">This is an automated notification from Octoink Studio</p>
    </div>
  </div>
</body>
</html>`;

                await transporter.sendMail({
                    from: `"Octoink Orders" <${process.env.EMAIL_USER}>`,
                    to: process.env.EMAIL_USER,
                    subject: `🎨 NEW: ${category || "Custom"} Design from ${email}`,
                    html: htmlBody,
                    attachments,
                });
            } catch (emailErr) {
                console.error("❌ Email sending failed for custom design submission:", emailErr);
                // We still treat the submission as success since it's saved to DB
            }

            res.status(200).json({ success: true, message: "Custom design submitted successfully!", customDesignId: newOrder._id });
        } catch (error) {
            console.error("❌ Custom Design Error:", error);
            res.status(500).json({ success: false, message: "Failed to submit custom design." });
        }
    }
);

// ── PAYMENT ROUTES ────────────────────────────────────────
app.post("/api/payment/create-order", async (req, res) => {
    console.log("POST /api/payment/create-order - Body:", req.body);
    try {
        const { amount, currency, items, clientInfo, orderType, customDesignId } = req.body;

        const options = {
            amount: Math.round(amount * 100), // convert to paisa
            currency: "INR", // ALWAYS process in INR
            receipt: `receipt_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Save order to database as Pending
        const newOrder = new Order({
            items,
            totalAmount: amount,
            currency: options.currency,
            razorpayOrderId: razorpayOrder.id,
            status: "Pending",
            orderType: orderType || "Product",
            clientInfo,
            customDesignId
        });

        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                newOrder.userId = decoded.id;
            } catch (err) {
                console.log("Token verification failed in create-order:", err.message);
            }
        }

        await newOrder.save();

        res.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });
    } catch (err) {
        console.error("Razorpay Error:", err);
        res.status(500).json({ success: false, message: "Payment initialization failed." });
    }
});

app.post("/api/payment/verify", async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Update order status in DB
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                {
                    status: "Paid",
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                },
                { new: true }
            );

            // Upsert Client for tracking (from Dashboard logic)
            if (order && order.clientInfo && order.clientInfo.email) {
                const email = order.clientInfo.email.toLowerCase();
                await Client.findOneAndUpdate(
                    { email },
                    {
                        $set: {
                            client_name: order.clientInfo.name || email.split('@')[0],
                            company_name: order.clientInfo.companyName,
                            location: order.clientInfo.country || order.clientInfo.city || "N/A",
                        }
                    },
                    { upsert: true, new: true }
                );
            }

            const populatedOrder = await Order.findById(order._id).populate('items.productId').populate('customDesignId');

            // If it's a custom design, send email notification after payment success
            if (populatedOrder.orderType === "Custom" && populatedOrder.customDesignId) {
                const cd = populatedOrder.customDesignId;
                let attachments = [];
                if (cd.designFile) {
                    attachments.push({ filename: cd.designFileOriginalName || "design", path: path.join(__dirname, cd.designFile) });
                }
                if (cd.refFiles && cd.refFiles.length > 0) {
                    cd.refFiles.forEach(ref => {
                        attachments.push({ filename: ref.originalName, path: path.join(__dirname, ref.path) });
                    });
                }

                const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">New Custom Design Order (Paid)</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Octoink Studio</p>
    </div>
    <div style="padding: 30px;">
      <table style="width: 100%; border-collapse: collapse;">
         <tr style="background: #f8f5ff;">
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; width: 40%; border-bottom: 1px solid #ede9fe;">Payment ID</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${razorpay_payment_id}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; width: 40%; border-bottom: 1px solid #ede9fe;">From</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${cd.email}</td>
        </tr>
        <tr style="background: #f8f5ff;">
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #ede9fe;">Category</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${cd.category || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #ede9fe;">File Name</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${cd.fileName || "N/A"}</td>
        </tr>
        <tr style="background: #f8f5ff;">
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #ede9fe;">Size</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${cd.width || "N/A"} × ${cd.height || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #ede9fe;">Colors</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">${cd.colors || "N/A"}</td>
        </tr>
        <tr style="background: #f8f5ff;">
          <td style="padding: 12px 16px; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #ede9fe;">Paid Amount</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #ede9fe;">₹${order.totalAmount}</td>
        </tr>
      </table>
      ${cd.requirement ? `<div style="margin-top: 24px; padding: 16px; background: #f8f5ff; border-left: 4px solid #7c3aed; border-radius: 4px;"><p style="font-weight: bold; color: #7c3aed; margin: 0 0 8px;">Requirements:</p><p style="margin: 0; color: #333; line-height: 1.6;">${cd.requirement}</p></div>` : ""}
      ${attachments.length > 0 ? `<div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;"><p style="font-weight: bold; color: #16a34a; margin: 0 0 8px;">📎 ${attachments.length} file(s) attached</p>${attachments.map(a => `<p style="margin: 4px 0; color: #555; font-size: 14px;">• ${a.filename}</p>`).join("")}</div>` : ""}
    </div>
    <div style="background: #f8f5ff; padding: 16px; text-align: center;">
      <p style="margin: 0; color: #888; font-size: 12px;">This is an automated notification from Octoink Studio</p>
    </div>
  </div>
</body>
</html>`;

                await transporter.sendMail({
                    from: `"Octoink Orders" <${process.env.EMAIL_USER}>`,
                    to: process.env.EMAIL_USER,
                    subject: `💰 PAID: ${cd.category || "Custom"} Order from ${cd.email}`,
                    html: htmlBody,
                    attachments,
                });
            }

            res.json({ success: true, message: "Payment verified successfully", order: populatedOrder });
        } else {
            res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (err) {
        console.error("Verification Error:", err);
        res.status(500).json({ success: false, message: "Payment verification failed." });
    }
});

app.get("/api/custom-design", async (req, res) => {
    try {
        const orders = await CustomDesign.find().sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE ALL - custom designs
app.delete("/api/custom-design/delete-all", async (req, res) => {
    try {
        await CustomDesign.deleteMany({});
        res.json({ success: true, message: "All custom design orders deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete("/api/custom-design/:id", async (req, res) => {
    try {
        const order = await CustomDesign.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── ORDER ROUTES (for Custom Orders page) ─────────────────
// GET - All orders
app.get("/api/orders", async (req, res) => {
    try {
        const orders = await CustomDesign.find().sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET - Custom design orders only
app.get("/api/orders/custom-designs", async (req, res) => {
    try {
        const orders = await CustomDesign.find().sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE ALL - orders (custom designs)
app.delete("/api/orders/delete-all", async (req, res) => {
    try {
        await CustomDesign.deleteMany({});
        res.json({ success: true, message: "All custom design orders deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT - Update order status
app.put("/api/orders/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const order = await CustomDesign.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE - Single order
app.delete("/api/orders/:id", async (req, res) => {
    try {
        const order = await CustomDesign.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        res.json({ success: true, message: "Order deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/purchases", async (req, res) => {
    try {
        const paidOrders = await Order.find({ status: "Paid" }).sort({ createdAt: -1 });
        const enrichedPurchases = paidOrders.map(o => ({
            id: o._id,
            productName: o.items.map(i => i.title).join(", "),
            clientName: o.clientInfo?.name || "Unknown",
            clientEmail: o.clientInfo?.email || "N/A",
            amount: o.totalAmount,
            paymentId: o.razorpayPaymentId,
            downloadedAt: o.createdAt
        }));
        res.json({ success: true, purchases: enrichedPurchases });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete("/api/purchases/delete-all", async (req, res) => {
    try {
        await Order.deleteMany({ status: "Paid" });
        res.json({ success: true, message: "All purchase data deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── DASHBOARD & ANALYTICS ROUTES (PORTED) ─────────────────

// GET - All detailed downloads with optional month/year filter
app.get("/api/downloads", async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = {};
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }
        const downloads = await Download.find(query).sort({ date: -1 });
        res.json({ success: true, downloads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET - Enriched download history with client info
app.get("/api/downloads/history", async (req, res) => {
    try {
        const downloads = await Download.find().sort({ date: -1 });
        const clients = await Client.find();
        
        const enrichedDownloads = downloads.map(d => {
            let clientName = d.email ? d.email.split('@')[0] : "Anonymous";
            let companyName = "N/A";
            
            if (d.email && d.email !== "Anonymous") {
                const client = clients.find(c => c.email.toLowerCase() === d.email.toLowerCase());
                if (client) {
                    clientName = client.client_name;
                    companyName = client.company_name;
                }
            }

            return {
                ...d.toObject(),
                clientName,
                companyName
            };
        });

        res.json({ success: true, downloads: enrichedDownloads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET - Product specific analytics
app.get("/api/products/analytics/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const downloads = await Download.find({ productId: req.params.id });
        const paidOrders = await Order.find({ 
            "items.productId": req.params.id, 
            status: "Paid" 
        });

        const usersMap = new Map();

        // Process guest/regular downloads
        downloads.forEach(d => {
            const email = (d.email || "Anonymous").toLowerCase();
            const existing = usersMap.get(email);
            if (existing) {
                existing.count += 1;
                if (new Date(d.date) > new Date(existing.lastDownload)) {
                    existing.lastDownload = d.date;
                }
            } else {
                usersMap.set(email, {
                    email: d.email || "Anonymous",
                    count: 1,
                    lastDownload: d.date
                });
            }
        });

        // Process paid purchases
        paidOrders.forEach(o => {
            const email = (o.clientInfo?.email || "Anonymous").toLowerCase();
            const existing = usersMap.get(email);
            if (existing) {
                existing.count += 1;
                if (new Date(o.createdAt) > new Date(existing.lastDownload)) {
                    existing.lastDownload = o.createdAt;
                }
            } else {
                usersMap.set(email, {
                    email: o.clientInfo?.email || "Anonymous",
                    count: 1,
                    lastDownload: o.createdAt
                });
            }
        });

        const combinedUsers = Array.from(usersMap.values());
        const totalDownloads = combinedUsers.reduce((s, u) => s + u.count, 0);

        res.json({
            success: true,
            product,
            totalDownloads: Math.max(product.downloads || 0, totalDownloads),
            users: combinedUsers
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PING - Version Check
app.get("/api/ping", (req, res) => {
    res.json({ success: true, version: "1.0.1", timestamp: new Date() });
});

app.delete("/api/clients/delete-all", async (req, res) => {
    try {
        await Client.deleteMany({});
        await CustomDesign.deleteMany({});
        await Download.deleteMany({});
        await Contact.deleteMany({});
        await Order.deleteMany({});
        res.json({ success: true, message: "All client-related records deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET - All clients with stats (Unified logic)
app.get("/api/clients", async (req, res) => {
    try {
        const clients = await Client.find();
        const paidOrders = await Order.find({ status: "Paid" });
        const downloads = await Download.find();
        const customDesigns = await CustomDesign.find();
        const contacts = await Contact.find();

        const unifiedClients = new Map();

        // 1. Process explicit clients
        clients.forEach(c => {
            unifiedClients.set(c.email.toLowerCase(), {
                _id: c._id,
                client_name: c.client_name,
                company_name: c.company_name,
                location: c.location,
                email: c.email.toLowerCase(),
                createdAt: c.createdAt,
                source: 'direct'
            });
        });

        // 2. Process Custom Designs
        customDesigns.forEach(d => {
            if (!d.email) return;
            const email = d.email.toLowerCase();
            if (!unifiedClients.has(email)) {
                unifiedClients.set(email, {
                    _id: "cl_cd_" + d._id,
                    client_name: email.split('@')[0],
                    company_name: "Custom Design Client",
                    location: "N/A",
                    email: email,
                    createdAt: d.createdAt,
                    source: 'custom_design'
                });
            }
        });

        // 3. Process Downloads
        downloads.forEach(d => {
            if (!d.email || d.email === 'Anonymous') return;
            const email = d.email.toLowerCase();
            if (!unifiedClients.has(email)) {
                unifiedClients.set(email, {
                    _id: "cl_dl_" + d._id,
                    client_name: email.split('@')[0],
                    company_name: "Web Downloader",
                    location: "N/A",
                    email: email,
                    createdAt: d.date,
                    source: 'download'
                });
            }
        });

        // 4. Process Contacts
        contacts.forEach(c => {
            if (!c.email) return;
            const email = c.email.toLowerCase();
            if (!unifiedClients.has(email)) {
                unifiedClients.set(email, {
                    _id: "cl_con_" + c._id,
                    client_name: c.name || email.split('@')[0],
                    company_name: "Inquiry Contact",
                    location: "N/A",
                    email: email,
                    createdAt: c.createdAt,
                    source: 'contact'
                });
            }
        });

        let clientsWithStats = Array.from(unifiedClients.values()).map(client => {
            const email = client.email.toLowerCase();
            
            const clientPurchases = paidOrders.filter(o => o.clientInfo?.email?.toLowerCase() === email);
            const totalRevenue = clientPurchases.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            
            // Get unique products purchased by this client
            const purchasedItems = new Set();
            clientPurchases.forEach(o => {
                o.items.forEach(item => {
                    if (item.productId) purchasedItems.add(item.productId.toString());
                    if (item.title) purchasedItems.add(item.title.toLowerCase().trim());
                });
            });

            // Count downloads that weren't part of a purchase
            const uniqueDownloads = downloads.filter(d => {
                if (d.email?.toLowerCase() !== email) return false;
                const isById = d.productId && purchasedItems.has(d.productId.toString());
                const isByName = d.productName && purchasedItems.has(d.productName.toLowerCase().trim());
                return !isById && !isByName;
            }).length;

            const totalDownloads = clientPurchases.length + uniqueDownloads;

            const allDates = [
                ...clientPurchases.map(o => o.createdAt),
                ...downloads.filter(d => d.email?.toLowerCase() === email).map(d => d.date),
                ...customDesigns.filter(d => d.email?.toLowerCase() === email).map(d => d.createdAt)
            ].sort((a, b) => new Date(b) - new Date(a));

            const lastActivity = allDates[0] || client.createdAt;

            return {
                ...client,
                totalRevenue,
                totalDownloads,
                lastPurchase: lastActivity
            };
        });

        // Filter: ONLY include clients who have interacton
        clientsWithStats = clientsWithStats.filter(c => c.totalDownloads > 0 || c.totalRevenue > 0 || c.source === 'custom_design' || c.source === 'contact');

        res.json({ success: true, clients: clientsWithStats.sort((a, b) => new Date(b.lastPurchase) - new Date(a.lastPurchase)) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET - Single client details
app.get("/api/clients/:id", async (req, res) => {
    try {
        const id = req.params.id;
        let email = null;
        let clientProfile = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            clientProfile = await Client.findById(id);
            if (clientProfile) email = clientProfile.email.toLowerCase();
        }

        if (!clientProfile) {
            // Try to find by temporary ID patterns or directly by searching other models
            // This is a simplified version of the manual aggregation
            const allClients = await Client.find();
            const allOrders = await Order.find({ status: "Paid" });
            const allDownloads = await Download.find();
            const allDesigns = await CustomDesign.find();

            // Find email from various sources if ID is a proxy
            if (id.startsWith("cl_cd_")) {
                const d = await CustomDesign.findById(id.replace("cl_cd_", ""));
                if (d) email = d.email.toLowerCase();
            } else if (id.startsWith("cl_dl_")) {
                const d = await Download.findById(id.replace("cl_dl_", ""));
                if (d) email = d.email.toLowerCase();
            } else if (id.startsWith("cl_con_")) {
                const c = await Contact.findById(id.replace("cl_con_", ""));
                if (c) email = c.email.toLowerCase();
            }

            if (email) {
                // Find first activity for Joined Date
                const firstOrder = await Order.findOne({ "clientInfo.email": new RegExp(`^${email}$`, "i") }).sort({ createdAt: 1 });
                const firstDownload = await Download.findOne({ email: new RegExp(`^${email}$`, "i") }).sort({ date: 1 });
                
                // Also look for most recent info for Company/Location if client record is missing
                const latestOrder = await Order.findOne({ "clientInfo.email": new RegExp(`^${email}$`, "i") }).sort({ createdAt: -1 });
                const latestDesign = await CustomDesign.findOne({ email: new RegExp(`^${email}$`, "i") }).sort({ createdAt: -1 });

                let joinedDate = new Date();
                if (firstOrder && firstDownload) {
                    joinedDate = new Date(Math.min(firstOrder.createdAt, firstDownload.date));
                } else if (firstOrder) {
                    joinedDate = firstOrder.createdAt;
                } else if (firstDownload) {
                    joinedDate = firstDownload.date;
                }

                clientProfile = {
                    email,
                    client_name: email.split('@')[0],
                    company_name: latestOrder?.clientInfo?.company || latestDesign?.category || "Individual",
                    location: latestOrder?.clientInfo?.location || "N/A",
                    createdAt: joinedDate
                };
            }
        }

        if (!email) return res.status(404).json({ success: false, message: "Client not found" });

        const history = [];
        const purchasedProductIds = new Set();
        const purchasedProductNames = new Set();

        const myOrders = await Order.find({ "clientInfo.email": new RegExp(`^${email}$`, "i"), status: "Paid" });
        myOrders.forEach(o => {
            o.items.forEach(item => {
                if (item.productId) purchasedProductIds.add(item.productId.toString());
                if (item.title) purchasedProductNames.add(item.title.toLowerCase().trim());
            });
            history.push({
                type: 'Purchase',
                name: o.items.map(i => i.title).join(", "),
                date: o.createdAt,
                info: `Order: ${o.razorpayOrderId}`,
                amount: o.totalAmount
            });
        });

        const myDownloads = await Download.find({ email: new RegExp(`^${email}$`, "i") });
        myDownloads.forEach(d => {
            // ONLY add as "Download" if it hasn't been "Purchased" by ID OR Name
            const isByProductId = d.productId && purchasedProductIds.has(d.productId.toString());
            const isByProductName = d.productName && purchasedProductNames.has(d.productName.toLowerCase().trim());
            
            const isAlreadyPurchased = isByProductId || isByProductName;
            
            if (!isAlreadyPurchased) {
                history.push({
                    type: 'Download',
                    name: d.productName,
                    date: d.date,
                    info: 'Website Download',
                    amount: d.price || 0
                });
            }
        });

        const myDesigns = await CustomDesign.find({ email: new RegExp(`^${email}$`, "i") });
        myDesigns.forEach(d => {
            history.push({
                type: 'Custom Order',
                name: d.fileName || d.category,
                date: d.createdAt,
                info: `Req: ${d.requirement?.substring(0, 30)}`,
                amount: d.budget || d.amount || 0
            });
        });

        // ── FINAL DEDUPLICATION ───────────────────────────
        // Some products might appear as both Purchase and Download.
        // We prioritize Purchase > Custom Order > Download.
        const uniqueHistoryMap = new Map();

        // Sort by priority first so later overwrites only happen if higher priority or newer?
        history.forEach(item => {
            const nameKey = item.name.toLowerCase().trim();
            const existing = uniqueHistoryMap.get(nameKey);

            if (!existing) {
                uniqueHistoryMap.set(nameKey, item);
            } else {
                // Priority Logic: Purchase (1) > Custom Order (2) > Download (3)
                const getPriority = (type) => {
                    if (type === 'Purchase') return 1;
                    if (type === 'Custom Order') return 2;
                    return 3;
                };

                const currentPriority = getPriority(item.type);
                const existingPriority = getPriority(existing.type);

                if (currentPriority < existingPriority) {
                    uniqueHistoryMap.set(nameKey, item);
                } else if (currentPriority === existingPriority) {
                    if (new Date(item.date) > new Date(existing.date)) {
                        uniqueHistoryMap.set(nameKey, item);
                    }
                }
            }
        });

        const finalHistory = Array.from(uniqueHistoryMap.values());

        res.json({
            success: true,
            client: {
                ... (clientProfile._doc || clientProfile),
                purchases: finalHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST - Record payment success (Direct entry from frontend if needed)
app.post("/api/payments/success", async (req, res) => {
    try {
        const { clientName, companyName, location, email, productId, productName, fileUrl, paymentId, amount } = req.body;
        
        if (!email) return res.status(400).json({ success: false, message: "Email required" });

        // Upsert Client
        let client = await Client.findOne({ email: email.toLowerCase() });
        if (!client) {
            client = new Client({
                client_name: clientName || email.split('@')[0],
                company_name: companyName,
                location,
                email: email.toLowerCase()
            });
            await client.save();
        }

        // We already have /api/payment/verify for Razorpay. 
        // This route is kept for compatibility with dashboard frontend if it calls it directly.
        // For now, just return success or create a manual Order record.
        res.json({ success: true, message: "Payment tracked" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET - Dashboard Stats
app.get("/api/stats/totals", async (req, res) => {
    try {
        const productCount = await Product.countDocuments();
        const products = await Product.find();
        const totalDownloadsCount = products.reduce((sum, p) => sum + (p.downloads || 0), 0);
        
        const customOrdersCount = await CustomDesign.countDocuments();
        
        const paidOrders = await Order.find({ status: "Paid" });
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Unique clients
        const emails = new Set();
        const allDownloads = await Download.find();
        const allCustomDesigns = await CustomDesign.find();
        
        allDownloads.forEach(d => { if (d.email && d.email !== 'Anonymous') emails.add(d.email.toLowerCase()); });
        paidOrders.forEach(o => { if (o.clientInfo?.email) emails.add(o.clientInfo.email.toLowerCase()); });
        allCustomDesigns.forEach(d => { if (d.email) emails.add(d.email.toLowerCase()); });
        
        res.json({
            success: true,
            totalDownloads: totalDownloadsCount,
            customOrdersCount,
            totalClients: emails.size,
            totalRevenue
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/total-downloads", async (req, res) => {
    try {
        const products = await Product.find();
        const totalDownloads = products.reduce((sum, p) => sum + (p.downloads || 0), 0);
        res.json({ totalDownloads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── SETTINGS & MONTHLY ANALYTICS ──────────────────────────

// GET - System Settings
app.get("/api/settings", async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ isStoreEnabled: true });
            await settings.save();
        }
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT - Update System Settings
app.put("/api/settings", async (req, res) => {
    try {
        const { isStoreEnabled, currency } = req.body;
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({ isStoreEnabled, currency });
        } else {
            if (isStoreEnabled !== undefined) settings.isStoreEnabled = isStoreEnabled;
            if (currency !== undefined) settings.currency = currency;
            settings.updatedAt = Date.now();
        }
        await settings.save();
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET - Detailed Monthly Stats
// GET - Month summary for Dashboard Snapshot (supports ?month=6&year=2026)
app.get("/api/stats/summary", async (req, res) => {
    try {
        const now = new Date();
        const y = parseInt(req.query.year) || now.getFullYear();
        const m = req.query.month ? parseInt(req.query.month) - 1 : now.getMonth(); // convert 1-indexed to 0-indexed

        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0, 23, 59, 59);

        console.log(`[STATS] Fetching summary for ${y}-${m + 1} (${start.toISOString()} to ${end.toISOString()})`);

        const [orders, designs, downloads] = await Promise.all([
            Order.find({ status: "Paid", createdAt: { $gte: start, $lte: end } }),
            CustomDesign.find({ createdAt: { $gte: start, $lte: end } }),
            Download.find({ date: { $gte: start, $lte: end } })
        ]);

        const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        
        const emails = new Set();
        orders.forEach(o => o.clientInfo?.email && emails.add(o.clientInfo.email.toLowerCase()));
        designs.forEach(d => d.email && emails.add(d.email.toLowerCase()));
        downloads.forEach(d => d.email && d.email !== 'Anonymous' && emails.add(d.email.toLowerCase()));

        res.json({
            success: true,
            totalClients: emails.size,
            totalOrders: orders.length,
            customDesigns: designs.length,
            revenue
        });
    } catch (err) {
        console.error("[STATS] Summary Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET - All months detail for a specific year
app.get("/api/stats/all-months-detail", async (req, res) => {
    try {
        const yr = parseInt(req.query.year) || new Date().getFullYear();
        console.log(`[DEBUG] /api/stats/all-months-detail for YEAR: ${yr}`);

        const start = new Date(yr, 0, 1);
        const end = new Date(yr, 11, 31, 23, 59, 59);

        const [allOrders, allDesigns, allDownloads] = await Promise.all([
            Order.find({ status: "Paid", createdAt: { $gte: start, $lte: end } }),
            CustomDesign.find({ createdAt: { $gte: start, $lte: end } }),
            Download.find({ date: { $gte: start, $lte: end } })
        ]);

        console.log(`[DEBUG] DB Found: ${allOrders.length} Orders, ${allDesigns.length} Designs, ${allDownloads.length} Downloads`);

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const data = monthNames.map((name, i) => {
            const mOrders = allOrders.filter(o => new Date(o.createdAt).getMonth() === i);
            const mDesigns = allDesigns.filter(d => new Date(d.createdAt).getMonth() === i);
            const mDownloads = allDownloads.filter(d => new Date(d.date).getMonth() === i);

            const revenue = mOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            const emails = new Set();
            mOrders.forEach(o => o.clientInfo?.email && emails.add(o.clientInfo.email.toLowerCase()));
            mDesigns.forEach(d => d.email && emails.add(d.email.toLowerCase()));
            mDownloads.forEach(d => d.email && d.email !== 'Anonymous' && emails.add(d.email.toLowerCase()));

            const clientList = Array.from(emails).map(email => {
                const order = mOrders.find(o => o.clientInfo?.email?.toLowerCase() === email);
                const design = mDesigns.find(d => d.email?.toLowerCase() === email);
                const download = mDownloads.find(d => d.email?.toLowerCase() === email);
                return {
                    email,
                    name: order?.clientInfo?.name || design?.email?.split('@')[0] || download?.email?.split('@')[0] || "Client",
                    type: order ? "Customer" : design ? "Inquiry" : "Viewer",
                    id: order?._id || design?._id || download?._id
                };
            });

            return {
                month: name,
                monthIndex: i + 1,
                totalClients: emails.size,
                totalOrders: mOrders.length,
                customDesigns: mDesigns.length,
                revenue,
                clientList
            };
        });

        console.log(`[DEBUG] Aggregation success for year ${yr}. Returning 12 months.`);
        res.json({ success: true, year: yr, data });
    } catch (err) {
        console.error("[DEBUG] /api/stats/all-months-detail ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE - Entire month data
app.delete("/api/stats/month/:year/:month", async (req, res) => {
    try {
        const { year, month } = req.params;
        const m = parseInt(month);
        const y = parseInt(year);

        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0, 23, 59, 59);

        const range = { $gte: startDate, $lte: endDate };

        await Promise.all([
            Order.deleteMany({ createdAt: range }),
            CustomDesign.deleteMany({ createdAt: range }),
            Download.deleteMany({ date: range })
        ]);

        res.json({ success: true, message: `Data for ${month}/${year} deleted successfully` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE - Individual entry (Order, CustomDesign, or Download)
app.delete("/api/stats/entry/:type/:id", async (req, res) => {
    try {
        const { type, id } = req.params;
        let result;

        if (type === "Customer") {
            result = await Order.findByIdAndDelete(id);
        } else if (type === "Inquiry") {
            result = await CustomDesign.findByIdAndDelete(id);
        } else if (type === "Viewer") {
            result = await Download.findByIdAndDelete(id);
        }

        if (!result) return res.status(404).json({ success: false, message: "Entry not found" });
        res.json({ success: true, message: "Entry deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── EMAIL OUTREACH API ROUTES ────────────────────────────

// Clients Endpoints
app.get("/api/email-outreach/clients", async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        let query = {};
        if (range) {
            const { start, end } = getDateRangeFilter(range, startDate, endDate);
            if (start || end) {
                query.lastEmailSent = {};
                if (start) query.lastEmailSent.$gte = start;
                if (end) query.lastEmailSent.$lte = end;
            }
        }
        const clients = await EmailClient.find(query).sort({ createdAt: -1 });
        res.json({ success: true, clients });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/clients", async (req, res) => {
    try {
        const { email, name, company, service } = req.body;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });
        
        let client = await EmailClient.findOne({ email: email.toLowerCase() });
        if (client) {
            return res.status(400).json({ success: false, message: "Client with this email already exists" });
        }

        client = new EmailClient({
            email: email.toLowerCase(),
            name,
            company,
            service,
            status: 'Sent'
        });
        await client.save();
        res.status(201).json({ success: true, client });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/import-clients", async (req, res) => {
    try {
        const { campaignId, campaignName, subject, body, templateId, attachments, followUpSettings, clients } = req.body;
        
        let campaign;
        if (campaignId) {
            campaign = await EmailCampaign.findById(campaignId);
            if (!campaign) return res.status(404).json({ success: false, message: "Selected campaign not found" });
            if (subject) campaign.subject = subject;
            if (body) campaign.body = body;
            await campaign.save();
        } else {
            if (!campaignName || !subject || !body) {
                return res.status(400).json({ success: false, message: "Campaign Name, Subject and Body are required for new campaigns." });
            }
            campaign = new EmailCampaign({
                name: campaignName,
                subject,
                body,
                templateId: templateId || null,
                attachments: attachments || [],
                followUpSettings: followUpSettings || [],
                status: 'Draft'
            });
            await campaign.save();
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const emailsSeen = new Set();
        let totalRows = 0;
        let validEmailsCount = 0;
        let invalidEmailsCount = 0;
        let duplicateEmailsCount = 0;
        let newLeadsCount = 0;
        let alreadyContactedCount = 0;

        if (clients && Array.isArray(clients)) {
            totalRows = clients.length;
            const recipientIds = [];
            let sortOrder = 0;
            
            // Pre-fetch all contacted emails for this campaign
            const contactedEmails = new Set();
            const contacted = await SentEmail.find({
                campaignId: campaign._id,
                status: { $in: ['Sent', 'Opened', 'Clicked', 'Replied'] }
            }).select('normalizedEmail');
            contacted.forEach(s => {
                if (s.normalizedEmail) contactedEmails.add(s.normalizedEmail.trim().toLowerCase());
            });

            const clientsContacted = await EmailClient.find({
                campaignId: campaign._id,
                status: { $in: ['Sent', 'Opened', 'Clicked', 'Replied', 'Already Contacted'] }
            }).select('email');
            clientsContacted.forEach(c => {
                if (c.email) contactedEmails.add(c.email.trim().toLowerCase());
            });

            for (const c of clients) {
                const emailRaw = c.email || '';
                const emailClean = emailRaw.trim().toLowerCase().replace(/\s+/g, '');
                const name = (c.name || '').trim();

                if (!emailClean || !emailRegex.test(emailClean)) {
                    invalidEmailsCount++;
                    continue;
                }

                validEmailsCount++;

                if (emailsSeen.has(emailClean)) {
                    duplicateEmailsCount++;
                    continue;
                }
                emailsSeen.add(emailClean);
                
                let client = await EmailClient.findOne({ campaignId: campaign._id, email: emailClean });
                
                if (client) {
                    const isSuccess = ['Sent', 'Opened', 'Clicked', 'Replied', 'Already Contacted'].includes(client.status) || contactedEmails.has(emailClean);
                    if (isSuccess) {
                        client.status = 'Already Contacted';
                        alreadyContactedCount++;
                    } else {
                        client.status = 'Pending';
                        newLeadsCount++;
                    }
                    client.name = name || client.name || '';
                    client.sortOrder = sortOrder++;
                    await client.save();
                    recipientIds.push(client._id);
                } else {
                    const hasContacted = contactedEmails.has(emailClean);
                    const status = hasContacted ? 'Already Contacted' : 'Pending';
                    
                    if (hasContacted) {
                        alreadyContactedCount++;
                    } else {
                        newLeadsCount++;
                    }

                    client = new EmailClient({
                        email: emailClean,
                        name: name || '',
                        campaignId: campaign._id,
                        status,
                        sortOrder: sortOrder++
                    });
                    await client.save();
                    recipientIds.push(client._id);
                }
            }
            
            const uniqueRecipients = Array.from(new Set([
                ...(campaign.recipients || []).map(id => id.toString()),
                ...recipientIds.map(id => id.toString())
            ])).map(id => new mongoose.Types.ObjectId(id));
            
            campaign.recipients = uniqueRecipients;
            await campaign.save();
        }

        res.json({ 
            success: true, 
            campaignId: campaign._id,
            campaign,
            summary: {
                totalRows,
                validEmails: validEmailsCount,
                invalidEmails: invalidEmailsCount,
                duplicateEmails: duplicateEmailsCount,
                alreadyContacted: alreadyContactedCount,
                newLeads: newLeadsCount
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/email-outreach/sample-mail-text", async (req, res) => {
    try {
        const initial = await EmailTemplate.findOne({ name: "Default Outreach Template" });
        const followup = await EmailTemplate.findOne({ name: "Default Follow-up Template" });
        res.json({ success: true, initial, followup });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/sample-mail-text/save", async (req, res) => {
    try {
        const { type, subject, body } = req.body;
        const name = type === 'initial' ? "Default Outreach Template" : "Default Follow-up Template";
        let template = await EmailTemplate.findOne({ name });
        if (!template) {
            template = new EmailTemplate({ name, subject, body });
        } else {
            template.subject = subject;
            template.body = body;
        }
        await template.save();
        res.json({ success: true, message: "Saved successfully", template });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/follow-ups/start-sending", async (req, res) => {
    try {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const eligibleClients = await EmailClient.find({
            status: { $in: ['Sent', 'Opened', 'Clicked'] },
            replied: { $ne: true },
            followUpStatus: { $ne: 'Stopped — Replied' },
            lastEmailSent: { $lte: fiveDaysAgo }
        });

        if (eligibleClients.length === 0) {
            return res.json({ success: true, message: "No clients are currently eligible for follow-up (5 days after sent, no reply).", count: 0 });
        }

        const template = await EmailTemplate.findOne({ name: "Default Follow-up Template" });
        if (!template) {
            return res.status(400).json({ success: false, message: "Default Follow-up Template not found. Please configure it in Sample Mail Text." });
        }

        const settings = await EmailSettings.findOne() || await EmailSettings.create({});
        const activeFromEmail = settings.senderEmail || process.env.SMTP_USER || process.env.EMAIL_USER || '';

        let sentCount = 0;
        for (const client of eligibleClients) {
            const freshClient = await EmailClient.findById(client._id);
            if (!freshClient || freshClient.replied === true || freshClient.status === 'Replied' || freshClient.followUpStatus === 'Stopped — Replied') {
                continue;
            }

            const normalizedEmail = client.email.trim().toLowerCase();
            const alreadySentFollowUp = await SentEmail.findOne({
                campaignId: client.campaignId,
                normalizedEmail,
                step: 1
            });
            if (alreadySentFollowUp) {
                continue;
            }

            let personalizedBody = template.body || '';
            personalizedBody = personalizedBody.replace(/\{\{client_name\}\}/g, client.name || 'there');
            personalizedBody = personalizedBody.replace(/\{\{name\}\}/g, client.name || 'there');
            personalizedBody = personalizedBody.replace(/\{\{email\}\}/g, client.email || '');
            personalizedBody = personalizedBody.replace(/\{\{company_name\}\}/g, client.company || 'your company');
            personalizedBody = personalizedBody.replace(/\{\{company\}\}/g, client.company || 'your company');

            let personalizedSubject = template.subject || '';
            personalizedSubject = personalizedSubject.replace(/\{\{client_name\}\}/g, client.name || 'there');
            personalizedSubject = personalizedSubject.replace(/\{\{name\}\}/g, client.name || 'there');
            personalizedSubject = personalizedSubject.replace(/\{\{email\}\}/g, client.email || '');
            personalizedSubject = personalizedSubject.replace(/\{\{company_name\}\}/g, client.company || 'your company');
            personalizedSubject = personalizedSubject.replace(/\{\{company\}\}/g, client.company || 'your company');

            const sentEmail = new SentEmail({
                recipient: client.email,
                clientId: client._id,
                campaignId: client.campaignId,
                subject: personalizedSubject,
                body: personalizedBody,
                recipientEmail: client.email,
                recipientName: client.name || '',
                normalizedEmail,
                status: 'Sending',
                sentAt: new Date(),
                step: 1
            });
            await sentEmail.save();

            let finalBody = personalizedBody;
            if (settings.trackingEnabled) {
                const openTrackingUrl = `${process.env.VITE_API_URL || 'http://localhost:4999'}/api/email-outreach/track/open/${sentEmail._id}`;
                finalBody += `<img src="${openTrackingUrl}" width="1" height="1" style="display:none;" />`;
            }

            try {
                const mailOptions = {
                    from: `"${settings.senderName || 'Octoink Studios'} <${activeFromEmail}>"`,
                    to: client.email,
                    subject: personalizedSubject,
                    html: finalBody
                };

                if (settings.replyTo || activeFromEmail) {
                    mailOptions.replyTo = settings.replyTo || activeFromEmail;
                }

                const info = await transporter.sendMail(mailOptions);
                
                sentEmail.messageId = info.messageId;
                sentEmail.status = 'Sent';
                sentEmail.sentAt = new Date();
                await sentEmail.save();

                client.status = 'Sent';
                client.lastEmailSent = new Date();
                client.sentFrom = activeFromEmail;
                await client.save();

                sentCount++;
            } catch (err) {
                console.error(`[Follow-up manual send failed] ${client.email}:`, err.message);
                sentEmail.status = 'Failed';
                sentEmail.error = err.message;
                await sentEmail.save();
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        res.json({ success: true, message: `Successfully sent ${sentCount} follow-up emails.`, count: sentCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put("/api/email-outreach/clients/:id", async (req, res) => {
    try {
        const client = await EmailClient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!client) return res.status(404).json({ success: false, message: "Client not found" });
        res.json({ success: true, client });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete("/api/email-outreach/clients/:id", async (req, res) => {
    try {
        const client = await EmailClient.findByIdAndDelete(req.params.id);
        if (!client) return res.status(404).json({ success: false, message: "Client not found" });
        await EmailFollowUp.deleteMany({ clientId: req.params.id });
        res.json({ success: true, message: "Client deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Endpoint to validate imported clients and check duplicates/already contacted status
app.post("/api/email-outreach/validate-import", async (req, res) => {
    try {
        const { campaignId, clients } = req.body;
        if (!clients || !Array.isArray(clients)) {
            return res.status(400).json({ success: false, message: "Clients array required" });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const normalizedClients = [];
        const emailsSeen = new Set();

        let totalRows = clients.length;
        let validEmailsCount = 0;
        let invalidEmailsCount = 0;
        let duplicateEmailsCount = 0;
        let newLeadsCount = 0;
        let alreadyContactedCount = 0;

        // Fetch already contacted emails for this campaign if campaignId is provided
        const contactedEmails = new Set();
        if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
            const contacted = await SentEmail.find({
                campaignId,
                status: { $in: ['Sent', 'Opened', 'Clicked', 'Replied'] }
            }).select('normalizedEmail');
            contacted.forEach(s => {
                if (s.normalizedEmail) contactedEmails.add(s.normalizedEmail.trim().toLowerCase());
            });

            // Also check if any existing EmailClient has success status
            const clientsContacted = await EmailClient.find({
                campaignId,
                status: { $in: ['Sent', 'Opened', 'Clicked', 'Replied'] }
            }).select('email');
            clientsContacted.forEach(c => {
                if (c.email) contactedEmails.add(c.email.trim().toLowerCase());
            });
        }

        for (const c of clients) {
            const emailRaw = c.email || '';
            const emailClean = emailRaw.trim().toLowerCase().replace(/\s+/g, '');
            const name = (c.name || '').trim();

            if (!emailClean) {
                invalidEmailsCount++;
                normalizedClients.push({ email: '(Empty)', name, status: 'Invalid', reason: 'Missing email address' });
            } else if (!emailRegex.test(emailClean)) {
                invalidEmailsCount++;
                normalizedClients.push({ email: emailClean, name, status: 'Invalid', reason: 'Invalid email format' });
            } else {
                validEmailsCount++;
                if (emailsSeen.has(emailClean)) {
                    duplicateEmailsCount++;
                    normalizedClients.push({ email: emailClean, name, status: 'Duplicate', reason: 'Duplicate in file' });
                } else {
                    emailsSeen.add(emailClean);
                    if (contactedEmails.has(emailClean)) {
                        alreadyContactedCount++;
                        normalizedClients.push({ email: emailClean, name, status: 'Already Contacted' });
                    } else {
                        newLeadsCount++;
                        normalizedClients.push({ email: emailClean, name, status: 'New' });
                    }
                }
            }
        }

        res.json({
            success: true,
            summary: {
                totalRows,
                validEmails: validEmailsCount,
                invalidEmails: invalidEmailsCount,
                duplicateEmails: duplicateEmailsCount,
                newLeads: newLeadsCount,
                alreadyContacted: alreadyContactedCount
            },
            clients: normalizedClients
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Endpoint to fetch leads with engagement score and status
app.get("/api/email-outreach/leads", async (req, res) => {
    try {
        const { range, startDate, endDate, status, campaignId, search } = req.query;
        let matchQuery = {};

        // Apply date filter based on lastEmailSent if specified
        if (range) {
            const { start, end } = getDateRangeFilter(range, startDate, endDate);
            if (start || end) {
                matchQuery.lastEmailSent = {};
                if (start) matchQuery.lastEmailSent.$gte = start;
                if (end) matchQuery.lastEmailSent.$lte = end;
            }
        }

        // Apply status filter
        if (status && status !== 'All Leads' && status !== 'All Status') {
            matchQuery.status = status;
        }

        // Apply campaign filter
        if (campaignId && campaignId !== 'All Campaigns') {
            matchQuery.campaignId = new mongoose.Types.ObjectId(campaignId);
        }

        // Apply search filter (name, email)
        if (search) {
            matchQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const clients = await EmailClient.find(matchQuery).populate('campaignId').sort({ createdAt: -1 });
        const clientIds = clients.map(c => c._id);

        const sentEmails = await SentEmail.find({ clientId: { $in: clientIds } }).select('_id clientId');
        const clientToSentEmailsMap = {};
        const sentEmailIds = [];
        sentEmails.forEach(se => {
            sentEmailIds.push(se._id);
            if (!clientToSentEmailsMap[se.clientId]) {
                clientToSentEmailsMap[se.clientId] = [];
            }
            clientToSentEmailsMap[se.clientId].push(se._id.toString());
        });

        const eventCounts = await EmailEvent.aggregate([
            { $match: { sentEmailId: { $in: sentEmailIds } } },
            { $group: { _id: { sentEmailId: "$sentEmailId", type: "$eventType" }, count: { $sum: 1 } } }
        ]);

        const emailEventMap = {};
        eventCounts.forEach(ec => {
            const semailId = ec._id.sentEmailId.toString();
            if (!emailEventMap[semailId]) {
                emailEventMap[semailId] = { Open: 0, Click: 0 };
            }
            emailEventMap[semailId][ec._id.type] = ec.count;
        });

        const leads = clients.map(client => {
            let score = 0;
            if (client.replied) score += 40;
            if (client.clicked) score += 20;
            if (client.opened) score += 10;

            let totalOpens = 0;
            let totalClicks = 0;
            const relatedSentEmails = clientToSentEmailsMap[client._id.toString()] || [];
            relatedSentEmails.forEach(seId => {
                const counts = emailEventMap[seId] || { Open: 0, Click: 0 };
                totalOpens += counts.Open || 0;
                totalClicks += counts.Click || 0;
            });

            if (totalOpens > 1) {
                score += (totalOpens - 1) * 5;
            }
            if (totalClicks > 1) {
                score += (totalClicks - 1) * 10;
            }

            let label = "Cold Lead";
            if (score >= 50) label = "Hot Lead";
            else if (score >= 15) label = "Warm Lead";

            return {
                ...client.toObject(),
                leadScore: score,
                leadScoreLabel: label,
                totalOpens,
                totalClicks
            };
        });

        res.json({ success: true, leads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Live activity chronological feed
app.get("/api/email-outreach/activity", async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const lim = parseInt(limit);

        const sentEmails = await SentEmail.find()
            .populate('clientId')
            .sort({ sentTime: -1 })
            .limit(lim);

        const events = await EmailEvent.find()
            .populate({
                path: 'sentEmailId',
                populate: { path: 'clientId' }
            })
            .sort({ timestamp: -1 })
            .limit(lim);

        const replies = await EmailReply.find()
            .populate('clientId')
            .sort({ replyDate: -1 })
            .limit(lim);

        const createdFollowUps = await EmailFollowUp.find()
            .populate('clientId')
            .sort({ createdAt: -1 })
            .limit(lim);

        const activities = [];

        sentEmails.forEach(se => {
            if (se.clientId) {
                activities.push({
                    type: 'sent',
                    timestamp: se.sentTime,
                    message: `Email sent to ${se.clientId.name || se.recipient}`,
                    recipient: se.clientId.name || se.recipient,
                    email: se.recipient,
                    details: se.subject
                });
            }
        });

        events.forEach(ev => {
            if (ev.sentEmailId && ev.sentEmailId.clientId) {
                const clientName = ev.sentEmailId.clientId.name || ev.sentEmailId.recipient;
                let message = '';
                if (ev.eventType === 'Open') {
                    message = `Email opened by ${clientName}`;
                } else if (ev.eventType === 'Click') {
                    message = `Link clicked by ${clientName}`;
                } else if (ev.eventType === 'Bounce') {
                    message = `Email bounced for ${clientName}`;
                } else if (ev.eventType === 'Delivery') {
                    message = `Email delivered to ${clientName}`;
                }
                activities.push({
                    type: ev.eventType.toLowerCase(),
                    timestamp: ev.timestamp,
                    message,
                    recipient: clientName,
                    email: ev.sentEmailId.recipient,
                    details: ev.url || ev.sentEmailId.subject
                });
            }
        });

        replies.forEach(r => {
            const clientName = r.clientId ? r.clientId.name : r.sender.split('@')[0];
            activities.push({
                type: 'reply',
                timestamp: r.replyDate,
                message: `Reply received from ${clientName}`,
                recipient: clientName,
                email: r.sender,
                details: r.subject
            });
        });

        createdFollowUps.forEach(fu => {
            if (fu.clientId) {
                activities.push({
                    type: 'followup_scheduled',
                    timestamp: fu.createdAt,
                    message: `Follow-up scheduled for ${fu.clientId.name || fu.clientId.email}`,
                    recipient: fu.clientId.name || fu.clientId.email,
                    email: fu.clientId.email,
                    details: `Step ${fu.step}: ${fu.subject}`
                });
            }
        });

        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            activities: activities.slice(0, lim)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Campaigns Endpoints
app.get("/api/email-outreach/campaigns", async (req, res) => {
    try {
        const campaigns = await EmailCampaign.find().sort({ createdAt: -1 });
        res.json({ success: true, campaigns });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/upload", upload.array("attachments"), (req, res) => {
    try {
        const filePaths = (req.files || []).map(f => "uploads/files/" + f.filename);
        res.json({ success: true, filePaths });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


app.post("/api/email-outreach/campaigns", async (req, res) => {
    try {
        const { name, subject, body, templateId, recipients, attachments, scheduleType, scheduledTime, followUpSettings } = req.body;
        if (!name || !subject || !body) {
            return res.status(400).json({ success: false, message: "Campaign Name, Subject and Body are required." });
        }

        const campaign = new EmailCampaign({
            name,
            subject,
            body,
            templateId,
            recipients,
            attachments,
            scheduleType,
            scheduledTime,
            followUpSettings,
            status: scheduleType === 'Scheduled' ? 'Scheduled' : 'Draft'
        });
        await campaign.save();

        if (scheduleType === 'Immediate') {
            campaign.status = 'Running';
            await campaign.save();
            runCampaignQueue(campaign._id);
        }

        res.status(201).json({ success: true, campaign });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/campaigns/start-flow", async (req, res) => {
    try {
        const { campaignId, campaignName, subject, body, templateId, attachments, followUpSettings, clients } = req.body;
        
        let campaign;
        if (campaignId) {
            campaign = await EmailCampaign.findById(campaignId);
            if (!campaign) return res.status(404).json({ success: false, message: "Selected campaign not found" });
            campaign.status = 'Running';
            if (subject) campaign.subject = subject;
            if (body) campaign.body = body;
            await campaign.save();
        } else {
            if (!campaignName || !subject || !body) {
                return res.status(400).json({ success: false, message: "Campaign Name, Subject and Body are required for new campaigns." });
            }
            campaign = new EmailCampaign({
                name: campaignName,
                subject,
                body,
                templateId: templateId || null,
                attachments: attachments || [],
                followUpSettings: followUpSettings || [],
                status: 'Running'
            });
            await campaign.save();
        }

        if (clients && Array.isArray(clients)) {
            const recipientIds = [];
            let sortOrder = 0;
            
            for (const c of clients) {
                if (!c.email) continue;
                const emailClean = c.email.trim().toLowerCase();
                
                // Check if client already exists in this campaign
                let client = await EmailClient.findOne({ campaignId: campaign._id, email: emailClean });
                
                if (client) {
                    const isSuccess = ['Sent', 'Opened', 'Clicked', 'Replied'].includes(client.status);
                    if (!isSuccess) {
                        client.status = 'Pending';
                        client.name = c.name || client.name || '';
                        client.sortOrder = sortOrder++;
                        await client.save();
                    }
                    recipientIds.push(client._id);
                } else {
                    const alreadySent = await SentEmail.findOne({
                        campaignId: campaign._id,
                        normalizedEmail: emailClean,
                        status: { $in: ['Sent', 'Opened', 'Clicked', 'Replied'] },
                        step: 0
                    });
                    
                    const status = alreadySent ? 'Already Sent' : 'Pending';
                    
                    client = new EmailClient({
                        email: emailClean,
                        name: c.name || '',
                        campaignId: campaign._id,
                        status,
                        sortOrder: sortOrder++
                    });
                    await client.save();
                    recipientIds.push(client._id);
                }
            }
            
            const uniqueRecipients = Array.from(new Set([
                ...(campaign.recipients || []).map(id => id.toString()),
                ...recipientIds.map(id => id.toString())
            ])).map(id => new mongoose.Types.ObjectId(id));
            
            campaign.recipients = uniqueRecipients;
            await campaign.save();
        }

        runCampaignQueue(campaign._id);

        res.json({ success: true, campaign });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/campaigns/:id/start-sending", async (req, res) => {
    try {
        const campaign = await EmailCampaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

        campaign.status = 'Running';
        await campaign.save();

        runCampaignQueue(campaign._id);

        res.json({ success: true, campaign, message: "Campaign queue sending started" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/email-outreach/campaigns/:id/progress", async (req, res) => {
    try {
        const campaign = await EmailCampaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        
        const total = await EmailClient.countDocuments({ campaignId: campaign._id });
        const pending = await EmailClient.countDocuments({ campaignId: campaign._id, status: 'Pending' });
        const sending = await EmailClient.countDocuments({ campaignId: campaign._id, status: 'Sending' });
        const sent = await EmailClient.countDocuments({ campaignId: campaign._id, status: { $in: ['Sent', 'Opened', 'Clicked', 'Replied'] } });
        const failed = await EmailClient.countDocuments({ campaignId: campaign._id, status: 'Failed' });
        const alreadySent = await EmailClient.countDocuments({ campaignId: campaign._id, status: 'Already Sent' });
        
        const currentClient = await EmailClient.findOne({ campaignId: campaign._id, status: 'Sending' })
            || await EmailClient.findOne({ campaignId: campaign._id, status: 'Pending' }).sort({ sortOrder: 1 });
            
        res.json({
            success: true,
            progress: {
                campaignId: campaign._id,
                name: campaign.name,
                status: campaign.status,
                total,
                pending,
                sending,
                sent,
                failed,
                alreadySent,
                currentClient: currentClient ? {
                    name: currentClient.name,
                    email: currentClient.email,
                    status: currentClient.status
                } : null
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/campaigns/:id/retry-failed", async (req, res) => {
    try {
        const campaign = await EmailCampaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        
        await EmailClient.updateMany(
            { campaignId: campaign._id, status: 'Failed' },
            { $set: { status: 'Pending', error: null } }
        );
        
        campaign.status = 'Running';
        await campaign.save();
        
        runCampaignQueue(campaign._id);
        
        res.json({ success: true, message: "Failed clients reset to Pending and campaign resumed." });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/campaigns/:id/send", async (req, res) => {
    try {
        const campaign = await EmailCampaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

        campaign.status = 'Running';
        await campaign.save();

        runCampaignQueue(campaign._id);

        res.json({ success: true, message: "Campaign sending triggered" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/campaigns/:id/pause", async (req, res) => {
    try {
        const campaign = await EmailCampaign.findByIdAndUpdate(req.params.id, { status: 'Paused' }, { new: true });
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        
        const controller = activeCampaignRuns.get(req.params.id);
        if (controller) {
            controller.abort();
        }
        
        await EmailFollowUp.updateMany({ campaignId: req.params.id, status: 'Scheduled' }, { $set: { status: 'Paused' } });
        res.json({ success: true, campaign });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/campaigns/:id/resume", async (req, res) => {
    try {
        const campaign = await EmailCampaign.findByIdAndUpdate(req.params.id, { status: 'Running' }, { new: true });
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        
        await EmailFollowUp.updateMany({ campaignId: req.params.id, status: 'Paused' }, { $set: { status: 'Scheduled' } });
        
        runCampaignQueue(campaign._id);
        
        res.json({ success: true, campaign });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/campaigns/:id/cancel", async (req, res) => {
    try {
        const campaign = await EmailCampaign.findByIdAndUpdate(req.params.id, { status: 'Failed' }, { new: true });
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        
        const controller = activeCampaignRuns.get(req.params.id);
        if (controller) {
            controller.abort();
        }
        
        await EmailFollowUp.updateMany({ campaignId: req.params.id, status: { $in: ['Scheduled', 'Paused', 'Waiting'] } }, { $set: { status: 'Cancelled' } });
        res.json({ success: true, campaign });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Templates Endpoints
app.get("/api/email-outreach/templates", async (req, res) => {
    try {
        const templates = await EmailTemplate.find().sort({ createdAt: -1 });
        res.json({ success: true, templates });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/templates", async (req, res) => {
    try {
        const template = new EmailTemplate(req.body);
        await template.save();
        res.status(201).json({ success: true, template });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put("/api/email-outreach/templates/:id", async (req, res) => {
    try {
        const template = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!template) return res.status(404).json({ success: false, message: "Template not found" });
        res.json({ success: true, template });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete("/api/email-outreach/templates/:id", async (req, res) => {
    try {
        const template = await EmailTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: "Template not found" });
        if (template.name === "Default Outreach Template" || template.name === "Default Follow-up Template") {
            return res.status(400).json({ success: false, message: "Default templates cannot be deleted" });
        }
        await EmailTemplate.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Template deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Replies Endpoints
app.get("/api/email-outreach/replies", async (req, res) => {
    try {
        const replies = await EmailReply.find().populate('clientId').populate('campaignId').sort({ replyDate: -1 });
        res.json({ success: true, replies });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/api/email-outreach/replies/:clientId", async (req, res) => {
    try {
        const { clientId } = req.params;
        let client = null;
        let email = '';

        if (mongoose.Types.ObjectId.isValid(clientId)) {
            client = await EmailClient.findById(clientId);
            if (client) {
                email = client.email.trim().toLowerCase();
            } else {
                // Try to find a SentEmail or EmailReply with this clientId to get the email
                const sampleReply = await EmailReply.findOne({ clientId }) || 
                                    await SentEmail.findOne({ clientId });
                if (sampleReply) {
                    email = (sampleReply.sender || sampleReply.recipient || '').trim().toLowerCase();
                }
            }
        } else {
            email = clientId.replace('fallback-', '').trim().toLowerCase();
            client = await EmailClient.findOne({ email });
        }

        if (!email && clientId.includes('@')) {
            email = clientId.trim().toLowerCase();
        }

        if (!email) {
            return res.status(404).json({ success: false, message: "Could not resolve client email address" });
        }

        if (!client) {
            client = {
                _id: clientId,
                email,
                name: email.split('@')[0],
                status: 'Replied',
                replied: true,
                leadScore: 40,
                leadScoreLabel: 'Warm Lead'
            };
        }

        const sentEmails = await SentEmail.find({
            $or: [
                { clientId: client._id },
                { recipient: email },
                { normalizedEmail: email }
            ]
        }).sort({ sentTime: 1 });

        const replies = await EmailReply.find({
            $or: [
                { clientId: client._id },
                { sender: email }
            ]
        }).sort({ replyDate: 1 });

        const thread = [];
        const seenMessageIds = new Set();

        sentEmails.forEach(e => {
            const key = e.messageId || `sent-${e.sentTime?.getTime()}`;
            if (!seenMessageIds.has(key)) {
                seenMessageIds.add(key);
                thread.push({
                    type: 'outbound',
                    id: e._id,
                    subject: e.subject,
                    body: e.body,
                    date: e.sentTime || e.sentAt,
                    status: e.deliveryStatus || e.status
                });
            }
        });

        replies.forEach(r => {
            const key = r.messageId || `reply-${r.replyDate?.getTime()}`;
            if (!seenMessageIds.has(key)) {
                seenMessageIds.add(key);
                thread.push({
                    type: 'inbound',
                    id: r._id,
                    subject: r.subject,
                    body: r.body,
                    date: r.replyDate,
                    sender: r.sender
                });
            }
        });

        thread.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ success: true, client, thread });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/replies/:clientId/send", async (req, res) => {
    try {
        const { clientId } = req.params;
        const { subject, body } = req.body;
        if (!subject || !body) return res.status(400).json({ success: false, message: "Subject and Body required" });

        let client = null;
        let email = '';

        if (mongoose.Types.ObjectId.isValid(clientId)) {
            client = await EmailClient.findById(clientId);
            if (client) {
                email = client.email.trim().toLowerCase();
            } else {
                const sampleReply = await EmailReply.findOne({ clientId }) || 
                                    await SentEmail.findOne({ clientId });
                if (sampleReply) {
                    email = (sampleReply.sender || sampleReply.recipient || '').trim().toLowerCase();
                }
            }
        } else {
            email = clientId.replace('fallback-', '').trim().toLowerCase();
            client = await EmailClient.findOne({ email });
        }

        if (!email && clientId.includes('@')) {
            email = clientId.trim().toLowerCase();
        }

        if (!email) {
            return res.status(404).json({ success: false, message: "Could not resolve client email address" });
        }

        const settings = await EmailSettings.findOne() || await EmailSettings.create({});
        const activeFromEmail = settings.senderEmail || process.env.SMTP_USER || process.env.EMAIL_USER || '';

        const mailOptions = {
            from: `"${settings.senderName || 'Octoink Studios'}" <${activeFromEmail}>`,
            to: email,
            subject,
            html: body
        };

        if (settings.replyTo || activeFromEmail) {
            mailOptions.replyTo = settings.replyTo || activeFromEmail;
        }

        const info = await transporter.sendMail(mailOptions);

        const sentEmail = new SentEmail({
            recipient: email,
            clientId: client ? client._id : null,
            subject,
            body,
            messageId: info.messageId,
            deliveryStatus: 'Sent',
            recipientEmail: email,
            normalizedEmail: email,
            status: 'Sent',
            sentAt: new Date()
        });
        await sentEmail.save();

        res.json({ success: true, message: "Reply sent successfully", sentEmail });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Follow-ups Endpoints
app.get("/api/email-outreach/follow-ups", async (req, res) => {
    try {
        const followUps = await EmailFollowUp.find().populate('clientId').populate('campaignId').sort({ sendAt: 1 });
        res.json({ success: true, followUps });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/follow-ups/:id/pause", async (req, res) => {
    try {
        const followUp = await EmailFollowUp.findByIdAndUpdate(req.params.id, { status: 'Paused' }, { new: true });
        if (!followUp) return res.status(404).json({ success: false, message: "Follow-up not found" });
        res.json({ success: true, followUp });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/follow-ups/:id/resume", async (req, res) => {
    try {
        const followUp = await EmailFollowUp.findByIdAndUpdate(req.params.id, { status: 'Scheduled' }, { new: true });
        if (!followUp) return res.status(404).json({ success: false, message: "Follow-up not found" });
        res.json({ success: true, followUp });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post("/api/email-outreach/follow-ups/:id/cancel", async (req, res) => {
    try {
        const followUp = await EmailFollowUp.findByIdAndUpdate(req.params.id, { status: 'Cancelled' }, { new: true });
        if (!followUp) return res.status(404).json({ success: false, message: "Follow-up not found" });
        res.json({ success: true, followUp });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Settings Endpoints
app.get("/api/email-outreach/settings", async (req, res) => {
    try {
        let settings = await EmailSettings.findOne();
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || '';
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
        const smtpConfigured = !!(smtpUser && smtpPass);
        
        if (!settings) {
            settings = new EmailSettings({ senderEmail: smtpUser });
            await settings.save();
        } else if (!settings.senderEmail && smtpUser) {
            settings.senderEmail = smtpUser;
            await settings.save();
        }
        
        let connectionStatus = 'Not Configured';
        if (smtpConfigured) {
            connectionStatus = global.smtpConnectionStatus || 'Connected';
        }
        
        res.json({ 
            success: true, 
            settings,
            smtpConfigured,
            connectionStatus,
            senderEmail: settings.senderEmail || smtpUser,
            provider: "Gmail / SMTP"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put("/api/email-outreach/settings", async (req, res) => {
    try {
        let settings = await EmailSettings.findOne();
        if (!settings) {
            settings = new EmailSettings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || '';
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
        const smtpConfigured = !!(smtpUser && smtpPass);
        let connectionStatus = 'Not Configured';
        if (smtpConfigured) {
            connectionStatus = global.smtpConnectionStatus || 'Connected';
        }
        
        res.json({ 
            success: true, 
            settings,
            smtpConfigured,
            connectionStatus,
            senderEmail: settings.senderEmail || smtpUser,
            provider: "Gmail / SMTP"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Reconnect / Re-verify SMTP endpoint
app.post("/api/email-outreach/reconnect", async (req, res) => {
    try {
        global.smtpConnectionStatus = 'Checking...';
        transporter.verify((error) => {
            if (error) {
                console.log("❌ SMTP Re-verify Error:", error.message);
                global.smtpConnectionStatus = 'Disconnected';
                global.smtpError = error.message;
            } else {
                console.log("✅ SMTP Re-verify: Connected");
                global.smtpConnectionStatus = 'Connected';
                global.smtpError = null;
            }
        });
        // Wait briefly for verify to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || '';
        res.json({
            success: true,
            connectionStatus: global.smtpConnectionStatus,
            senderEmail: smtpUser
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Test Email endpoint
app.post("/api/email-outreach/test-email", async (req, res) => {
    const { recipientEmail } = req.body;
    if (!recipientEmail) {
        return res.status(400).json({ success: false, error: "Recipient email is required." });
    }
    
    try {
        const settings = await EmailSettings.findOne() || await EmailSettings.create({});
        const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
        const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
        const senderEmail = settings.senderEmail || smtpUser;
        const senderName = settings.senderName || "Octoink Studios";
        
        if (!smtpUser || !smtpPass) {
            return res.status(400).json({ 
                success: false, 
                error: "SMTP credentials are not configured in backend environment." 
            });
        }
        
        console.log(`[EMAIL OUTREACH]\nCampaign: Test Campaign\nFrom: ${senderEmail}\nTo: ${recipientEmail}\nStatus: SENDING`);
        
        const mailOptions = {
            from: `"${senderName}" <${senderEmail}>`,
            to: recipientEmail,
            subject: "Octoink Studios Email Outreach Test Email",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ede9fe; border-radius: 12px;">
                    <h2 style="color: #7c3aed; margin-top: 0;">Test Connection Successful</h2>
                    <p>This is a test email sent from the <strong>Octoink Studios Email Outreach module</strong>.</p>
                    <p>If you received this email, it means your SMTP configuration works correctly!</p>
                    <hr style="border: 0; border-top: 1px solid #ede9fe; margin: 20px 0;" />
                    <p style="font-size: 11px; color: #94a3b8; font-family: monospace;">Sent from: ${senderEmail}</p>
                </div>
            `
        };
        
        if (settings.replyTo || smtpUser) {
            mailOptions.replyTo = settings.replyTo || smtpUser;
        }
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log(`[EMAIL OUTREACH]\nFrom: ${senderEmail}\nTo: ${recipientEmail}\nStatus: SENT\nMessage ID: ${info.messageId}`);
        global.smtpConnectionStatus = 'Connected';
        
        res.json({
            success: true,
            messageId: info.messageId,
            senderEmail: senderEmail,
            recipientEmail: recipientEmail
        });
    } catch (err) {
        console.error(`[EMAIL OUTREACH]\nFrom: ${process.env.SMTP_USER || process.env.EMAIL_USER}\nTo: ${recipientEmail}\nStatus: FAILED\nError: ${err.message}`);
        global.smtpConnectionStatus = 'Disconnected';
        res.status(500).json({
            success: false,
            error: err.message,
            senderEmail: process.env.SMTP_USER || process.env.EMAIL_USER || '',
            recipientEmail: recipientEmail
        });
    }
});

// Client Sent Email detail endpoint
app.get("/api/email-outreach/clients/:id/sent-email", async (req, res) => {
    try {
        const client = await EmailClient.findById(req.params.id);
        if (!client) return res.status(404).json({ success: false, message: "Client not found" });
        
        const sentEmail = await SentEmail.findOne({ clientId: client._id }).sort({ sentTime: -1 });
        if (!sentEmail) {
            return res.json({ 
                success: true, 
                sentEmail: {
                    recipient: client.email,
                    recipientEmail: client.email,
                    recipientName: client.name || '',
                    status: client.status,
                    sentAt: client.lastEmailSent,
                    senderEmail: client.sentFrom || process.env.SMTP_USER || process.env.EMAIL_USER || '',
                    senderName: "Octoink Studios",
                    subject: '(No email details found)',
                    body: ''
                }
            });
        }
        
        const settings = await EmailSettings.findOne() || {};
        
        res.json({
            success: true,
            sentEmail: {
                _id: sentEmail._id,
                recipient: sentEmail.recipient || client.email,
                recipientEmail: sentEmail.recipientEmail || client.email,
                recipientName: sentEmail.recipientName || client.name || '',
                senderName: settings.senderName || "Octoink Studios",
                senderEmail: client.sentFrom || sentEmail.senderEmail || process.env.SMTP_USER || process.env.EMAIL_USER || '',
                subject: sentEmail.subject,
                body: sentEmail.body,
                status: sentEmail.status || client.status,
                sentAt: sentEmail.sentAt || client.lastEmailSent,
                messageId: sentEmail.messageId
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Analytics Endpoints
app.get("/api/email-outreach/analytics", async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        let dateFilter = {};
        
        if (range) {
            const { filter } = getDateRangeFilter(range, startDate, endDate);
            dateFilter = filter;
        }

        const totalSent = await SentEmail.countDocuments(dateFilter);
        const opened = await SentEmail.countDocuments({ ...dateFilter, openStatus: true });
        const clicked = await SentEmail.countDocuments({ ...dateFilter, clickStatus: true });
        const replied = await SentEmail.countDocuments({ ...dateFilter, replyStatus: true });
        const bounced = await SentEmail.countDocuments({ ...dateFilter, deliveryStatus: 'Bounced' });
        const delivered = await SentEmail.countDocuments({ ...dateFilter, deliveryStatus: { $ne: 'Failed' } });

        const openRate = totalSent > 0 ? ((opened / totalSent) * 100).toFixed(1) : 0;
        const clickRate = totalSent > 0 ? ((clicked / totalSent) * 100).toFixed(1) : 0;
        const replyRate = totalSent > 0 ? ((replied / totalSent) * 100).toFixed(1) : 0;
        const bounceRate = totalSent > 0 ? ((bounced / totalSent) * 100).toFixed(1) : 0;

        // For dailyStats, match using dateFilter
        const dailyStats = await SentEmail.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$sentTime" } },
                    sent: { $sum: 1 },
                    opened: { $sum: { $cond: ["$openStatus", 1, 0] } },
                    clicked: { $sum: { $cond: ["$clickStatus", 1, 0] } },
                    replied: { $sum: { $cond: ["$replyStatus", 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            summary: {
                totalSent,
                delivered,
                opened,
                clicked,
                replied,
                bounceRate,
                openRate,
                clickRate,
                replyRate
            },
            dailyStats
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Tracking Pixel & Link Tracking Endpoints
app.get("/api/email-outreach/track/open/:sentEmailId", async (req, res) => {
    try {
        const { sentEmailId } = req.params;
        const sentEmail = await SentEmail.findById(sentEmailId);
        
        if (sentEmail && !sentEmail.openStatus) {
            sentEmail.openStatus = true;
            sentEmail.openedAt = new Date();
            await sentEmail.save();

            const event = new EmailEvent({
                sentEmailId: sentEmail._id,
                eventType: 'Open',
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip
            });
            await event.save();

            await EmailClient.findByIdAndUpdate(sentEmail.clientId, {
                opened: true,
                status: 'Opened'
            });
        }
    } catch (err) {
        console.error("Open tracking error:", err.message);
    }

    const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
    );
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.end(pixel);
});

app.get("/api/email-outreach/track/click/:sentEmailId", async (req, res) => {
    const { sentEmailId } = req.params;
    const destUrl = req.query.url;

    try {
        const sentEmail = await SentEmail.findById(sentEmailId);
        
        if (sentEmail) {
            if (!sentEmail.clickStatus) {
                sentEmail.clickStatus = true;
                sentEmail.clickedAt = new Date();
                await sentEmail.save();

                await EmailClient.findByIdAndUpdate(sentEmail.clientId, {
                    clicked: true,
                    status: 'Clicked'
                });
            }

            const event = new EmailEvent({
                sentEmailId: sentEmail._id,
                eventType: 'Click',
                url: destUrl,
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip
            });
            await event.save();
        }
    } catch (err) {
        console.error("Click tracking error:", err.message);
    }

    if (destUrl) {
        res.redirect(destUrl);
    } else {
        res.redirect('/');
    }
});

// ── SCHEDULER IMPLEMENTATION ─────────────────────────────

async function checkReplies() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return;
    }
    
    let emailSettings = await EmailSettings.findOne();
    if (!emailSettings) {
        emailSettings = await EmailSettings.create({});
    }

    const config = {
        imap: {
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASS,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000
        }
    };

    try {
        const connection = await imapSimple.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN', ['SINCE', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()]];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        
        for (const message of messages) {
            const allBody = message.parts.find(part => part.which === '');
            const parsed = await simpleParser(allBody.body);
            
            const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase();
            const subject = parsed.subject || '';
            const textBody = parsed.text || parsed.html || '';
            const messageId = parsed.messageId;
            const inReplyTo = parsed.inReplyTo;
            const references = parsed.references || [];
            
            if (!fromEmail) continue;

            let sentEmail = null;
            if (inReplyTo) {
                sentEmail = await SentEmail.findOne({ messageId: inReplyTo });
            }
            if (!sentEmail && references.length > 0) {
                sentEmail = await SentEmail.findOne({ messageId: { $in: references } });
            }
            if (!sentEmail) {
                const client = await EmailClient.findOne({ email: fromEmail });
                if (client) {
                    sentEmail = await SentEmail.findOne({ recipient: fromEmail }).sort({ sentTime: -1 });
                }
            }

            if (sentEmail) {
                const clientId = sentEmail.clientId;
                const campaignId = sentEmail.campaignId;

                const existingReply = await EmailReply.findOne({ messageId });
                if (!existingReply) {
                    const reply = new EmailReply({
                        clientId,
                        campaignId,
                        sentEmailId: sentEmail._id,
                        subject,
                        body: textBody,
                        sender: fromEmail,
                        messageId,
                        replyDate: parsed.date || new Date()
                    });
                    await reply.save();

                    sentEmail.replyStatus = true;
                    sentEmail.repliedAt = parsed.date || new Date();
                    await sentEmail.save();

                    await EmailClient.findByIdAndUpdate(clientId, {
                        status: 'Replied',
                        replied: true,
                        followUpStatus: 'Stopped — Replied'
                    });

                    await EmailFollowUp.updateMany(
                        { clientId, campaignId, status: { $in: ['Scheduled', 'Waiting'] } },
                        { $set: { status: 'Stopped — Replied' } }
                    );

                    console.log(`[IMAP] Recorded reply from ${fromEmail} for campaign ${campaignId}`);
                }
            }
        }

        connection.end();
    } catch (err) {
        console.error("[IMAP] Connection/check error:", err.message);
    }
}

// Active campaign runs tracking
const activeCampaignRuns = new Map(); // campaignId -> AbortController

// Helper to calculate timezone offset
function getTimezoneOffset(timeZone, date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
      hourCycle: "h23"
    });
    const parts = formatter.formatToParts(date);
    const getVal = type => parseInt(parts.find(p => p.type === type).value, 10);
    
    const utc = Date.UTC(
      date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
      date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()
    );
    
    const local = Date.UTC(
      getVal("year"), getVal("month") - 1, getVal("day"),
      getVal("hour"), getVal("minute"), getVal("second")
    );
    
    return local - utc;
  } catch (err) {
    return 0;
  }
}

// Helper to get start of today in timezone
function getStartOfDayInTimezone(timezone) {
  const now = new Date();
  const offsetMs = getTimezoneOffset(timezone, now);
  const localTime = new Date(now.getTime() + offsetMs);
  localTime.setUTCHours(0, 0, 0, 0);
  return new Date(localTime.getTime() - offsetMs);
}

// Helper to calculate date range matching boundaries
function getDateRangeFilter(range, startDate, endDate, timezone = 'Asia/Kolkata') {
    const now = new Date();
    let start = null;
    let end = null;
    const offsetMs = getTimezoneOffset(timezone, now);
    const localNow = new Date(now.getTime() + offsetMs);

    switch (range) {
        case 'today':
            start = new Date(localNow);
            start.setUTCHours(0, 0, 0, 0);
            start = new Date(start.getTime() - offsetMs);
            
            end = new Date(localNow);
            end.setUTCHours(23, 59, 59, 999);
            end = new Date(end.getTime() - offsetMs);
            break;
            
        case 'yesterday':
            start = new Date(localNow);
            start.setUTCDate(start.getUTCDate() - 1);
            start.setUTCHours(0, 0, 0, 0);
            start = new Date(start.getTime() - offsetMs);

            end = new Date(localNow);
            end.setUTCDate(end.getUTCDate() - 1);
            end.setUTCHours(23, 59, 59, 999);
            end = new Date(end.getTime() - offsetMs);
            break;

        case '7days':
            start = new Date(localNow);
            start.setUTCDate(start.getUTCDate() - 6);
            start.setUTCHours(0, 0, 0, 0);
            start = new Date(start.getTime() - offsetMs);
            
            end = new Date(localNow);
            end.setUTCHours(23, 59, 59, 999);
            end = new Date(end.getTime() - offsetMs);
            break;

        case '30days':
            start = new Date(localNow);
            start.setUTCDate(start.getUTCDate() - 29);
            start.setUTCHours(0, 0, 0, 0);
            start = new Date(start.getTime() - offsetMs);
            
            end = new Date(localNow);
            end.setUTCHours(23, 59, 59, 999);
            end = new Date(end.getTime() - offsetMs);
            break;

        case '90days':
            start = new Date(localNow);
            start.setUTCDate(start.getUTCDate() - 89);
            start.setUTCHours(0, 0, 0, 0);
            start = new Date(start.getTime() - offsetMs);
            
            end = new Date(localNow);
            end.setUTCHours(23, 59, 59, 999);
            end = new Date(end.getTime() - offsetMs);
            break;

        case 'thismonth':
            start = new Date(localNow);
            start.setUTCDate(1);
            start.setUTCHours(0, 0, 0, 0);
            start = new Date(start.getTime() - offsetMs);

            end = new Date(localNow);
            end.setUTCHours(23, 59, 59, 999);
            end = new Date(end.getTime() - offsetMs);
            break;

        case 'lastmonth':
            start = new Date(localNow);
            start.setUTCMonth(start.getUTCMonth() - 1);
            start.setUTCDate(1);
            start.setUTCHours(0, 0, 0, 0);
            start = new Date(start.getTime() - offsetMs);

            end = new Date(localNow);
            end.setUTCDate(0);
            end.setUTCHours(23, 59, 59, 999);
            end = new Date(end.getTime() - offsetMs);
            break;

        case 'custom':
            if (startDate) {
                const sDate = new Date(startDate);
                const localS = new Date(sDate.getTime() + offsetMs);
                localS.setUTCHours(0, 0, 0, 0);
                start = new Date(localS.getTime() - offsetMs);
            }
            if (endDate) {
                const eDate = new Date(endDate);
                const localE = new Date(eDate.getTime() + offsetMs);
                localE.setUTCHours(23, 59, 59, 999);
                end = new Date(localE.getTime() - offsetMs);
            }
            break;
            
        default:
            break;
    }

    const filter = {};
    if (start || end) {
        filter.sentTime = {};
        if (start) filter.sentTime.$gte = start;
        if (end) filter.sentTime.$lte = end;
    }
    return { filter, start, end };
}

// Helper to check if currently within allowed sending window
function isWithinSendingWindow(settings) {
  const now = new Date();
  const timezone = settings.timezone || 'Asia/Kolkata';
  const offsetMs = getTimezoneOffset(timezone, now);
  const localTime = new Date(now.getTime() + offsetMs);
  
  const day = localTime.getUTCDay(); // 0 is Sunday, 6 is Saturday
  if (settings.sendingSchedule?.days && settings.sendingSchedule.days.length > 0) {
    if (!settings.sendingSchedule.days.includes(day)) {
      return false;
    }
  }
  
  const startStr = settings.sendingSchedule?.startTime || '09:00';
  const endStr = settings.sendingSchedule?.endTime || '18:00';
  
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  
  const currentH = localTime.getUTCHours();
  const currentM = localTime.getUTCMinutes();
  
  const currentVal = currentH * 60 + currentM;
  const startVal = startH * 60 + startM;
  const endVal = endH * 60 + endM;
  
  return currentVal >= startVal && currentVal <= endVal;
}

// Helper to check daily limit
async function checkDailyLimitReached(settings) {
  const startOfToday = getStartOfDayInTimezone(settings.timezone || 'Asia/Kolkata');
  const countToday = await SentEmail.countDocuments({
    sentAt: { $gte: startOfToday },
    status: { $in: ['Sent', 'Opened', 'Clicked', 'Replied'] }
  });
  return countToday >= settings.dailyLimit;
}

async function runCampaignQueue(campaignId) {
  const campIdStr = campaignId.toString();
  if (activeCampaignRuns.has(campIdStr)) {
    return;
  }
  const controller = new AbortController();
  activeCampaignRuns.set(campIdStr, controller);
  
  try {
    await processCampaignQueue(campaignId, controller.signal);
  } catch (err) {
    console.error(`[Queue Runner] Error in campaign ${campaignId}:`, err);
  } finally {
    activeCampaignRuns.delete(campIdStr);
  }
}

async function processCampaignQueue(campaignId, signal) {
  while (true) {
    if (signal?.aborted) {
      console.log(`[Queue Runner] Campaign ${campaignId} run aborted.`);
      break;
    }

    const campaign = await EmailCampaign.findById(campaignId);
    if (!campaign) {
      console.log(`[Queue Runner] Campaign ${campaignId} not found.`);
      break;
    }

    if (campaign.status !== 'Running') {
      console.log(`[Queue Runner] Campaign ${campaignId} is in status '${campaign.status}'. Stopping queue.`);
      break;
    }

    const settings = await EmailSettings.findOne() || await EmailSettings.create({});

    // Check allowed sending window
    if (!isWithinSendingWindow(settings)) {
      console.log(`[Queue Runner] Outside allowed sending window. Suspending campaign ${campaignId}.`);
      campaign.status = 'Paused';
      await campaign.save();
      break;
    }

    // Check daily limit
    const limitReached = await checkDailyLimitReached(settings);
    if (limitReached) {
      console.log(`[Queue Runner] Daily limit of ${settings.dailyLimit} reached. Suspending campaign ${campaignId}.`);
      campaign.status = 'Paused';
      await campaign.save();
      break;
    }

    // Find the first client whose status is Pending
    const client = await EmailClient.findOne({ campaignId, status: 'Pending' }).sort({ sortOrder: 1 });
    if (!client) {
      campaign.status = 'Completed';
      await campaign.save();
      console.log(`[Queue Runner] Campaign ${campaignId} completed successfully.`);
      break;
    }

    client.status = 'Sending';
    await client.save();

    const normalizedEmail = client.email.trim().toLowerCase();
    const alreadySent = await SentEmail.findOne({
      campaignId,
      normalizedEmail,
      status: { $in: ['Sent', 'Opened', 'Clicked', 'Replied'] },
      step: 0
    });

    if (alreadySent) {
      client.status = 'Already Sent';
      await client.save();
      continue;
    }

    // Find the currently saved Initial Client Email template
    const template = await EmailTemplate.findOne({ name: "Default Outreach Template" });
    const baseSubject = template ? template.subject : (campaign.subject || '');
    const baseBody = template ? template.body : (campaign.body || '');

    // Personalize content
    let personalizedBody = baseBody;
    personalizedBody = personalizedBody.replace(/\{\{client_name\}\}/g, client.name || 'there');
    personalizedBody = personalizedBody.replace(/\{\{name\}\}/g, client.name || 'there');
    personalizedBody = personalizedBody.replace(/\{\{email\}\}/g, client.email || '');
    personalizedBody = personalizedBody.replace(/\{\{company_name\}\}/g, client.company || 'your company');
    personalizedBody = personalizedBody.replace(/\{\{company\}\}/g, client.company || 'your company');
    personalizedBody = personalizedBody.replace(/\{\{service\}\}/g, client.service || 'our services');

    let personalizedSubject = baseSubject;
    personalizedSubject = personalizedSubject.replace(/\{\{client_name\}\}/g, client.name || 'there');
    personalizedSubject = personalizedSubject.replace(/\{\{name\}\}/g, client.name || 'there');
    personalizedSubject = personalizedSubject.replace(/\{\{email\}\}/g, client.email || '');
    personalizedSubject = personalizedSubject.replace(/\{\{company_name\}\}/g, client.company || 'your company');
    personalizedSubject = personalizedSubject.replace(/\{\{company\}\}/g, client.company || 'your company');
    personalizedSubject = personalizedSubject.replace(/\{\{service\}\}/g, client.service || 'our services');

    const sentEmail = new SentEmail({
      recipient: client.email,
      clientId: client._id,
      campaignId: campaign._id,
      subject: personalizedSubject,
      body: personalizedBody,
      recipientEmail: client.email,
      recipientName: client.name || '',
      normalizedEmail,
      status: 'Sending',
      sentAt: new Date(),
      step: 0
    });
    await sentEmail.save();

    let finalBody = personalizedBody;
    if (settings.trackingEnabled) {
      const openTrackingUrl = `${process.env.VITE_API_URL || 'http://localhost:4999'}/api/email-outreach/track/open/${sentEmail._id}`;
      finalBody += `<img src="${openTrackingUrl}" width="1" height="1" style="display:none;" />`;

      const linkRegex = /href="([^"]+)"/g;
      finalBody = finalBody.replace(linkRegex, (match, url) => {
        if (url.startsWith('#') || url.includes('/api/email-outreach/track')) return match;
        const trackingUrl = `${process.env.VITE_API_URL || 'http://localhost:4999'}/api/email-outreach/track/click/${sentEmail._id}?url=${encodeURIComponent(url)}`;
        return `href="${trackingUrl}"`;
      });
    }

    const activeFromEmail = settings.senderEmail || process.env.SMTP_USER || process.env.EMAIL_USER || '';
    
    // Log [EMAIL OUTREACH] SENDING
    console.log(`[EMAIL OUTREACH]\nCampaign: ${campaign.name}\nFrom: ${activeFromEmail}\nTo: ${client.email}\nStatus: SENDING`);

    try {
      const mailOptions = {
        from: `"${settings.senderName || 'Octoink Studios'} <${activeFromEmail}>"`,
        to: client.email,
        subject: personalizedSubject,
        html: finalBody
      };

      if (settings.replyTo || activeFromEmail) {
        mailOptions.replyTo = settings.replyTo || activeFromEmail;
      }

      if (campaign.attachments && campaign.attachments.length > 0) {
        mailOptions.attachments = campaign.attachments.map(att => {
          const basename = path.basename(att);
          return {
            filename: basename,
            path: path.isAbsolute(att) ? att : path.join(__dirname, att)
          };
        });
      }

      const info = await transporter.sendMail(mailOptions);

      // Log [EMAIL OUTREACH] SENT
      console.log(`[EMAIL OUTREACH]\nFrom: ${activeFromEmail}\nTo: ${client.email}\nStatus: SENT\nMessage ID: ${info.messageId}`);
      global.smtpConnectionStatus = 'Connected';

      sentEmail.messageId = info.messageId;
      sentEmail.status = 'Sent';
      sentEmail.sentAt = new Date();
      await sentEmail.save();

      client.status = 'Sent';
      client.lastEmailSent = new Date();
      client.sentFrom = activeFromEmail;
      await client.save();

      if (campaign.followUpSettings && campaign.followUpSettings.length > 0) {
        let currentDelay = 0;
        for (let i = 0; i < campaign.followUpSettings.length; i++) {
          const stepSetting = campaign.followUpSettings[i];
          currentDelay += stepSetting.delayDays;
          const sendAtTime = new Date();
          sendAtTime.setDate(sendAtTime.getDate() + currentDelay);

          const followUp = new EmailFollowUp({
            clientId: client._id,
            campaignId: campaign._id,
            step: i + 1,
            subject: stepSetting.subject,
            body: stepSetting.body,
            sendAt: sendAtTime,
            status: 'Scheduled'
          });
          await followUp.save();

          if (i === 0) {
            client.nextFollowUp = sendAtTime;
            await client.save();
          }
        }
      }
    } catch (err) {
      // Log [EMAIL OUTREACH] FAILED
      console.error(`[EMAIL OUTREACH]\nFrom: ${activeFromEmail}\nTo: ${client.email}\nStatus: FAILED\nError: ${err.message}`);
      global.smtpConnectionStatus = 'Disconnected';
      
      sentEmail.status = 'Failed';
      sentEmail.error = err.message;
      sentEmail.retryCount = (client.retryCount || 0) + 1;
      await sentEmail.save();

      client.status = 'Failed';
      client.error = err.message;
      client.retryCount = (client.retryCount || 0) + 1;
      await client.save();
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function processScheduledCampaigns() {
    const now = new Date();
    const campaigns = await EmailCampaign.find({
        status: 'Scheduled',
        scheduledTime: { $lte: now }
    });

    for (const campaign of campaigns) {
        campaign.status = 'Running';
        await campaign.save();
        runCampaignQueue(campaign._id);
    }
}

async function processScheduledFollowUps() {
    const now = new Date();
    const followUps = await EmailFollowUp.find({
        status: 'Scheduled',
        sendAt: { $lte: now }
    });

    const settings = await EmailSettings.findOne() || await EmailSettings.create({});

    if (!isWithinSendingWindow(settings)) {
        return;
    }

    for (const fu of followUps) {
        const client = await EmailClient.findById(fu.clientId);
        if (!client || client.replied === true || client.status === 'Replied' || client.status === 'Unsubscribed' || client.followUpStatus === 'Stopped — Replied') {
            fu.status = (client?.replied === true || client?.status === 'Replied' || client?.followUpStatus === 'Stopped — Replied') ? 'Stopped — Replied' : 'Cancelled';
            await fu.save();
            continue;
        }

        const campaign = await EmailCampaign.findById(fu.campaignId);
        if (!campaign || campaign.status === 'Paused' || campaign.status === 'Draft') {
            fu.status = 'Paused';
            await fu.save();
            continue;
        }

        const limitReached = await checkDailyLimitReached(settings);
        if (limitReached) {
            console.warn(`[Follow-up Scheduler] Daily limit reached (${settings.dailyLimit}). Postponing follow-up.`);
            break;
        }

        fu.status = 'Waiting';
        await fu.save();

        let personalizedBody = fu.body || '';
        personalizedBody = personalizedBody.replace(/\{\{name\}\}/g, client.name || 'there');
        personalizedBody = personalizedBody.replace(/\{\{company\}\}/g, client.company || 'your company');
        personalizedBody = personalizedBody.replace(/\{\{service\}\}/g, client.service || 'our services');

        let personalizedSubject = fu.subject || '';
        personalizedSubject = personalizedSubject.replace(/\{\{name\}\}/g, client.name || 'there');
        personalizedSubject = personalizedSubject.replace(/\{\{company\}\}/g, client.company || 'your company');
        personalizedSubject = personalizedSubject.replace(/\{\{service\}\}/g, client.service || 'our services');

        const sentEmail = new SentEmail({
            recipient: client.email,
            clientId: client._id,
            campaignId: fu.campaignId,
            subject: personalizedSubject,
            body: personalizedBody,
            recipientEmail: client.email,
            recipientName: client.name || '',
            normalizedEmail: client.email.trim().toLowerCase(),
            status: 'Sending',
            sentAt: new Date(),
            step: fu.step
        });
        await sentEmail.save();

        let finalBody = personalizedBody;
        if (settings.trackingEnabled) {
            const openTrackingUrl = `${process.env.VITE_API_URL || 'http://localhost:4999'}/api/email-outreach/track/open/${sentEmail._id}`;
            finalBody += `<img src="${openTrackingUrl}" width="1" height="1" style="display:none;" />`;

            const linkRegex = /href="([^"]+)"/g;
            finalBody = finalBody.replace(linkRegex, (match, url) => {
                if (url.startsWith('#') || url.includes('/api/email-outreach/track')) return match;
                const trackingUrl = `${process.env.VITE_API_URL || 'http://localhost:4999'}/api/email-outreach/track/click/${sentEmail._id}?url=${encodeURIComponent(url)}`;
                return `href="${trackingUrl}"`;
            });
        }

        const activeFromEmail = settings.senderEmail || process.env.SMTP_USER || process.env.EMAIL_USER || '';
        
        // Log [EMAIL OUTREACH] SENDING
        console.log(`[EMAIL OUTREACH]\nCampaign: ${campaign.name} (Follow-up Step ${fu.step})\nFrom: ${activeFromEmail}\nTo: ${client.email}\nStatus: SENDING`);

        try {
            const mailOptions = {
                from: `"${settings.senderName || 'Octoink Studios'} <${activeFromEmail}>"`,
                to: client.email,
                subject: personalizedSubject,
                html: finalBody
            };

            if (settings.replyTo || activeFromEmail) {
                mailOptions.replyTo = settings.replyTo || activeFromEmail;
            }

            const info = await transporter.sendMail(mailOptions);
            
            // Log [EMAIL OUTREACH] SENT
            console.log(`[EMAIL OUTREACH]\nFrom: ${activeFromEmail}\nTo: ${client.email}\nStatus: SENT\nMessage ID: ${info.messageId}`);
            global.smtpConnectionStatus = 'Connected';

            sentEmail.messageId = info.messageId;
            sentEmail.status = 'Sent';
            sentEmail.sentAt = new Date();
            await sentEmail.save();

            fu.sentEmailId = sentEmail._id;
            fu.status = 'Sent';
            await fu.save();

            client.lastEmailSent = new Date();
            client.sentFrom = activeFromEmail;
            
            const nextFU = await EmailFollowUp.findOne({
                clientId: client._id,
                campaignId: fu.campaignId,
                step: fu.step + 1
            });
            client.nextFollowUp = nextFU ? nextFU.sendAt : null;
            await client.save();

        } catch (err) {
            // Log [EMAIL OUTREACH] FAILED
            console.error(`[EMAIL OUTREACH]\nFrom: ${activeFromEmail}\nTo: ${client.email}\nStatus: FAILED\nError: ${err.message}`);
            global.smtpConnectionStatus = 'Disconnected';

            sentEmail.status = 'Failed';
            sentEmail.error = err.message;
            await sentEmail.save();
            fu.status = 'Cancelled';
            await fu.save();
        }
    }
}

// Start Scheduler Interval
setInterval(async () => {
    try {
        await checkReplies();
    } catch (_) {}
    try {
        await processScheduledCampaigns();
    } catch (_) {}
    try {
        await processScheduledFollowUps();
    } catch (_) {}
}, 60 * 1000);

// Background Liveness / Auto-resume Checker
setInterval(async () => {
    try {
        const runningCampaigns = await EmailCampaign.find({ status: 'Running' });
        for (const campaign of runningCampaigns) {
            if (!activeCampaignRuns.has(campaign._id.toString())) {
                console.log(`[Liveness Checker] Resuming campaign ${campaign._id} which was marked Running but not active in memory.`);
                runCampaignQueue(campaign._id);
            }
        }
    } catch (_) {}
}, 30 * 1000);

// ── START ─────────────────────────────────────────────────

// 404 catch-all — returns JSON instead of HTML
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Global error handler — returns JSON instead of HTML
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
