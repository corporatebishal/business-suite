const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentDetailsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bsb: {
    type: String,
    required: false
  },
  accountNumber: {
    type: String,
    required: false
  },
  paymentBSB: {
    type: String,
    required: false
  },
  referenceNumber: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('PaymentDetails', PaymentDetailsSchema);
