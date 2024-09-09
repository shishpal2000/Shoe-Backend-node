const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add-wishlist', protect, WishlistController.addToWishlist);
router.get('/get-wishlist', protect, WishlistController.getWishlist);
router.delete('/remove-wishlist/:productId', protect, WishlistController.removeFromWishlist);

module.exports = router;
