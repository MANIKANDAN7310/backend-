import User from '../models/User.js';
import Client from '../models/Client.js';
import CustomDesign from '../models/CustomDesign.js';
import Download from '../models/Download.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
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
};

export const login = async (req, res) => {
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
};

export const getClients = async (req, res) => {
    try {
        // 1. Get emails/IDs of users with active engagement
        const [orderEmails, designEmails, clientEmails, orderUserIds] = await Promise.all([
            Order.distinct("clientInfo.email"),
            CustomDesign.distinct("email"),
            Client.distinct("email"),
            Order.distinct("userId")
        ]);

        const activeEmails = [...new Set([...orderEmails, ...designEmails, ...clientEmails])].filter(Boolean);
        const activeUserIds = orderUserIds.filter(Boolean);

        // 2. Find users who match engagement criteria
        const users = await User.find({
            $or: [
                { email: { $in: activeEmails } },
                { _id: { $in: activeUserIds } },
                { downloadHistory: { $exists: true, $not: { $size: 0 } } }
            ],
            isAdmin: { $ne: true }
        }).select("-password").lean().sort({ createdAt: -1 });

        // 3. For guest emails (not registered) that have custom designs or orders
        const registeredEmails = users.map(u => u.email.toLowerCase());
        const guestEmails = activeEmails.filter(email => !registeredEmails.includes(email.toLowerCase()));

        const guestUsers = guestEmails.map(email => ({
            _id: `guest_${email}`,
            client_name: email.split('@')[0].toUpperCase(),
            email: email,
            role: 'guest',
            isGuest: true,
            createdAt: new Date(),
        }));

        // 4. Combine and map
        const allClients = [...users, ...guestUsers].map(c => ({
            _id: c._id,
            client_name: c.client_name || c.name || c.email.split('@')[0],
            email: c.email,
            company_name: c.company_name || "Individual",
            location: c.location || "N/A",
            totalDownloads: c.downloadHistory?.length || (c.isGuest ? 1 : 0),
            createdAt: c.createdAt
        }));

        res.json({ success: true, clients: allClients });
    } catch (err) {
        console.error('getClients error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};


export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === 'delete-all') {
            return res.status(400).json({ success: false, message: 'Invalid ID' });
        }

        await User.findByIdAndDelete(id);
        res.json({ success: true, message: 'Client deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteAllClients = async (req, res) => {
    try {
        // As requested: Delete all client records properly
        await Client.deleteMany({});
        
        // Also clearing related data to maintain system integrity
        await User.deleteMany({ isAdmin: { $ne: true } });
        await CustomDesign.deleteMany({});
        await Download.deleteMany({});
        await Order.deleteMany({});
        
        res.status(200).json({ 
            success: true, 
            message: 'All clients deleted successfully' 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
