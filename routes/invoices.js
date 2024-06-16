const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Quote = require('../models/Quote');
const BusinessDetails = require('../models/BusinessDetails');
const PaymentDetails = require('../models/PaymentDetails');
const nodemailer = require('nodemailer');

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: 'smtp.dreamhost.com',
  port: 465,
  secure: true,
  auth: {
    user: 'quotes@bishal.au',
    pass: 'sia@1303#',
  },
});

// List all invoices
router.get('/', async (req, res) => {
  if (req.isAuthenticated()) {
    const invoices = await Invoice.find({ company: req.user.company }).sort({ date: -1 }).populate('client').populate('user');
    res.render('invoices', { title: 'Invoices', user: req.user, invoices, currentRoute: '/tools/invoices' });
  } else {
    res.redirect('/tools');
  }
});

// Create invoice page
router.get('/create/:quoteId?', async (req, res) => {
  try {
    console.log('Fetching data for creating invoice page...');
    const quotes = await Quote.find().populate('client');
    const quote = req.params.quoteId ? await Quote.findById(req.params.quoteId).populate('client') : null;
    const businessDetails = await BusinessDetails.findOne({ user: req.user._id });
    const paymentDetails = await PaymentDetails.findOne({ user: req.user._id });

    if (req.params.quoteId && !quote) {
      req.flash('error_msg', 'Quote not found');
      return res.redirect('/tools/invoices');
    }

    console.log('Rendering create-invoice page with data:', { quotes, quote, businessDetails, paymentDetails });

    res.render('create-invoice', { title: 'Create Invoice', user: req.user, quotes, quote, businessDetails, paymentDetails });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle invoice creation
router.post('/create', async (req, res) => {
  try {
    const { quoteId, dueDate, taskCompletionDate, paymentMethods } = req.body;
    console.log('Received form data:', { quoteId, dueDate, taskCompletionDate, paymentMethods });

    const quote = await Quote.findById(quoteId).populate('client');
    if (!quote) {
      console.log('Quote not found...');
      return res.status(400).json({ error: 'Quote not found' });
    }

    console.log('Creating new invoice...');
    const newInvoice = new Invoice({
      client: quote.client._id,
      quote: quoteId,
      dueDate,
      taskCompletionDate,
      paymentMethods,
      status: 'Pending',
      user: req.user._id,
      company: req.user.company
    });

    await newInvoice.save();
    console.log('Invoice created:', newInvoice);

    // Update the quote to flag invoice created
    quote.isInvoiceCreated = true;
    quote.invoiceCreated = new Date();
    await quote.save();
    console.log('Quote updated to flag invoice creation:', quote);

    // Send email notifications to user and client
    const clientEmailContent = `Your invoice has been created. View it here: <a href="http://localhost:8081/tools/invoices/view/${newInvoice._id}">Invoice</a>`;
    const userEmailContent = `Invoice created for client ${quote.client.name}. View it here: <a href="http://localhost:8081/tools/invoices/view/${newInvoice._id}">Invoice</a>`;

    await transporter.sendMail({
      from: 'quotes@bishal.au',
      to: quote.client.email,
      subject: 'Invoice Created',
      html: clientEmailContent,
    });

    await transporter.sendMail({
      from: 'quotes@bishal.au',
      to: req.user.email,
      subject: 'Invoice Created',
      html: userEmailContent,
    });

    console.log('Email notifications sent.');
    res.json({ success: true, redirect: '/tools/invoices' });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// View invoice page
router.get('/view/:invoiceId', async (req, res) => {
    try {
      console.log('Fetching data for viewing invoice page...');
      const invoice = await Invoice.findById(req.params.invoiceId).populate('client').populate('quote');
      
      if (!invoice) {
        req.flash('error_msg', 'Invoice not found');
        return res.redirect('/tools/invoices');
      }
  
      const quote = await Quote.findById(invoice.quote._id).populate('client');
      if (!quote) {
        return res.status(404).send('Quote not found');
      }
  
      const businessDetails = await BusinessDetails.findOne({ user: req.user._id });
      const paymentDetails = await PaymentDetails.findOne({ user: req.user._id });
  
      console.log('Rendering view-invoice page with data:', { invoice, quote, businessDetails, paymentDetails });
  
      res.render('view-invoice', { title: 'View Invoice', user: req.user, invoice, quote, businessDetails, paymentDetails });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

module.exports = router;
