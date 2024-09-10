const express = require('express');
const router = express.Router();
const OrdersController = require('../controllers/orderController');

router.post('/create-order', OrdersController.createOrder);
router.get('/get-order/:id', OrdersController.getOrderById);
router.get('/get-all-orders', OrdersController.getAllOrders);

module.exports = router;
