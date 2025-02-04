const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    resetToken: { type: String },
    resetTokenExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
