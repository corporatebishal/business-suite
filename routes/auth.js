const express = require('express');
const router = express.Router();
const oauth2Client = require('../config/oauth2');

// Redirect to Google's OAuth 2.0 server
router.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// OAuth 2.0 callback
router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Store tokens in session or database
  req.session.tokens = tokens;
  req.user.tokens = tokens; // Assuming you have a user object in session
  await req.user.save(); // Save tokens to the database if necessary

  res.redirect('/tools/dashboard');
});

module.exports = router;
