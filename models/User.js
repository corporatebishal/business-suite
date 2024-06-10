const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  email: { type: String, required: true },
  googleId: { type: String },
  oauthTokens: {
    accessToken: { type: String },
    refreshToken: { type: String },
    expiryDate: { type: Date }
  }
});

module.exports = mongoose.model('User', UserSchema);
