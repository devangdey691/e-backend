const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/orderschema");
const User = require("../models/User");
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendAdminOrderNotificationEmail } = require('../utils/sendEmail');

const router = express.Router();

// Middleware helper to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: "Unauthorized: Please log in to perform this action.",
    });
};

router.get("/my-orders", isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;

        console.log("=================================");
        console.log("Authenticated User ID for orders:", userId);
        console.log("=================================");

        const orders = await Order.find({ userId }).sort({ createdAt: -1 });

        console.log("Orders Found:", orders.length);

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });

    } catch (error) {
        console.error("Error fetching filtered orders:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Could not retrieve order history.",
            error: error.message,
        });
    }
});

router.post("/create", isAuthenticated, async (req, res) => {
    try {
        const { items, total, address, phone, paymentMethod, status } = req.body;
        const userId = req.user._id;

        console.log("========== NEW ORDER ==========");
        console.log("UserId:", userId);
        console.log("Items:", items);
        console.log("Total:", total);
        console.log("Address:", address);
        console.log("Phone:", phone);
        console.log("Payment Method:", paymentMethod);
        console.log("===============================");

        if (!items || items.length === 0 || !total || !address || !phone) {
            return res.status(400).json({
                success: false,
                message: "Please provide all checkout details: items, total price, shipping address, and phone number.",
            });
        }

        const newOrder = new Order({
            userId,
            items,
            total,
            address,
            phone,
            paymentMethod: paymentMethod || "COD",
            status: status || "Processing",
        });

        const savedOrder = await newOrder.save();

        // Proactively clear user's cart in database upon order placement
        await User.findByIdAndUpdate(userId, { cart: [] });

        console.log("Saved Order UserId:", savedOrder.userId);

        // Send order confirmation email asynchronously
        sendOrderConfirmationEmail(req.user, savedOrder).catch(err => console.error("Error sending order confirmation email:", err));

        // Send order notification email to admin asynchronously
        sendAdminOrderNotificationEmail(req.user, savedOrder).catch(err => console.error("Error sending admin order notification email:", err));

        res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            order: savedOrder,
        });
    } catch (error) {
        console.error("Error creating order:", error.message);
        res.status(500).json({
            success: false,
            message: "Server Error: Complete purchase action failed.",
            error: error.message,
        });
    }
});

// GET all orders (for admin panel)
router.get("/all", isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Could not retrieve all orders.",
            error: error.message,
        });
    }
});

// UPDATE order status (for admin panel)
router.patch("/status/:id", isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Please provide a status to update.",
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate("userId", "name email");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        // Send order status update email asynchronously
        if (order.userId) {
            sendOrderStatusUpdateEmail(order.userId, order).catch(err => console.error("Error sending order status update email:", err));
        }

        res.status(200).json({
            success: true,
            message: "Order status updated successfully!",
            order,
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: Could not update order status.",
            error: error.message,
        });
    }
});

module.exports = router;