const Shipping = require('../model/Shipment');
const Order = require('../model/Order');

const generateShippingNumber = () => {
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    console.log('randomNumber', randomNumber)
    return `SHIP_#${randomNumber}`;
};

exports.createShipping = async (req, res) => {
    console.log('Request received to create shipping');
    try {
        const { orderId, shipmentAddress } = req.body;
        console.log('order ', orderId, 'shipmentAddress', shipmentAddress);
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        console.log('order>>>>', order);

        const totalQuantity = order.cartItems.reduce((total, item) => total + item.quantity, 0);
        const shippingNumber = generateShippingNumber();
        console.log('shippingNumber', shippingNumber)
        const shippingDetails = new Shipping({
            orderId: order._id,
            shippingNumber: shippingNumber,
            totalQuantity: totalQuantity,
            shipmentAddress: shipmentAddress,
            orderDate: order.createdAt,
            shipmentDate: new Date()
        });

        console.log('shipping >>>>>>', shippingDetails)

        await shippingDetails.save();

        res.status(201).json({ success: true, shippingId: shippingDetails._id, message: 'Shipping details created successfully' });
    } catch (err) {
        console.error("Error creating shipping:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
