const User = require('../model/User');
const Address = require('../model/Address');

// Get user profile with addresses
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            const addresses = await Address.find({ userId: user._id });
            res.json({
                _id: user._id,
                firstName: user.firstName,
                email: user.email,
                phone: user.phone,
                addresses: addresses,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        if(req.admin){

            const users = await User.find();
            const userProfiles = await Promise.all(
                users.map(async (user) => {
                    const addresses = await Address.find({ userId: user._id });
                    return {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        addresses: addresses,
                    };
                })
            );
            res.status(200).json({success: true, message: "ok", data : {userProfiles}});
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: updatedUser.phone,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

