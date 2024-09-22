const express = require('express');
const ShippingController = require('../controllers/shippingController');
const router = express.Router();

router.post('/create-shipping', ShippingController.createShipping);
router.get('/get-all-shipping', ShippingController.getAllShipments);
router.get('/get-shipping/:id', ShippingController.getShipmentById);
router.delete('/delete-shipping/:id', ShippingController.deleteShipment);

module.exports = router;
