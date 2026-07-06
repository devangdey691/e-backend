const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Product = require('../models/product');
const isAuthenticated = require('../middleware/isAuthenticated');
const { sendWelcomeEmail, sendLoginEmail } = require('../utils/sendEmail');

// Ensure profilephoto upload directory exists
const uploadDir = path.join(__dirname, '../uploads/profilephoto');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config for Profile Photo
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profilephoto/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// GET all users (excluding passwords)
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();


        console.log(newUser);
        

        // Send welcome email asynchronously
        sendWelcomeEmail(newUser).catch(err => console.error("Error sending welcome email:", err));

        res.status(201).json({ message: "User registered successfully", user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: info ? info.message : "Invalid credentials",
            });
        }

        req.login(user, (err) => {
            if (err) {
                return next(err);
            }

            // Send login email asynchronously
            sendLoginEmail(user).catch(err => console.error("Error sending login email:", err));

            return res.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    cart: user.cart,
                    profilePhoto: user.profilePhoto
                },
            });
        });
    })(req, res, next);
});

// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }

        res.json({
            success: true,
            message: "Logged out successfully",
        });
    });
});

// GET user cart
router.get('/cart', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'cart.product',
            populate: {
                path: 'category'
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Map database cart items to structure expected by frontend (product fields at root, plus quantity)
        const formattedCart = user.cart.map(item => {
            if (!item.product) return null;
            return {
                ...item.product.toObject(),
                quantity: item.quantity
            };
        }).filter(Boolean);

        res.status(200).json({ cart: formattedCart });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// PATCH user cart (sync frontend cart to MongoDB)
router.patch('/cart', isAuthenticated, async (req, res) => {
    try {
        const { cartItems } = req.body;
        if (!Array.isArray(cartItems)) {
            return res.status(400).json({ message: "cartItems must be an array" });
        }

        // Map frontend cartItems back to database schema structure
        const cart = cartItems.map(item => ({
            product: item._id,
            quantity: item.quantity || 1
        }));

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { cart },
            { new: true }
        ).populate('cart.product');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const formattedCart = user.cart.map(item => {
            if (!item.product) return null;
            return {
                ...item.product.toObject(),
                quantity: item.quantity
            };
        }).filter(Boolean);

        res.status(200).json({ cart: formattedCart });
    } catch (error) {
        console.error("Error syncing cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// PATCH profile photo
router.patch('/profile-photo', isAuthenticated, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No photo uploaded" });
        }

        const photoPath = `/uploads/profilephoto/${req.file.filename}`;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete old photo if it exists
        if (user.profilePhoto) {
            const normalizedPath = path.normalize(user.profilePhoto).replace(/^(\.\.(\/|\\))+/, '');
            const oldPhotoPath = path.join(__dirname, '..', normalizedPath);
            if (fs.existsSync(oldPhotoPath)) {
                try {
                    fs.unlinkSync(oldPhotoPath);
                } catch (err) {
                    console.error("Error deleting old profile photo:", err);
                }
            }
        }

        user.profilePhoto = photoPath;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile photo updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                cart: user.cart,
                profilePhoto: user.profilePhoto
            }
        });
    } catch (error) {
        console.error("Error uploading profile photo:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET a single user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password').populate('cart.product');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// DELETE a user by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // Optionally delete profile photo if it exists
        if (deletedUser.profilePhoto) {
            const normalizedPath = path.normalize(deletedUser.profilePhoto).replace(/^(\.\.(\/|\\))+/, '');
            const photoPath = path.join(__dirname, '..', normalizedPath);
            if (fs.existsSync(photoPath)) {
                try {
                    fs.unlinkSync(photoPath);
                } catch (err) {
                    console.error("Error deleting user profile photo during deletion:", err);
                }
            }
        }
        res.status(200).json({ message: "User deleted successfully!" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
