const express = require('express');
const router = express.Router();
const OrdersController = require('../controllers/orderController');

router.post('/create-order', OrdersController.createOrder);
router.get('/get-order/:userId', OrdersController.getOrders);

module.exports = router;
