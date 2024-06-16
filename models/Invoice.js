const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  quote: { type: Schema.Types.ObjectId, ref: 'Quote', required: true },
  dueDate: { type: Date, required: true },
  taskCompletionDate: { type: Date, required: true },
  paymentMethods: [{ type: String, required: true }],
  status: { type: String, default: 'Pending' },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
