require('dotenv').config;
const Product = require('../model/Product');
const Category = require('../model/Category');
const Variant = require('../model/Variant');
const { uploadToCloudinary } = require("../middleware/cloudinaryConfig.js");

exports.createProduct = async (req, res) => {
    try {
        const { product_name, description, sku, video_url, categories, variants, isNewArrival } = req.body;

        const product_slug = product_name.toLowerCase().replace(/ /g, '-');

        let parsedVariants = [];
        if (typeof variants === 'string') {
            try {
                parsedVariants = JSON.parse(variants);
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Invalid JSON format for variants' });
            }
        } else if (Array.isArray(variants)) {
            parsedVariants = variants;
        }

        const existingProduct = await Product.findOne({ product_name });
        if (existingProduct) {
            return res.status(400).json({ success: false, message: 'Product name already exists' });
        }

        let categoryArray = [];
        if (!categories) {
            return res.status(400).json({ success: false, message: 'Please provide both parent and subcategory IDs' });
        }

        if (typeof categories === 'string') {
            try {
                categoryArray = JSON.parse(categories);
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Invalid format for categories' });
            }
        } else if (Array.isArray(categories)) {
            categoryArray = categories;
        }

        if (categoryArray.length !== 2) {
            return res.status(400).json({ success: false, message: 'Please provide both parent and subcategory IDs' });
        }

        let attachment = [];
        if (req.files) {
            attachment = await Promise.all(req.files.map(async (file) => {
                const result = await uploadToCloudinary(file.buffer, 'product-images');
                return { url: result.secure_url };
            }));
        }

        const product = new Product({
            product_name,
            product_slug,
            categories: categoryArray,
            description,
            sku,
            images: attachment,
            isNewArrival,
            video_url
        });

        await product.save();

        for (const categoryId of categoryArray) {
            const category = await Category.findById(categoryId);
            category.products.push(product._id);
            await category.save();
        }

        if (parsedVariants.length > 0) {
            const variantIds = [];
            for (const variantData of parsedVariants) {
                const variant = new Variant({
                    ...variantData,
                    product: product._id
                });
                await variant.save();
                variantIds.push(variant._id);
            }
            product.variants = variantIds;
            await product.save();
        }

        res.status(201).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const { product_slug, productId, isNewArrival, category, size, color, ...filters } = req.query;
        console.log('Received query parameters:', req.query);
        console.log('Filters after extraction:', filters);

        if (product_slug) {
            const product = await Product.findOne({ product_slug })
                .populate({
                    path: 'reviews',
                    match: { approved: true },
                    populate: {
                        path: 'user',
                        select: 'firstName'
                    }
                })
                .populate('variants')
                .populate({
                    path: 'categories',
                    select: 'name parentCategory',
                    populate: { path: 'parentCategory', select: 'name' }
                })
                .exec();
            if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

            const uniqueSizes = [...new Set(product.variants.map(variant => variant.size))];
            product.uniqueSizes = uniqueSizes;

            return res.status(200).json({ success: true, data: product });
        }

        if (productId) {
            const product = await Product.findById(productId)
                .populate({
                    path: 'reviews',
                    match: { approved: true },
                    populate: {
                        path: 'user',
                        select: 'firstName'
                    }
                })
                .populate('variants')
                .populate({
                    path: 'categories',
                    select: 'name parentCategory',
                    populate: { path: 'parentCategory', select: 'name' }
                })
                .exec();
            if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

            return res.status(200).json({ success: true, data: product });
        }

        let query = {};
        if (isNewArrival !== undefined) {
            query.isNewArrival = isNewArrival === 'true';
        }

        if (category) {
            const categoryDoc = await Category.findOne({ slug: new RegExp(`^${category}$`, 'i') }).exec();
            if (categoryDoc) {
                query['categories'] = categoryDoc._id;
            } else {
                return res.status(404).json({ success: false, message: 'Category not found' });
            }
        }

        Object.keys(filters).forEach(filterKey => {
            // Check for size, color, price, and subcategory
            if (['size', 'color', 'price'].includes(filterKey)) {
                query[`variants.${filterKey}`] = { $in: filters[filterKey].split(',') };
            } else if (filterKey === 'subcategory') {
                query['subcategories'] = { $in: filters[filterKey].split(',') };
            } else {
                query[filterKey] = filters[filterKey];
            }
        });
        console.log('Constructed query:', query);

        let productQuery = Product.find(query)
            .populate({
                path: 'reviews',
                match: { approved: true },
                populate: {
                    path: 'user',
                    select: 'firstName'
                }
            })
            .populate('variants')
            .populate({
                path: 'categories',
                select: 'name parentCategory',
                populate: { path: 'parentCategory', select: 'name' }
            });

        if (Product.schema.path('category')) {
            productQuery = productQuery.populate('category');
        }

        const products = await productQuery.exec();

        const categories = await Category.find().exec();
        const variants = await Variant.find().exec();

        const parentCategories = categories.filter(cat => !cat.parentCategory).map(cat => ({
            _id: cat._id,
            name: cat.name
        }));
        const childCategories = categories.filter(cat => cat.parentCategory).map(cat => ({
            _id: cat._id,
            name: cat.name,
            parentCategory: cat.parentCategory
        }));

        const sizes = [...new Set(variants.flatMap(v => v.size || []))];
        const colors = [...new Set(variants.flatMap(v => v.color || []))];
        const genders = [...new Set(variants.flatMap(v => v.gender || []))];

        res.status(200).json({
            success: true,
            data: {
                products,
                filters: {
                    sizes,
                    colors,
                    parentCategories,
                    childCategories,
                    genders,
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Update a product by ID
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_name, categories, description, video_url, sku, variants, isNewArrival } = req.body;

        // Parse variants
        let parsedVariants;
        try {
            parsedVariants = JSON.parse(variants);
        } catch (err) {
            return res.status(400).json({ success: false, message: 'Invalid JSON format for variants' });
        }

        // Find the existing product
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Generate the product slug
        const product_slug = product_name.toLowerCase().replace(/ /g, '-');

        // Check if the product name already exists for another product
        if (product_name && product_name !== product.product_name) {
            const existingProduct = await Product.findOne({ product_name });
            if (existingProduct && existingProduct._id.toString() !== id) {
                return res.status(400).json({ success: false, message: 'Product name already exists' });
            }
        }

        // Handle categories update
        let categoryArray = [];
        if (!categories) {
            return res.status(400).json({ success: false, message: 'Please provide both parent and subcategory IDs' });
        }

        if (typeof categories === 'string') {
            try {
                categoryArray = JSON.parse(categories);
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Invalid format for categories' });
            }
        } else if (Array.isArray(categories)) {
            categoryArray = categories;
        }

        if (categoryArray.length !== 2) {
            return res.status(400).json({ success: false, message: 'Please provide both parent and subcategory IDs' });
        }

        // Update categories if necessary
        if (categoryArray.toString() !== product.categories.toString()) {
            // Remove product from old categories
            for (const categoryId of product.categories) {
                const oldCategory = await Category.findById(categoryId);
                if (oldCategory) {
                    oldCategory.products.pull(product._id);
                    await oldCategory.save();
                }
            }

            // Add product to new categories
            for (const categoryId of categoryArray) {
                const newCategory = await Category.findById(categoryId);
                if (!newCategory) {
                    return res.status(400).json({ success: false, message: `Category ${categoryId} not found` });
                }
                newCategory.products.push(product._id);
                await newCategory.save();
            }

            product.categories = categoryArray;
        }

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            const attachments = await Promise.all(req.files.map(async (file) => {
                const result = await uploadToCloudinary(file.buffer, 'product-images');
                return {
                    url: result.secure_url,
                };
            }));
            product.images = attachments;
        }

        // Update other fields
        if (product_name) product.product_name = product_name;
        if (product_slug) product.product_slug = product_slug;
        if (description) product.description = description;
        if (sku) product.sku = sku;
        if (video_url) product.video_url = video_url;
        if (isNewArrival !== undefined) product.isNewArrival = isNewArrival;

        await product.save();

        // Update variants
        await Variant.deleteMany({ product: product._id });
        for (const variantData of parsedVariants) {
            const variant = new Variant({
                ...variantData,
                product: product._id
            });
            await variant.save();
        }

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id)
            .populate('categories', 'name parentCategory')
            .populate('variants')
            .exec();

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.status(200).json({ success: true, data: product });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getProductVariants = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId).populate('variants');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: product.variants });
    } catch (err) {
        console.error('Error fetching product variants:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.searchProducts = async (req, res) => {
    console.log(req.query);
    try {
        const { name, category, size, color, minPrice, maxPrice, isNewArrival } = req.query;
        let query = {};

        if (name) {
            query.product_name = { $regex: name, $options: 'i' }; // Case-insensitive search
        }

        if (category) {
            query.categories = category; // Assuming category is an ID
        }

        if (size) {
            query.variants = { $elemMatch: { size } }; // Check for size in variants
        }

        if (color) {
            query.variants = { $elemMatch: { color } }; // Check for color in variants
        }

        if (minPrice || maxPrice) {
            query.variants = query.variants || {}; // Ensure variants key exists
            query.variants.price = {};
            if (minPrice) query.variants.price.$gte = minPrice;
            if (maxPrice) query.variants.price.$lte = maxPrice;
        }

        if (isNewArrival !== undefined) {
            query.isNewArrival = isNewArrival === 'true';
        }

        const products = await Product.find(query)
            .populate('categories', 'name parentCategory')
            .populate('variants');

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products found' });
        }

        res.status(200).json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
