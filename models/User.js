const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true }
});

module.exports = mongoose.model('User', UserSchema);
