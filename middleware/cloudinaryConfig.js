require('dotenv').config();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const { v4: uuidv4 } = require('uuid');

// Setup memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Function to handle uploads to Cloudinary
const uploadToCloudinary = (fileBuffer, folder, resourceType = 'auto') => {
  console.log("Initiating upload to Cloudinary...");
  console.log("Buffer size:", fileBuffer.length);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: uuidv4(),
        resource_type: resourceType
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = { upload, uploadToCloudinary };