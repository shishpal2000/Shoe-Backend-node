require('dotenv').config;
const Product = require('../model/Product');
const Category = require('../model/Category');
const Variant = require('../model/Variant');
const { uploadToCloudinary } = require("../middleware/cloudinaryConfig.js");

exports.createProduct = async (req, res) => {
    try {
        const { product_name, description, sku, categories, variants, isNewArrival } = req.body;

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
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.buffer, 'product-images');
                attachment.push({
                    url: result.secure_url,
                });
            }
        }

        const product = new Product({
            product_name,
            product_slug,
            categories: categoryArray,
            description,
            sku,
            images: attachment,
            isNewArrival
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
        const { product_slug, productId, isNewArrival, ...filters } = req.query;

        // Handle fetching a specific product by slug
        if (product_slug) {
            const product = await Product.findOne({ product_slug }).populate('variants').exec();
            if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

            const uniqueSizes = [...new Set(product.variants.map(variant => variant.size))];
            product.uniqueSizes = uniqueSizes;

            return res.status(200).json({ success: true, data: product });
        }

        // Handle fetching variants of a specific product
        if (productId) {
            const product = await Product.findById(productId).populate('variants').exec();
            if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

            return res.status(200).json({ success: true, data: product.variants });
        }

        // Build the query object for fetching products with filters
        let query = {};
        if (isNewArrival !== undefined) {
            query.isNewArrival = isNewArrival === 'true';
        }

        Object.keys(filters).forEach(filterKey => {
            if (filterKey === 'size' || filterKey === 'color' || filterKey === 'price') {
                query[`variants.${filterKey}`] = { $in: filters[filterKey].split(',') };
            } else if (filterKey === 'category') {
                query['categories'] = { $in: filters[filterKey].split(',') };
            } else if (filterKey === 'subcategory') {
                query['subcategories'] = { $in: filters[filterKey].split(',') };
            } else {
                query[filterKey] = filters[filterKey];
            }
        });

        // Fetch products with optional population
        let productQuery = Product.find(query).populate('variants');
        if (Product.schema.path('category')) {
            productQuery = productQuery.populate('category');
        }

        const products = await productQuery.exec();

        // Fetch filter options
        const categories = await Category.find().exec();
        const variants = await Variant.find().exec();

        const parentCategories = categories.filter(cat => !cat.parentCategory);
        const childCategories = categories.filter(cat => cat.parentCategory);

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
        const { productId } = req.params;
        const { product_name, category, description, sku, variants, isNewArrival } = req.body;
        console.log("update", req.body);

        const parsedVariants = JSON.parse(variants);

        // Find the existing product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Generate the product slug
        const product_slug = product_name.toLowerCase().replace(/ /g, '-');

        // Check if the product name already exists for another product
        if (product_name && product_name !== product.product_name) {
            const existingProduct = await Product.findOne({ product_name });
            if (existingProduct && existingProduct._id.toString() !== productId) {
                return res.status(400).json({ success: false, message: 'Product name already exists' });
            }
        }

        // Check if category exists and update if necessary
        if (category && (!product.category || category.toString() !== product.category.toString())) {
            const existingCategory = await Category.findById(category);
            if (!existingCategory) {
                return res.status(400).json({ success: false, message: 'Category not found' });
            }

            // Remove product from old category and add to new category
            if (product.category) {
                const oldCategory = await Category.findById(product.category);
                if (oldCategory) {
                    oldCategory.products.pull(product._id);
                    await oldCategory.save();
                }
            }

            existingCategory.products.push(product._id);
            await existingCategory.save();

            product.category = category;
        }

        // Handle file uploads if there are any new files
        if (req.files) {
            let attachment = [];
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.buffer, 'product-images');
                attachment.push({
                    url: result.secure_url,
                    type: result.resource_type,
                    public_id: result.public_id
                });
            }
            product.images = attachment;
        }

        // Update other fields
        if (product_name) product.product_name = product_name;
        if (product_slug) product.product_slug = product_slug;
        if (description) product.description = description;
        if (sku) product.sku = sku;
        if (isNewArrival !== undefined) product.isNewArrival = isNewArrival;

        await product.save();

        // Update variants
        await Variant.deleteMany({ product: product._id });
        for (let variantData of parsedVariants) {
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
