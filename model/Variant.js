const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String },
    color: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    gender: { type: String },
    refineBy: { type: String },
    brand: { type: String },
    type: { type: String },
    sole_material: { type: String },
    toe_shape: { type: String },
    fastening: { type: String },

});

module.exports = mongoose.model('Variant', variantSchema);
