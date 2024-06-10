const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { MongoClient, GridFSBucket } = require('mongodb');

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

// Route to get file by filename
router.get('/:filename', async (req, res) => {
  try {
    const files = await bucket.find({ filename: req.params.filename }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ err: 'No files exist' });
    }

    const readstream = bucket.openDownloadStreamByName(req.params.filename);
    readstream.on('error', (err) => {
      res.status(500).json({ err: 'An error occurred while fetching the file' });
    });
    readstream.pipe(res);
  } catch (err) {
    res.status(500).json({ err: 'An error occurred while fetching the file' });
  }
});

module.exports = router;
