const express = require("express");
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
        const category = await Category.find();

        res.status(200).json({
            message: "fetched successfully",
            createdcategory: category
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error fetching "
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "not found get" });
        }

        res.status(200).json({ category });
    } catch (err) {
        res.status(500).json({ message: "Invalid ID format or Server Error" });
    }
});


router.post('/', async (req, res) => {
    try {


        const { name, slug, description, isActive } = req.body;

        const newCategory = await Category.create({
            name,
            slug,
            description,
            isActive,
        });

        res.status(201).json({
            success: true,
            message: " created successfully",
            category: newCategory
        });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Category.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                message: "not found delete"
            });
        }

        res.status(200).json({
            message: "deleted successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error deleting "
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updated = await Category.findByIdAndUpdate(id, data, {
            new: true
        });

        if (!updated) {
            return res.status(404).json({
                message: "not found put"
            });
        }

        res.status(200).json({
            message: "updated successfully",
            category: updated
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error updating"
        });
    }
});

module.exports = router;