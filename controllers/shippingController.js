const Shipping = require('../model/Shipment');
const Order = require('../model/Order');

const generateShippingNumber = () => {
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    console.log('randomNumber', randomNumber)
    return `SHIP_#${randomNumber}`;
};

exports.createShipping = async (req, res) => {
    console.log('Request body:', req.body);
    try {
        const { orderId, shipmentAddress } = req.body;

        if (!orderId || !shipmentAddress) {
            return res.status(400).json({ success: false, message: 'Order ID and shipment address are required' });
        }

        const order = await Order.findById(orderId).populate('shippingAddress').exec();
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const totalQuantity = order.cartItems.reduce((total, item) => total + item.quantity, 0);

        const shippingNumber = generateShippingNumber();

        const shippingDetails = new Shipping({
            orderId: order._id,
            shippingNumber: shippingNumber,
            totalQuantity: totalQuantity,
            shipmentAddress: shipmentAddress,
            orderDate: order.createdAt,
            shipmentDate: new Date()
        });

        console.log('Shipping details to be saved:', shippingDetails);

        await shippingDetails.save();

        res.status(201).json({ success: true, shippingId: shippingDetails._id, message: 'Shipping details created successfully' });
    } catch (err) {
        console.error("Error creating shipping:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

