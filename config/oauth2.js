const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID, // Client ID
  process.env.CLIENT_SECRET, // Client Secret
  'http://localhost:8081/tools/auth/google/callback' // Redirect URL
);

module.exports = oauth2Client;
