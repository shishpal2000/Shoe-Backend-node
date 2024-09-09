const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    country: { type: String, required: true },
    company: { type: String },
    streetAddress: { type: String, required: true },
    aptSuiteUnit: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    phone: { type: String, required: true },
    postalCode: { type: String, required: true },
    deliveryInstruction: { type: String },
    isDefaultShipping: { type: Boolean, default: false },
    isDefaultBilling: { type: Boolean, default: false },
    type: { type: String, enum: ['Shipping', 'Billing'], required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Address', AddressSchema);
