const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuoteSchema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  clientBusinessName: { type: String, required: true },
  services: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
    }
  ],
  totalAmount: { type: Number, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  pdfPath: { type: String, required: true },
  quoteNumber: { type: String, required: true },
  uniqueToken: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  isViewed: { type: Boolean, default: false },
  dateCreated: { type: Date, default: Date.now },
  dateSent: { type: Date },
  dateViewed: { type: Date },
  dateAccepted: { type: Date },
  isInvoiceCreated: {type: Boolean, default: false},
  invoiceCreated: {type: Date}
});
module.exports = mongoose.model('Quote', QuoteSchema);
