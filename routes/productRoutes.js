const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/cloudinaryConfig.js');
const productController = require('../controllers/productController');

router.post('/create-products', upload.array('images'), productController.createProduct);
router.get('/get-all-products', productController.getAllProducts);
router.get('/products/:productId/variants', productController.getProductVariants);
router.put('/update-products/:productId', upload.array('images'), productController.updateProduct);
router.delete('/delete-products/:id', productController.deleteProduct);

module.exports = router; 
