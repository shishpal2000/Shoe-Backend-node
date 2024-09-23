const mongoose = require('mongoose');

const contactInfoSchema = new mongoose.Schema({
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true }
});

module.exports = mongoose.model('ContactInfo', contactInfoSchema);