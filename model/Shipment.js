const mongoose = require('mongoose');

const ShippingSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    shippingNumber: { type: String, required: true, unique: true },
    totalQuantity: { type: Number, required: true },
    shipmentAddress: { type: mongoose.Schema.Types.ObjectId, ref: "Address", required: true },
    orderDate: { type: Date, required: true },
    shipmentDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Shipping', ShippingSchema);
