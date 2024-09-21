const Order = require('../model/Order');
const Address = require('../model/Address');
const User = require('../model/User');
const Cart = require('../model/Cart')
const Product = require('../model/Product');
const Variant = require('../model/Variant')


const generateOrderNumber = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    return `ORD_#${randomDigits}`;
};
exports.createOrder = async (req, res) => {
    try {
        const { userId, shippingAddress, billingAddress } = req.body;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch cart for the user
        const cart = await Cart.findOne({ userId, isActive: true }).populate('items.variant');
        if (!cart || !cart.subtotal || !cart.discountedTotal) {
            return res.status(400).json({ success: false, message: 'Cart not found or total missing' });
        }

        // Handle addresses (update if existing, otherwise create new)
        const handleAddress = async (address, type) => {
            if (address._id) {
                return await Address.findByIdAndUpdate(address._id, { ...address, type }, { new: true });
            } else {
                return await new Address({ ...address, userId, type }).save();
            }
        };

        const shippingAddr = await handleAddress(shippingAddress, 'Shipping');
        const billingAddr = await handleAddress(billingAddress, 'Billing');

        // Use cart totals
        const totalAmount = cart.subtotal; // Total before discount
        const discount = cart.discount;    // Applied discount
        const finalTotal = cart.discountedTotal;  // Final total after discount

        // Generate order number
        const orderNumber = generateOrderNumber();
        const orderItems = cart.items.map(item => ({
            product: item.product._id, // Adjust based on your schema
            variantId: item.variant ? item.variant._id : null, // Ensure variantId is present
            quantity: item.quantity,
        }));
        // Create the order
        const order = new Order({
            userId,
            cartItems: orderItems.filter(item => item.variantId !== null),
            totalAmount,
            discount,
            finalTotal,
            couponCode: cart.couponCode,
            shippingAddress: shippingAddr,
            billingAddress: billingAddr,
            orderNumber,
            status: 'Pending',
        });

        await order.save();

        cart.isActive = false;
        await cart.save();

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
        const order = await Order.findById(orderId).populate('cartItems.product').populate('cartItems.variantId'); // Populate relevant fields

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const cartItemsWithDetails = await Promise.all(order.cartItems.map(async (item) => {
            const product = await Product.findById(item.product).select('product_name');
            const variant = await Variant.findById(item.variantId).select('price');

            return {
                productName: product ? product.product_name : 'Unknown Product',
                price: variant ? variant.price : 0,
                quantity: item.quantity,
            };
        }));

        res.status(200).json({ success: true, order: { ...order._doc, cartItems: cartItemsWithDetails } });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({ success: false, message: error.message });
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