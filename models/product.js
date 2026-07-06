const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    discountPrice: {
        type: Number,
        required: true
    },
    photos: {
        type: [String],
        default: []
    },
    description: { type: String, required: true },
    stock: { type: Number, required: true },
    tags: { type: String, required: true },
    warrantyInformation: { type: String, required: true },
    shippingInformation: { type: String, required: true },
    availabilityStatus: { type: String, required: true },
    returnPolicy: { type: String, required: true },
    isFeatured: {
        type: Boolean,
        default: false
    }
});

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;