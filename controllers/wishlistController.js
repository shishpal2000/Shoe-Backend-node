const Wishlist = require('../model/Wishlist');
const Product = require('../model/Product');

exports.addToWishlist = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const userId = req.user._id;
        const { productId } = req.body;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }
        if (!wishlist.items.includes(productId)) {
            wishlist.items.push(productId);
            await wishlist.save();
        }
        res.status(200).json({ success: true, data: wishlist });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getWishlist = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const userId = req.user._id;
        const wishlist = await Wishlist.findOne({ user: userId }).populate('items');
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }
        res.status(200).json({ success: true, data: wishlist.items });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            console.log("No authenticated user found");
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const userId = req.user._id;
        console.log("User ID: ", userId);

        const { productId } = req.params;
        console.log("Product ID: ", productId);

        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

        wishlist.items = wishlist.items.filter(item => item.toString() !== productId.toString());

        await wishlist.save();

        const updatedWishlist = await Wishlist.findOne({ user: userId }).populate('items');

        res.status(200).json({ success: true, data: updatedWishlist });
    } catch (err) {
        console.log("Error: ", err);
        res.status(500).json({ success: false, message: err.message });
    }
};


