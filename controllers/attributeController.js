// const Attribute = require('../model/Attribute');

// exports.addAttribute = async (req, res) => {
//     try {
//         const { name, values } = req.body;
//         let attribute = await Attribute.findOne({ name });

//         if (attribute) {
//             attribute.values = [...new Set([...attribute.values, ...values])];
//             await attribute.save();
//         } else {
//             attribute = new Attribute({ name, values });
//             await attribute.save();
//         }
//         res.status(201).json({ success: true, data: attribute });
//     } catch (err) {
//         res.status(400).json({ success: false, message: err.message });
//     }
// };

// // Get all Attribute
// exports.getAllAttribute = async (req, res) => {
//     try {
//         const Attributes = await Attribute.find();
//         res.status(200).json({ success: true, data: Attributes });
//     } catch (err) {
//         res.status(400).json({ success: false, message: err.message });
//     }
// };

// // Get a Attribute by ID
// exports.getAttributeById = async (req, res) => {
//     try {
//         const Attributes = await Attribute.findById(req.params.id);
//         if (!Attributes) return res.status(404).json({ success: false, message: 'Attribute not found' });
//         res.status(200).json({ success: true, data: Attributes });
//     } catch (err) {
//         res.status(400).json({ success: false, message: err.message });
//     }
// };

// // Update a Attribute by ID
// exports.updateAttribute = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const Attributes = await Attribute.findByIdAndUpdate(
//             id,
//             req.body,
//             { new: true, runValidators: true }
//         );
//         if (!Attributes) return res.status(404).json({ success: false, message: 'Attribute not found' });
//         res.status(200).json({ success: true, data: Attributes });
//     } catch (err) {
//         res.status(400).json({ success: false, message: err.message });
//     }
// };

// // Delete a Attributes by ID
// exports.deleteAttribute = async (req, res) => {
//     try {
//         const Attributes = await Attribute.findByIdAndDelete(req.params.id);
//         if (!Attributes) return res.status(404).json({ success: false, message: 'Attribute not found' });
//         res.status(200).json({ success: true, message: 'Attribute deleted' });
//     } catch (err) {
//         res.status(400).json({ success: false, message: err.message });
//     }
// };
