const Order = require('../model/Order');
const Cart = require('../model/Cart');
const Product = require('../model/Product');
const Address = require('../model/Address');
const User = require('../model/User');
const mongoose = require('mongoose');

exports.createOrder = async (req, res) => {
    try {
        const { userId, cartItems } = req.body;

       
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        console.log(user);
        const cart = await Cart.findOne({ user: userId }).populate('items.product').populate('items.variant');
        if (!cart || !cart.items.length) return res.status(404).json({ success: false, message: 'Cart is empty or not found' });
        console.log(cart);
        const shippingAddress = await Address.findOne({ isDefaultShipping: true });
        if (!shippingAddress) return res.status(404).json({ success: false, message: 'Shipping address not found' });
        console.log('shipping', shippingAddress);
        const billingAddress = await Address.findOne({ isDefaultBilling: true }) || shippingAddress;
        console.log(billingAddress);

        let amount = 0;
        const updatedItems = [];

        for (const item of cartItems) {
            const product = await Product.findById(item.product).populate('variants');
            if (!product) return res.status(404).json({ success: false, message: `Product not found for ID ${item.product}` });

            const variant = product.variants.find(v => v._id.equals(item.variant));
            if (!variant) return res.status(404).json({ success: false, message: `Variant not found for ID ${item.variant}` });

            const price = variant.price;
            amount += item.quantity * price;

            updatedItems.push({
                product: item.product,
                variant: variant._id,
                quantity: item.quantity,
                price: price
            });
        }
        console.log("Cart found: ", cart);
        console.log("Cart items: ", cart.items);
        // Create a new order
        const order = new Order({
            user: userId,
            items: updatedItems,
            amount,
            shippingAddress: {
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                streetAddress: shippingAddress.streetAddress,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country,
                phone: shippingAddress.phone
            },
            billingAddress: {
                firstName: billingAddress.firstName,
                lastName: billingAddress.lastName,
                streetAddress: billingAddress.streetAddress,
                city: billingAddress.city,
                state: billingAddress.state,
                postalCode: billingAddress.postalCode,
                country: billingAddress.country,
                phone: billingAddress.phone
            },
            cartItems: updatedItems
        });

        // Save the order
        await order.save();

        // Optionally clear the user's cart after successful order creation
        // await Cart.findByIdAndDelete(cart._id);

        res.status(201).json({ success: true, orderId: order._id });
    } catch (err) {
        console.log("Error", err);
        res.status(500).json({ success: false, message: err.message });
    }
};


// Get a specific order by orderId
exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log(`Fetching order with ID: ${orderId}`);
        const order = await Order.findById(orderId);
        console.log('Order found:', order);
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