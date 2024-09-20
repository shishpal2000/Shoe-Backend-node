const express = require('express');
const ShippingController = require('../controllers/shippingController');
const router = express.Router();

router.post('/create-shipping', ShippingController.createShipping);

module.exports = router;
