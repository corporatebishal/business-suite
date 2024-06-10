const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BusinessDetailsSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  businessABN: { type: String, required: true },
  businessName: { type: String, required: true },
  businessAddress: { type: String, required: true },
  billingAddress: { type: String, required: true },
  businessLogo: { type: String }
});

module.exports = mongoose.model('BusinessDetails', BusinessDetailsSchema);
