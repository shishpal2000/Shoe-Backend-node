const express = require('express');
const router = express.Router();
const ContactinfoController = require('../controllers/contactinfoController');

router.post('/create-contact-info', ContactinfoController.createOrUpdateContactInfo);
router.get('/get-contact-info', ContactinfoController.getContactInfo);
router.delete('/delete-contact-info/:id', ContactinfoController.deleteContactInfo);

module.exports = router;
