const Address = require('../model/Address');

exports.addAddress = async (req, res) => {
    try {
        const { firstName, lastName, country, streetAddress, city, state, phone, postalCode, deliveryInstruction, type, isDefault, status } = req.body;

        if (!firstName || !lastName || !country || !streetAddress || !city || !state || !phone || !postalCode) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        if (!type || !['Shipping', 'Billing'].includes(type)) {
            return res.status(400).json({ message: 'Invalid or missing address type' });
        }

        if (status && !['Active', 'Inactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid address status' });
        }

        const addressData = {
            userId: req.user._id,
            firstName,
            lastName,
            country,
            streetAddress,
            city,
            state,
            phone,
            postalCode,
            deliveryInstruction: deliveryInstruction || '',
            type,
            isDefault: isDefault || false,
            status: status || 'Active'
        };

        const newAddress = new Address(addressData);
        const savedAddress = await newAddress.save();

        res.status(201).json({ success: true, data: savedAddress });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, country, streetAddress, city, state, phone, postalCode, deliveryInstruction, type, isDefault, status } = req.body;

        if (type && !['Shipping', 'Billing'].includes(type)) {
            return res.status(400).json({ message: 'Invalid address type' });
        }

        if (status && !['Active', 'Inactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid address status' });
        }

        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        if (address.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this address' });
        }

        const updateFields = {
            firstName,
            lastName,
            country,
            streetAddress,
            city,
            state,
            phone,
            postalCode,
            deliveryInstruction,
            type,
            isDefault,
            status
        };

        for (const key in updateFields) {
            if (updateFields[key] === undefined) {
                delete updateFields[key];
            }
        }

        const updatedAddress = await Address.findByIdAndUpdate(id, updateFields, { new: true });

        if (updatedAddress) {
            res.status(200).json({ success: true, message: "Address updated successfully", data: updatedAddress });
        } else {
            res.status(404).json({ message: 'Address not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        const address = await Address.findById(id);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        if (address.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this address' });
        }

        await Address.findByIdAndDelete(id);
        res.json({ message: 'Address deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
