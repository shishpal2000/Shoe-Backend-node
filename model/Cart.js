const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    quantity: { type: Number, required: true, min: 1 }
});

const CartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [cartItemSchema],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
