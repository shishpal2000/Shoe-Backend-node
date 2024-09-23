const Cart = require('../model/Cart');
const Product = require('../model/Product');
const User = require('../model/User');
const Variant = require('../model/Variant');
const Coupon = require('../model/Coupon');
const mongoose = require('mongoose');
const Order = require('../model/Order');

const calculateCartTotals = async (cart) => {
    let totalAmount = 0;
    let totalItems = new Set();

    const variantPromises = cart.items.map(item => Variant.findById(item.variant));
    const variants = await Promise.all(variantPromises);

    for (const [index, variant] of variants.entries()) {
        if (variant) {
            totalAmount += variant.price * cart.items[index].quantity;
            totalItems.add(cart.items[index].product.toString());
        }
    }

    return { totalAmount, totalItems: totalItems.size };
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

        const { totalAmount, totalItems } = await calculateCartTotals(cart);

        cart.subtotal = totalAmount;
        cart.discount = 0;
        cart.discountedTotal = totalAmount;
        cart.couponCode = null;

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
        const cart = await Cart.findOne({ userId }).populate('items.product items.variant');
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });


        const itemIndex = cart.items.findIndex(item =>
            item.product._id.toString() === productId && item.variant._id.toString() === variantId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        if (quantity > 0) {
            cart.items[itemIndex].quantity = quantity;
        } else {
            cart.items.splice(itemIndex, 1);
        }

        const { totalAmount, totalItems } = await calculateCartTotals(cart);
        cart.subtotal = totalAmount;
        cart.discountedTotal = totalAmount;
        cart.discount = 0;
        cart.couponCode = null;

        await cart.save();
        res.status(200).json({ success: true, message: "Cart updated successfully", cart });
    } catch (error) {
        console.error("Error updating cart item quantity:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.applyCouponToCart = async (req, res) => {
    try {
        const { couponCode, userId } = req.body;

        if (!userId || !couponCode) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        const { totalAmount, totalItems } = await calculateCartTotals(cart);

        let discount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (!coupon) {
                return res.status(400).json({ success: false, message: 'Invalid coupon code' });
            }

            const currentDate = new Date();
            if (coupon.expirationDate && currentDate > coupon.expirationDate) {
                return res.status(400).json({ success: false, message: 'Coupon has expired' });
            }

            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({ success: false, message: 'Coupon usage limit exceeded' });
            }

            if (coupon.discountType === 'percentage') {
                discount = (totalAmount * coupon.discountValue) / 100;
            } else if (coupon.discountType === 'fixed') {
                discount = coupon.discountValue;
            }

            coupon.usedCount += 1;
            await coupon.save();
        }

        const finalAmount = Math.max(totalAmount - discount, 0);

        cart.subtotal = totalAmount;
        cart.discountedTotal = finalAmount;
        cart.discount = discount;
        cart.couponCode = couponCode || null;
        cart.totalItems = totalItems; // Update total items

        await cart.save();

        return res.json({ success: true, discount, finalAmount, subtotal: totalAmount, totalItems });

    } catch (error) {
        console.error('Error applying coupon:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.removeCouponFromCart = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Invalid input' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        cart.discountedTotal = 0;
        cart.discount = 0;
        cart.couponCode = null;
        cart.totalItems = cart.items.length;

        const { totalAmount } = await calculateCartTotals(cart);
        cart.subtotal = totalAmount;

        await cart.save();

        return res.json({ success: true, message: 'Coupon removed', cart });
    } catch (error) {
        console.error('Error removing coupon:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
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
                data: { items: [], totalAmount: 0, subtotal: 0, discount: 0, couponCode: null }
            });
        }

        let totalAmount = cart.discountedTotal > 0 ? cart.discountedTotal : cart.subtotal;
        let subtotal = cart.subtotal;

        res.status(200).json({
            success: true,
            data: {
                cart,
                totalAmount,
                subtotal,
                discount: cart.discount || 0,
                couponCode: cart.couponCode || null
            }
        });
    } catch (err) {
        console.error('Error fetching cart:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.removeFromCart = async (req, res) => {
    const { userId, productId, variantId } = req.params;

    if (!userId || !variantId) {
        return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const updatedItems = cart.items.filter(item => item.variant._id.toString() !== variantId);
        cart.items = updatedItems;

        cart.totalItems = updatedItems.length;

        const { subtotal, discountedTotal } = await calculateCartTotals(cart);
        cart.subtotal = subtotal;
        cart.discountedTotal = discountedTotal;

        await cart.save();

        res.json({ success: true, cart });

    } catch (error) {
        console.error('Error removing item from cart:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

