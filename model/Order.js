const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shippingAddress: {
        firstName: String,
        lastName: String,
        streetAddress: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        phone: String,
    },
    billingAddress: {
        firstName: String,
        lastName: String,
        streetAddress: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
        phone: String,
    },
    cartItems: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            variant: {
                size: String,
                price: Number,
            },
            quantity: Number,
        },
    ],
    totalAmount: Number,
    status: { type: String, default: "Pending" },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
