const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    product_name: { type: String, required: true, unique: true },
    product_slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
    images: [
        {
            url: { type: String, required: true },
        }
    ],
    description: { type: String, trim: true },
    sku: { type: String, required: true },
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Variant' }],
    isNewArrival: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
