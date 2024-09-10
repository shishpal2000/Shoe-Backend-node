const Payment = require('../model/Payment');
const Order = require('../model/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createPaymentOrder = async (req, res) => {
    try {
        const { orderId, userId, amount, notes } = req.body;
        console.log('req bodyyyyyyy ', orderId, userId, amount, notes);
        console.log(req.body);
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `order_rcptid_${orderId}`,
            notes: {
                ...notes
            }
        });

        order.razorpayOrderId = razorpayOrder.id;
        order.paymentStatus = 'Pending';
        await order.save();

        const payment = new Payment({
            orderId: order._id,
            userId: userId,
            razorpayOrderId: razorpayOrder.id,
            paymentStatus: 'Pending',
            amount: amount,
            currency: 'INR',
            notes: razorpayOrder.notes
        });
        await payment.save();

        res.status(201).json({
            success: true,
            razorpayOrder
        });
    } catch (error) {
        console.error("Error creating payment order:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        console.log(">>>>>>>>>>", req.body);
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
        console.log("Generated Signature:", generatedSignature);
        console.log("Received Signature:", razorpaySignature);

        // Find and update the Payment record
        const payment = await Payment.findOne({ razorpayOrderId });
        if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

        // Update payment details
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.razorpaySignature = razorpaySignature;
        payment.paymentStatus = 'Paid';
        await payment.save();

        // Find and update the associated Order
        const order = await Order.findById(payment.orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        order.paymentStatus = 'Paid';
        order.status = 'Paid';
        await order.save();

        res.status(200).json({ success: true, message: 'Payment verified and order updated' });
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.paymentFailure = async (req, res) => {
    try {
        const { razorpayOrderId } = req.body;

        const payment = await Payment.findOne({ razorpayOrderId });
        if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

        payment.paymentStatus = 'Failed';
        await payment.save();

        res.status(200).json({ success: true, message: 'Payment marked as failed' });
    } catch (error) {
        console.error("Error handling payment failure:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPaymentDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const payment = await Payment.findOne({ orderId });
        if (!payment) return res.status(404).json({ success: false, message: 'Payment details not found' });

        res.status(200).json({ success: true, payment });
    } catch (error) {
        console.error("Error fetching payment details:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
