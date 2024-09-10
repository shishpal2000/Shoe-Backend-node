const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

router.post('/create-payment-order', PaymentController.createPaymentOrder);
router.post('/verify-payment', PaymentController.verifyPayment);
router.post('/payment-failure', PaymentController.paymentFailure);
router.get('/get-payment-details', PaymentController.getPaymentDetails);

module.exports = router;
