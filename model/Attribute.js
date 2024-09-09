const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    values: [
        {
            type: String,
            required: true,
        },
    ],
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
    ],
});

module.exports = mongoose.model('Attribute', attributeSchema);
