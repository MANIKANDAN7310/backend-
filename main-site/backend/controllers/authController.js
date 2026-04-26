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
        // Models are now imported at the top
        
        // 1. Get all unique emails from custom designs
        const customEmails = await CustomDesign.distinct('email');
        
        // 2. Get all unique userIds from product collection
        const productUserIds = await Product.find({
            $or: [
                { isCustomDesign: true },
                { uploadedByUser: true }
            ]
        }).distinct('userId');
        
        // 3. Get registered users with these emails OR userIds
        const registeredUsers = await User.find({ 
            $or: [
                { email: { $in: customEmails } },
                { _id: { $in: productUserIds } }
            ]
        })
            .select("-password")
            .lean();
        
        // 4. For emails that don't have a registered user, create guest entries
        const registeredEmails = registeredUsers.map(u => u.email.toLowerCase());
        const guestEmails = customEmails.filter(email => !registeredEmails.includes(email.toLowerCase()));
        
        const guestUsers = guestEmails.map(email => ({
            _id: `guest_${email}`,
            name: email.split('@')[0].toUpperCase(),
            email: email,
            role: 'guest',
            isGuest: true,
            createdAt: new Date(),
        }));

        // Combine
        const allClients = [...registeredUsers, ...guestUsers];
        
        // Add client_name field for dashboard compatibility
        allClients.forEach(c => {
            if (!c.client_name) c.client_name = c.name || 'Anonymous';
        });

        res.json({ success: true, clients: allClients });

    } catch (err) {
        console.error('getClients error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};


export const deleteClient = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteAllClients = async (req, res) => {
    try {
        // Delete all users except admins
        await User.deleteMany({ isAdmin: { $ne: true } });
        
        // Delete all client tracking records
        await Client.deleteMany({});
        
        // Delete all related transactional data
        await CustomDesign.deleteMany({});
        await Download.deleteMany({});
        await Order.deleteMany({});
        
        res.json({ 
            success: true, 
            message: 'All client records and related data cleared successfully (Admin accounts preserved)' 
        });
    } catch (err) {
        console.error("Delete All Clients Error:", err);
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
