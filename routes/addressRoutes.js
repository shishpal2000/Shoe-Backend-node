const express = require('express');
const router = express.Router();
const { addAddress, updateAddress, deleteAddress } = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add-addresses', protect, addAddress);
router.put('/update-addresses/:id', protect, updateAddress);
router.delete('/delete-addresses/:id', protect, deleteAddress);

module.exports = router;
