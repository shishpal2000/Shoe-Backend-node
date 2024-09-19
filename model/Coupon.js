const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discountValue: { type: Number, required: true },
    discountType: { type: String, required: true, enum: ['percentage', 'fixed'] },
    expirationDate: { type: Date },
    usageLimit: { type: Number },
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    usedCount: { type: Number, default: 0 },
    coupon_desc: { type: String, required: true }
});

module.exports = mongoose.model('Coupon', couponSchema);
