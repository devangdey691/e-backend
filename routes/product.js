const express = require("express");
const Product = require("../models/product");
const multer = require("multer");
const path = require("path");
const Category = require("../models/category");

const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate({
            path: "category",
            select: "name",
            model: "Category"
        });

        res.status(200).json({
            message: "Products fetched successfully",
            createdProducts: products
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching products"
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate({
            path: "category",
            select: "name",
            model: "Category"
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ product });
    } catch (err) {
        res.status(500).json({ message: "Invalid ID format or Server Error" });
    }
});

router.post("/", upload.array("photos", 10), async (req, res) => {
    try {
        const {
            name,
            price,
            category,
            discountPrice,
            description,
            stock,
            tags,
            warrantyInformation,
            shippingInformation,
            availabilityStatus,
            returnPolicy,
            isFeatured,
        } = req.body;

        const uploadedPhotos = req.files
            ? req.files.map((file) => `/uploads/${file.filename}`)
            : [];

        const newProduct = await Product.create({
            name,
            price,
            category,
            discountPrice: discountPrice || 0,
            photos: uploadedPhotos,
            description,
            stock,
            tags,
            warrantyInformation,
            shippingInformation,
            availabilityStatus,
            returnPolicy,
            isFeatured: isFeatured === "true",
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProduct,
        });
    } catch (error) {
        console.error("Backend Error:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Product.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error deleting product"
        });
    }
});

router.put(
    "/:id",
    upload.array("photos", 5),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Destructure explicitly to separate text fields from existingPhotos array
            const {
                name,
                price,
                category,
                discountPrice,
                description,
                stock,
                tags,
                warrantyInformation,
                shippingInformation,
                availabilityStatus,
                returnPolicy,
                isFeatured,
                existingPhotos
            } = req.body;

            let finalizedPhotos = [];

            // 1. Recover existing images sent back from frontend
            if (existingPhotos) {
                if (Array.isArray(existingPhotos)) {
                    finalizedPhotos = [...existingPhotos];
                } else {
                    finalizedPhotos = [existingPhotos];
                }
            }

            // 2. Map new photos to use the exact same formatting prefix as your POST route ('/uploads/')
            if (req.files && req.files.length > 0) {
                const newPhotos = req.files.map((file) => `/uploads/${file.filename}`);
                finalizedPhotos = [...finalizedPhotos, ...newPhotos];
            }

            // 3. Explicitly construct your database update object map 
            const updateFields = {
                name,
                price: Number(price),
                category,
                discountPrice: Number(discountPrice) || 0,
                description,
                stock: Number(stock),
                tags,
                warrantyInformation,
                shippingInformation,
                availabilityStatus,
                returnPolicy,
                isFeatured: isFeatured === "true" || isFeatured === true,
                photos: finalizedPhotos // Ensures the clean compiled array gets saved
            };

            // 4. Update MongoDB with clean object data map
            const updatedProduct = await Product.findByIdAndUpdate(
                id,
                { $set: updateFields },
                {
                    new: true,
                    runValidators: true,
                }
            );

            if (!updatedProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            console.log("UPDATED PRODUCT SUCCESSFULLY:", updatedProduct);

            res.status(200).json({
                success: true,
                message: "Product updated successfully",
                product: updatedProduct,
            });
        } catch (error) {
            console.error("UPDATE ERROR:", error);

            res.status(500).json({
                success: false,
                message: error.message || "Failed to update product",
            });
        }
    }
);
module.exports = router;