const Cart = require('../model/Cart');
const Product = require('../model/Product');
const User = require('../model/User');
const Variant = require('../model/Variant');
const Coupon = require('../model/Coupon');
const mongoose = require('mongoose');

exports.applyCouponToCart = async (req, res) => {
    try {
        const { couponCode, cartItems, userId } = req.body;

        if (!couponCode || !Array.isArray(cartItems) || cartItems.length === 0 || !userId) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }

        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) return res.status(400).json({ success: false, message: 'Invalid coupon code' });

        const currentDate = new Date();
        if (coupon.expirationDate && currentDate > coupon.expirationDate) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit exceeded' });
        }

        let totalAmount = 0;
        for (const item of cartItems) {
            const product = await Product.findById(item.product);
            const variant = await Variant.findById(item.variant);
            const price = variant ? variant.price : 0;

            totalAmount += price * item.quantity;
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (totalAmount * coupon.discountValue) / 100;
        } else {
            discount = coupon.discountValue;
        }

        const finalAmount = Math.max(totalAmount - discount, 0);

        coupon.usedCount += 1;
        await coupon.save();

        const userCart = await Cart.findOne({ userId });
        if (userCart) {
            userCart.discountedTotal = finalAmount;
            userCart.couponCode = couponCode;
            await userCart.save();
        }

        res.json({ success: true, discount, finalAmount });

    } catch (error) {
        console.error('Error applying coupon:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { userId, productId, variantId, quantity } = req.body;
        if (!userId || !productId || !variantId || quantity === undefined || quantity < 0) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const variant = await Variant.findById(variantId);
        if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

        if (variant.product.toString() !== productId) {
            return res.status(400).json({ success: false, message: 'Variant does not belong to the specified product' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId &&
            item.variant.toString() === variantId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;

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
        console.error('Error adding to cart:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.updateCartItemQuantity = async (req, res) => {
    const { userId, productId, variantId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(variantId)) {
        return res.status(400).json({ success: false, message: "Invalid User ID, Product ID, or Variant ID" });
    }
    if (quantity < 0) {
        return res.status(400).json({ success: false, message: "Quantity cannot be negative" });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

        const itemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId && item.variant.toString() === variantId
        );
        if (itemIndex === -1) return res.status(404).json({ success: false, message: "Item not found in cart" });

        if (quantity > 0) {
            cart.items[itemIndex].quantity = quantity;
        } else {
            cart.items.splice(itemIndex, 1);
        }

        await cart.save();
        res.status(200).json({ success: true, message: "Cart updated successfully", cart });
    } catch (error) {
        console.error("Error updating cart item quantity:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.getCart = async (req, res) => {
    try {
        const { userId } = req.params;

        const cart = await Cart.findOne({ userId }).populate('items.product').populate('items.variant');
        if (!cart) {
            return res.status(200).json({
                success: true,
                message: "Cart is empty",
                data: { items: [], totalAmount: 0 }
            });
        }
        let totalAmount = 0;
        cart.items.forEach(item => {
            const variantPrice = item.variant.price;
            totalAmount += variantPrice * item.quantity;
        });

        res.status(200).json({ success: true, data: { cart, totalAmount } });
    } catch (err) {
        console.error('Error fetching cart:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { userId, productId, variantId } = req.params;

        if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

        const cart = await Cart.findOne({ userId }).populate('items.product').populate('items.variant');
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        cart.items = cart.items.filter(item =>
            !(item.product._id.toString() === productId && item.variant._id.toString() === variantId)
        );

        if (cart.items.length > 0) {
            await cart.save();
        } else {
            await Cart.deleteOne({ userId });
        }

        let totalAmount = 0;
        cart.items.forEach(item => {
            totalAmount += item.variant.price * item.quantity;
        });

        return res.status(200).json({ success: true, data: { cart, totalAmount } });

    } catch (error) {
        console.error('Error removing from cart:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

