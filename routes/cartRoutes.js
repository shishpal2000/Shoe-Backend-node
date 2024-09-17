const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add-cart', protect, CartController.addToCart);
router.get('/get-user-cart/:userId', protect, CartController.getCart);
router.delete('/remove-cart/:userId/:productId/:variantId', protect, CartController.removeFromCart);
router.put('/update-item-quantity', protect, CartController.updateCartItemQuantity);
router.post('/apply-coupon', protect, CartController.applyCouponToCart);

module.exports = router;
