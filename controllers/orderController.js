const Order = require('../model/Order');
const Cart = require('../model/Cart');
const Product = require('../model/Product');
const Address = require('../model/Address');
const User = require('../model/User');

exports.createOrder = async (req, res) => {
    try {
        const { userId, cartItems, shippingAddress, billingAddress } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'No cart items provided' });
        }

        const handleAddress = async (address, type) => {
            if (address._id) {
                return await Address.findByIdAndUpdate(address._id, { ...address, type }, { new: true });
            } else {
                return await new Address({ ...address, userId, type }).save();
            }
        };

        const shippingAddr = await handleAddress(shippingAddress, 'Shipping');
        const billingAddr = await handleAddress(billingAddress, 'Billing');

        let totalAmount = 0;
        const updatedItems = [];

        for (const item of cartItems) {
            if (!item || !item.product) {
                console.error('Invalid cart item:', item);
                return res.status(400).json({ success: false, message: 'Invalid cart item' });
            }

            const product = await Product.findById(item.product);
            if (!product) {
                console.error('Product not found for ID:', item.product);
                return res.status(404).json({ success: false, message: `Product not found for ID ${item.product}` });
            }

            if (!Array.isArray(product.variants)) {
                console.error('Product variants is not an array:', product.variants);
                return res.status(400).json({ success: false, message: 'Invalid product variants' });
            }

            if (!item.variant) {
                console.error('Variant ID not provided for cart item:', item);
                return res.status(400).json({ success: false, message: 'Variant ID not provided' });
            }

            const variant = product.variants.find(v => v._id.toString() === item.variant.toString());
            console.log('Variant Data:', variant); // Log variant data

            if (!variant || !variant.price || !variant.size) {
                console.error('Variant is missing required fields:', variant);
                return res.status(400).json({ success: false, message: `Variant is missing required fields (price: ${variant ? variant.price : 'undefined'}, size: ${variant ? variant.size : 'undefined'})` });
            }

            const price = variant.price;
            totalAmount += item.quantity * price;

            updatedItems.push({
                product: item.product,
                variantId: item.variant, // Corrected field name
                quantity: item.quantity
            });
        }

        const order = new Order({
            userId,
            cartItems: updatedItems,
            totalAmount,
            shippingAddress: shippingAddr,
            billingAddress: billingAddr,
            status: 'pending'
        });

        await order.save();

        res.status(201).json({ success: true, orderId: order._id });
    } catch (err) {
        console.error("Error creating order:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get a specific order by orderId
exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log(`Fetching order with ID: ${orderId}`);
        const order = await Order.findById(orderId)
            .populate('shippingAddress')
            .populate('billingAddress')
            .populate('cartItems.product');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.status(200).json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all orders (admin functionality)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};