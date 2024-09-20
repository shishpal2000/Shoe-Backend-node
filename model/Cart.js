const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    quantity: { type: Number, required: true, min: 1 }
});

const CartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [cartItemSchema],
    couponCode: { type: String },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountedTotal: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    totalItems: { type: Number, default: 0 } 
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
