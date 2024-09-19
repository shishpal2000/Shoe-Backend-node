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
    video_url: { type: String, },
    sku: { type: String, required: true },
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Variant' }],
    isNewArrival: { type: Boolean, default: false },
    ratingsAverage: { type: Number, default: 0 },
    ratingsQuantity: { type: Number, default: 0 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],

}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
