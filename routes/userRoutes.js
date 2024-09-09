const express = require('express');
const { getUserProfile, updateUserProfile, getAllUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();
const { adminMiddleware } = require('../middleware/adminMiddleware');

router.get('/admin/users', adminMiddleware, getAllUsers);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

module.exports = router;
