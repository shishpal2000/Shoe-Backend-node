const jwt = require('jsonwebtoken');
const User = require('../model/User');

exports.protect = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token provided, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Authorization denied, user not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Error authenticating user:', err.message);
        res.status(401).json({ message: 'Authorization denied' });
    }
};

