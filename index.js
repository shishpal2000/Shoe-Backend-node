const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const addressRoutes = require('./routes/addressRoutes');
const categoryRoutes = require('./routes/categoryRoutes')
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const ordersRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
// const attributeRoutes = require('./routes/attributeRoutes');


require('dotenv').config();
const app = express();

const port = process.env.PORT || 8000;


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/wishlist', wishlistRoutes);
// app.use('/api/attribute', attributeRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
