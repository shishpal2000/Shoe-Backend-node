const jwt = require('jsonwebtoken');
const Admin = require('../model/Admin');
exports.adminMiddleware = async(req, res, next) => {
    try {
    const token = req.header('Authorization').replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
        return res.status(401).json({ message: 'Authorization denied, admin not found' });
    }
    req.admin = admin;

    next(); 
} catch (err){
    console.error('Error authenticating user:', err.message);
    res.status(401).json({ message: 'Authorization denied' });
}

    
};