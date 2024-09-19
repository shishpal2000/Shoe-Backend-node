const Coupon = require('../model/Coupon');
const Product = require('../model/Product');
const Variant = require('../model/Variant');

// Create a new coupon
exports.createCoupon = async (req, res) => {
    try {
        const { code, discountValue,coupon_desc, discountType, expirationDate, usageLimit, applicableCategories } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }

        const categories = Array.isArray(applicableCategories)
            ? applicableCategories
            : JSON.parse(applicableCategories);

        if (!discountValue || !discountType) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
        }

        if (!['percentage', 'fixed'].includes(discountType)) {
            return res.status(400).json({ success: false, message: 'Invalid discount type' });
        }

        const coupon = new Coupon({
            code,
            discountValue,
            discountType,
            coupon_desc,
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            usageLimit,
            applicableCategories: categories,
            usedCount: 0
        });

        await coupon.save();

        res.status(201).json({
            success: true,
            data: coupon,
            message: "Coupon created successfully"
        });

    } catch (err) {
        console.error("Error creating coupon:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update a coupon
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        res.json({ success: true, data: coupon });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all coupons
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.json({ success: true, data: coupons });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
