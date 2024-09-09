const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { upload } = require('../middleware/cloudinaryConfig.js');

router.post('/create-categories', upload.single('image'), categoryController.createCategory);
router.get('/get-all-categories', categoryController.getAllCategories);
router.get('/get-categories/:id', categoryController.getCategoryById);
router.put('/update-categories/:id', categoryController.updateCategory);
// router.delete('/delete-categories/:id', categoryController.deleteCategory);

module.exports = router;
