const Order = require('../model/Order');
const Product = require('../model/Product');
const Address = require('../model/Address');
const User = require('../model/User');
const Variant = require('../model/Variant');

const generateOrderNumber = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    return `ORD_${randomDigits}`;
};

exports.createOrder = async (req, res) => {
    try {
        const { userId, cartItems, shippingAddress, billingAddress, couponCode } = req.body;

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
            if (!variant || !variant.price || !variant.size) {
                console.error('Variant is missing required fields:', variant);
                return res.status(400).json({ success: false, message: `Variant is missing required fields` });
            }

            const price = variant.price;
            totalAmount += item.quantity * price;

            updatedItems.push({
                product: item.product,
                variantId: item.variant,
                quantity: item.quantity
            });
        }

        let discount = 0;
        if (couponCode) {
        }

        const finalTotal = totalAmount - discount;
        const orderNumber = generateOrderNumber();

        const order = new Order({
            userId,
            cartItems: updatedItems,
            totalAmount,
            discount,
            finalTotal,
            couponCode,
            shippingAddress: shippingAddr,
            billingAddress: billingAddr,
            orderNumber,
            status: 'Pending'
        });

        await order.save();

        res.status(201).json({ success: true, orderId: order._id, orderNumber });
    } catch (err) {
        console.error("Error creating order:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};


// Get a specific order by orderId
exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId)
            .populate('shippingAddress')
            .populate('billingAddress')
            .populate({
                path: 'cartItems.product',
                select: 'product_name product_slug images description ratingsAverage ratingsQuantity',
                strictPopulate: false
            })
            .populate({
                path: 'cartItems.variantId',
                select: 'size color price quantity',
                strictPopulate: false
            });
        console.log(order.cartItems);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

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