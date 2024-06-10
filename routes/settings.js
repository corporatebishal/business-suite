const express = require('express');
const router = express.Router();
const multer = require('multer');
const { MongoClient, GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const BusinessDetails = require('../models/BusinessDetails');
const PaymentDetails = require('../models/PaymentDetails');

// Set up MongoDB client
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Initialize MongoDB connection and GridFS bucket
let bucket;
client.connect().then(() => {
  const db = client.db();
  bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  console.log('GridFSBucket initialized');
});

// Set up multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Render Business Details form
router.get('/business-details', async (req, res) => {
  if (req.isAuthenticated()) {
    const businessDetails = await BusinessDetails.findOne({ user: req.user._id });
    res.render('business-details', { title: 'Business Details', user: req.user, businessDetails, success_msg: req.flash('success_msg') });
  } else {
    res.redirect('/tools');
  }
});

// Handle Business Details submission
router.post('/business-details', upload.single('businessLogo'), async (req, res) => {
  if (req.isAuthenticated()) {
    const { businessABN, businessName, businessAddress, sameAddress, billingAddress } = req.body;
    
    let businessLogo = req.file ? '' : req.body.existingLogo;

    if (req.file) {
      console.log('File received:', req.file.originalname);
      
      if (req.body.existingLogo) {
        try {
          await bucket.delete(new mongoose.Types.ObjectId(req.body.existingLogo));
          console.log('Previous logo deleted:', req.body.existingLogo);
        } catch (err) {
          console.error('Error deleting previous logo:', err);
        }
      }

      const uploadStream = bucket.openUploadStream(Date.now() + '-' + req.file.originalname, {
        metadata: { userId: req.user._id },
      });

      uploadStream.write(req.file.buffer);
      uploadStream.end();

      uploadStream.on('finish', async () => {
        console.log('File upload completed:', uploadStream.id);
        businessLogo = uploadStream.filename; // Use filename instead of id for easier retrieval

        await saveBusinessDetails();
      });

      uploadStream.on('error', (err) => {
        console.error('Error during file upload:', err);
        res.status(500).send('File upload error');
      });
    } else {
      await saveBusinessDetails();
    }

    async function saveBusinessDetails() {
      try {
        await BusinessDetails.findOneAndUpdate(
          { user: req.user._id },
          {
            businessABN,
            businessName,
            businessAddress,
            billingAddress: sameAddress ? businessAddress : billingAddress,
            businessLogo,
          },
          { new: true, upsert: true }
        );
        req.flash('success_msg', 'Business details updated successfully');
        res.redirect('/tools/business-details');
      } catch (err) {
        console.error('Error saving business details:', err);
        res.status(500).send('Server error');
      }
    }
  } else {
    res.redirect('/tools');
  }
});

// Render Payment Details form
router.get('/payment-details', async (req, res) => {
    if (req.isAuthenticated()) {
      const paymentDetails = await PaymentDetails.findOne({ user: req.user._id });
      res.render('payment-details', { title: 'Payment Details', user: req.user, paymentDetails, success_msg: req.flash('success_msg') });
    } else {
      res.redirect('/tools');
    }
  });
  
  // Handle Payment Details submission
  router.post('/payment-details', async (req, res) => {
    if (req.isAuthenticated()) {
      const { bsb, accountNumber, paymentBSB, referenceNumber } = req.body;
  
      try {
        await PaymentDetails.findOneAndUpdate(
          { user: req.user._id },
          { bsb, accountNumber, paymentBSB, referenceNumber },
          { new: true, upsert: true }
        );
        req.flash('success_msg', 'Payment details updated successfully');
        res.redirect('/tools/payment-details');
      } catch (err) {
        console.error("Error saving payment details:", err);
        res.status(500).send("Server error");
      }
    } else {
      res.redirect('/tools');
    }
  });

module.exports = router;
