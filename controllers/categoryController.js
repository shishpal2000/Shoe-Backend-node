const Category = require('../model/Category');
const { uploadToCloudinary } = require("../middleware/cloudinaryConfig.js");
require('dotenv').config;
const Product = require('../model/Product');
// const Variant = require('../model/Variant');


// Create a new category
exports.createCategory = async (req, res) => {
    try {
        console.log("Request received to create category");

        const { name, status, parentCategory, badgeName, showOnFrontend } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const slug = name.toLowerCase().replace(/ /g, '-');
        let imageUrl = null;

        if (req.file) {
            console.log("Uploading file to Cloudinary...");
            const result = await uploadToCloudinary(req.file.buffer, 'category-images');
            console.log("File uploaded successfully");
            imageUrl = result.secure_url;
        }

        let validatedParentCategory = null;
        if (parentCategory && parentCategory !== '') {
            try {
                console.log("Checking parent category...");
                const parentCategoryExists = await Category.findById(parentCategory);
                if (!parentCategoryExists) {
                    return res.status(400).json({ success: false, message: 'Parent category not found' });
                }
                validatedParentCategory = parentCategory;
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Invalid parent category ID' });
            }
        }

        const categoryData = {
            name,
            status,
            slug,
            badgeName,
            parentCategory: validatedParentCategory,
            image: imageUrl
        };

        if (showOnFrontend === 'true' || showOnFrontend === 'false') {
            categoryData.showOnFrontend = showOnFrontend === 'true';
        }

        console.log("Saving category...");
        const category = new Category(categoryData);

        await category.save();
        console.log("Category saved successfully");

        res.status(201).json({ success: true, data: category });
    } catch (err) {
        console.error("Error in creating category:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.getAllCategories = async (req, res) => {
    try {
        const { showOnFrontend } = req.query;
        let query = {};
        if (showOnFrontend !== undefined) {
            query.showOnFrontend = showOnFrontend === 'true';
        }

        const categories = await Category.find(query).exec();

        res.status(200).json({ success: true, message: "ok", data: categories });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


// Get a category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parentCategory', 'name slug')
            .populate('products', 'name slug');

        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

        res.status(200).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// Update a category by ID
exports.updateCategory = async (req, res) => {
    try {
        const { name, status, parentCategory, badgeName, showOnFrontend } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        category.name = name || category.name;
        category.status = status || category.status;
        category.badgeName = badgeName || category.badgeName;
        category.parentCategory = parentCategory || category.parentCategory;
        category.showOnFrontend = showOnFrontend !== undefined ? showOnFrontend : category.showOnFrontend;

        await category.save();

        res.status(200).json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Delete a category by ID
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getProductWithDiscount = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId)
            .populate('categories')
            .populate('variants');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let categoryDiscount = 0;

        if (product.categories && product.categories.length > 0) {
            categoryDiscount = Math.max(
                ...product.categories.map(category => category.discount || 0)
            );
        }

        // Apply the discount to each variant
        const discountedVariants = product.variants.map(variant => {
            const discountAmount = (variant.price * categoryDiscount) / 100;
            const discountedPrice = variant.price - discountAmount;

            return {
                ...variant.toObject(),
                discountedPrice: discountedPrice.toFixed(2) // Add discounted price field
            };
        });

        // Send the product data along with discounted variants
        res.status(200).json({
            success: true,
            data: {
                ...product.toObject(),
                variants: discountedVariants,
                discountApplied: categoryDiscount // Return the discount that was applied
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
