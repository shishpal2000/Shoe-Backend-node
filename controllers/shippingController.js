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

exports.getAllShipments = async (req, res) => {
    try {
        const shipments = await Shipping.find().populate('orderId').exec();
        res.status(200).json({ success: true, shipments });
    } catch (err) {
        console.error("Error fetching shipments:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getShipmentById = async (req, res) => {
    const { id } = req.params;
    try {
        const shipment = await Shipping.findById(id).populate('orderId').exec();
        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }
        res.status(200).json({ success: true, shipment });
    } catch (err) {
        console.error("Error fetching shipment:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteShipment = async (req, res) => {
    const { id } = req.params;
    try {
        const shipment = await Shipping.findByIdAndDelete(id);
        if (!shipment) {
            return res.status(404).json({ success: false, message: 'Shipment not found' });
        }
        res.status(200).json({ success: true, message: 'Shipment deleted successfully' });
    } catch (err) {
        console.error("Error deleting shipment:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

