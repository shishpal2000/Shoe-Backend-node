const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    billingAddress: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    cartItems: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product.variants', required: true },

            quantity: { type: Number, required: true },
        },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, default: "Pending" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: { type: String, default: "Pending" },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
