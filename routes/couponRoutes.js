const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { adminMiddleware } = require('../middleware/adminMiddleware');

router.post('/create-coupon', adminMiddleware, couponController.createCoupon);
router.put('/update-coupon/:id', adminMiddleware, couponController.updateCoupon);
router.delete('/delete-coupon/:id', adminMiddleware, couponController.deleteCoupon);
router.get('/get-coupon', couponController.getAllCoupons);

module.exports = router;
