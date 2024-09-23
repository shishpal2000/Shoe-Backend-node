const express = require('express');
const router = express.Router();
const OrdersController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-order', OrdersController.createOrder);
router.get('/get-order/:id', protect, OrdersController.getOrderById);
router.get('/get-all-orders', protect, OrdersController.getAllOrders);
router.get('/user-orders/:userId', OrdersController.getUserOrders);

module.exports = router;
