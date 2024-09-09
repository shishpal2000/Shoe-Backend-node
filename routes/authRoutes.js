const express = require('express');
const AuthController = require('../controllers/authController');
const router = express.Router();

router.post('/register/user', AuthController.registerUser);
router.post('/login/user', AuthController.authUser);
router.post('/verify-otp/user', AuthController.verifyOtp);
router.post('/logout/user', AuthController.logout);

router.post('/register/admin', AuthController.registerAdmin);
router.post('/login/admin', AuthController.authAdmin);


module.exports = router;
