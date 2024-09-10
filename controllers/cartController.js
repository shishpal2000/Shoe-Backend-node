const Cart = require('../model/Cart');
const Product = require('../model/Product');
const User = require('../model/User');
const Variant = require('../model/Variant');
const mongoose = require('mongoose');

exports.addToCart = async (req, res) => {
    try {
        const { userId, productId, variantId, quantity } = req.body;

        if (!userId || !productId || !variantId || quantity === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (quantity < 0) {
            return res.status(400).json({ success: false, message: 'Quantity cannot be negative' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const variant = await Variant.findById(variantId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        if (variant.product.toString() !== productId) {
            return res.status(400).json({ success: false, message: 'Variant does not belong to the specified product' });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId &&
            item.variant.toString() === variantId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            if (cart.items[itemIndex].quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
        } else {
            if (quantity > 0) {
                cart.items.push({ product: productId, variant: variantId, quantity });
            }
        }

        await cart.save();
        res.status(200).json({ success: true, data: cart });
    } catch (err) {
        console.error('Error updating cart:', err.message);
        res.status(500).json({ success: false, message: `Internal server error: ${err.message}` });
    }
};


exports.updateCartItemQuantity = async (req, res) => {
    const { userId, productId, variantId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({ message: "Invalid User ID, Product ID, or Variant ID" });
    }

    if (quantity < 0) {
        return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    try {
        // Find the user's cart
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId && item.variant.toString() === variantId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        // Update the item quantity
        if (quantity > 0) {
            cart.items[itemIndex].quantity = quantity;
        } else {
            cart.items.splice(itemIndex, 1); // Remove item if quantity is 0 or less
        }

        // Save the updated cart
        await cart.save();

        res.status(200).json({ message: "Cart updated successfully", cart });
    } catch (error) {
        console.error("Error updating cart item quantity:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        const cart = await Cart.findOne({ user: userId }).populate('items.product').populate('items.variant');

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        let totalAmount = 0;
        cart.items.forEach(item => {
            const variantPrice = item.variant.price;
            totalAmount += variantPrice * item.quantity;
        });

        res.status(200).json({
            success: true,
            data: {
                cart,
                totalAmount
            }
        });
    } catch (err) {
        console.error('Error fetching cart:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { userId, productId, variantId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const cart = await Cart.findOne({ user: userId }).populate('items.product').populate('items.variant');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
        if (productId && variantId) {
            cart.items = cart.items.filter(item =>
                item.product && item.variant &&
                item.product._id.toString() === productId &&
                item.variant._id.toString() === variantId
            );
        } else if (productId) {
            cart.items = cart.items.filter(item =>
                item.product && item.product._id.toString() !== productId
            );
        }

        if (cart.isModified('items')) {
            await cart.save();
        }
        let totalAmount = 0;
        cart.items.forEach(item => {
            const variantPrice = item.variant.price;
            totalAmount += variantPrice * item.quantity;
        });

        res.status(200).json({
            success: true,
            data: {
                cart,
                totalAmount
            }
        });
    } catch (err) {
        console.error('Error removing from cart:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

