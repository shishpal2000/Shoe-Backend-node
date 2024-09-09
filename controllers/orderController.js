const Order = require('../model/Order');
const Cart = require('../model/Cart');
const Product = require('../model/Product');
const Address = require('../model/Address');
const User = require('../model/User');

exports.createOrder = async (req, res) => {
    try {
        const { userId, shippingAddress, billingAddress, cartItems } = req.body;

        const user = await User.findById(userId);
        console.log(">>>>>>>item", req.body);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Fetch shipping address
        const getShippingAddress = await Address.findById(shippingAddress._id);
        if (!getShippingAddress) {
            return res.status(404).json({ success: false, message: 'Shipping address not found' });
        }

        // Fetch billing address if provided
        let getBillingAddress = billingAddress 
            ? await Address.findById(billingAddress._id) 
            : getShippingAddress;

        if (billingAddress && !getBillingAddress) {
            return res.status(404).json({ success: false, message: 'Billing address not found' });
        }

        let totalAmount = 0;
        const updatedItems = [];

        // Validate and calculate total amount
        for (const item of cartItems) {
            const product = await Product.findById(item.product).populate({
                path: 'variants',
                select: 'size color gender price'
            });

            if (!product) {
                return res.status(404).json({ success: false, message: `Product not found for ID ${item.product}` });
            }

            // Extract _id from the variant object or directly from the variant field
            const variantId = item.variant._id || item.variant; // Ensure we get the ID

            // Find the matching variant in the product's variants array
            const variant = product.variants.find(v => v._id.equals(variantId));

            if (!variant) {
                return res.status(404).json({ success: false, message: `Variant not found for ID ${variantId}` });
            }

            const price = variant.price;
            totalAmount += item.quantity * price;

            // Push the updated item details to a new array
            updatedItems.push({
                product: item.product,
                variant: variant._id,  // Ensure we store the variant ID
                quantity: item.quantity,
                price: price
            });
        }

        // Create new order
        const order = new Order({
            user: userId,
            items: updatedItems,
            totalAmount,
            shippingAddress: getShippingAddress,
            billingAddress: getBillingAddress
        });

        await order.save();

        // Optionally, clear the cart after creating the order
        await Cart.findByIdAndRemove(cart._id);

        res.status(201).json({ success: true, data: order });
    } catch (err) {
        console.log("error", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ user: userId });
        res.status(200).json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
