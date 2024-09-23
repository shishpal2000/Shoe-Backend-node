const express = require('express');
const router = express.Router();
const OrdersController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', OrdersController.createOrder);
router.get('/get-order/:id', protect, OrdersController.getOrderById);
router.get('/get-all-orders', OrdersController.getAllOrders);
router.get('/user-orders/:userId', protect, OrdersController.getUserOrders);

module.exports = router;
