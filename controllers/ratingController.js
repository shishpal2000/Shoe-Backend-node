const Rating = require("../model/Rating");
const Product = require("../model/Product");

exports.submitRating = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user._id;

        const existingRating = await Rating.findOne({ user: userId, product: productId });
        if (existingRating) {
            return res.status(400).json({ message: "You have already rated this product." });
        }

        const newRating = await Rating.create({ user: userId, product: productId, rating, comment, approved: false });

        const product = await Product.findById(productId);
        product.ratingsQuantity += 1;
        product.ratingsAverage = (product.ratingsAverage * (product.ratingsQuantity - 1) + rating) / product.ratingsQuantity;

        await product.save();

        res.status(201).json({ success: true, rating: newRating });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRatings = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        const ratings = await Rating.find({ product: productId }).populate("user", "firstName");

        res.status(200).json({
            success: true,
            ratings: ratings,
            ratingsAverage: product.ratingsAverage,
            ratingsQuantity: product.ratingsQuantity,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.approveRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        console.log(ratingId);
        // Find the rating and set approved to true
        const rating = await Rating.findByIdAndUpdate(ratingId, { approved: true }, { new: true });
        console.log(rating);
        if (!rating) {
            return res.status(404).json({ message: "Rating not found." });
        }

        res.status(200).json({ success: true, rating });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllRatings = async (req, res) => {
    try {
        const ratings = await Rating.find({}).populate('product', 'product_name').populate('user', 'firstName lastName');
        res.status(200).json({
            success: true,
            ratings,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};