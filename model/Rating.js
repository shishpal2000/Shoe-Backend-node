const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true },
    comment: { type: String, default: "" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    approved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Rating", RatingSchema);
