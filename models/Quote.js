const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
});

const QuoteSchema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  clientBusinessName: { type: String, required: true },
  services: [ServiceSchema],
  totalAmount: { type: Number, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  pdfPath: { type: String, required: true },
  quoteNumber: { type: String, required: true } // Add this field
});

module.exports = mongoose.model('Quote', QuoteSchema);
