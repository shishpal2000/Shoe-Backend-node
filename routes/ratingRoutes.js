const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

router.post('/rate', protect, RatingController.submitRating);
router.get('/ratings/:productId', RatingController.getRatings);
router.patch('/ratings/:ratingId/approve', adminMiddleware, RatingController.approveRating);
router.get('/get-all-ratings', RatingController.getAllRatings);

module.exports = router;
