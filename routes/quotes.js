const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Add this line to import mongoose

const Quote = require('../models/Quote');
const Client = require('../models/Client');
const Service = require('../models/Service');
const User = require('../models/User');
const BusinessDetails = require('../models/BusinessDetails'); // Import BusinessDetails
const PaymentDetails = require('../models/PaymentDetails'); // Import PaymentDetails
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');

// List all quotes
router.get('/', async (req, res) => {
  if (req.isAuthenticated()) {
    const quotes = await Quote.find({ company: req.user.company }).sort({ date: -1 }).populate('client').populate('user');
    res.render('quotes', { title: 'Quotes', user: req.user, quotes });
  } else {
    res.redirect('/tools');
  }
});

// Form to add a new quote
router.get('/add', async (req, res) => {
  if (req.isAuthenticated()) {
    const clients = await Client.find({ company: req.user.company });
    const services = await Service.find({ company: req.user.company });
    res.render('add-quote', { title: 'Add Quote', user: req.user, clients, services });
  } else {
    res.redirect('/tools');
  }
});

router.post('/add', async (req, res) => {
  if (req.isAuthenticated()) {
    const { client, clientBusinessName, services, customPrices, totalAmount, customTotalAmount } = req.body;

    try {
      // Fetch service details from the database
      const serviceArray = await Promise.all(services.map(async (serviceId, index) => {
        const service = await Service.findById(serviceId);
        return {
          name: service.name,
          price: customPrices[index] || service.price
        };
      }));

      const total = customTotalAmount || serviceArray.reduce((sum, service) => sum + service.price, 0);

      const pdfPath = `/quotes/${new mongoose.Types.ObjectId()}.pdf`;

      const newQuote = new Quote({
        client,
        clientBusinessName,
        services: serviceArray,
        totalAmount: total,
        user: req.user._id,
        company: req.user.company,
        pdfPath
      });
      await newQuote.save();

      // Fetch business and payment details for PDF
      const businessDetails = await BusinessDetails.findOne({ user: req.user._id });
      const paymentDetails = await PaymentDetails.findOne({ user: req.user._id });

      // Generate PDF using Puppeteer
      const fullPdfPath = path.join(__dirname, '..', 'public', pdfPath);
      const htmlContent = await ejs.renderFile(path.join(__dirname, '..', 'views', 'quote-pdf-template.ejs'), {
        quote: newQuote,
        client: await Client.findById(client),
        businessDetails,
        paymentDetails
      });

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 60000
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent);
      await page.pdf({ path: fullPdfPath, format: 'A4' });

      await browser.close();

      res.redirect('/tools/quotes');
    } catch (err) {
      console.error('Error creating quote:', err);
      res.status(500).send('Server Error');
    }
  } else {
    res.redirect('/tools');
  }
});

// Fetch client business name
router.get('/client/:id/business-name', async (req, res) => {
  if (req.isAuthenticated()) {
    const client = await Client.findById(req.params.id);
    res.json({ businessName: client ? client.businessName : '' });
  } else {
    res.sendStatus(401);
  }
});

// Add a new service
router.post('/service/add', async (req, res) => {
  if (req.isAuthenticated()) {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Both name and price are required." });
    }

    const newService = new Service({ name, price, createdBy: req.user._id, company: req.user.company });
    await newService.save();
    res.json(newService);
  } else {
    res.sendStatus(401);
  }
});

// View a quote
router.get('/view/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const quote = await Quote.findById(req.params.id).populate('client').populate('user');
    if (!quote) {
      return res.status(404).send('Quote not found');
    }
    res.render('view-quote', { title: 'View Quote', user: req.user, quote });
  } else {
    res.redirect('/tools');
  }
});

// Download a quote
router.get('/download/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const quote = await Quote.findById(req.params.id).populate('client').populate('user');
    if (!quote) {
      return res.status(404).send('Quote not found');
    }
    res.download(path.join(__dirname, '..', 'public', quote.pdfPath));
  } else {
    res.redirect('/tools');
  }
});

// Resend a quote
router.get('/resend/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const quote = await Quote.findById(req.params.id).populate('client').populate('user');
    if (!quote) {
      return res.status(404).send('Quote not found');
    }
    console.log(`Resending quote ${quote._id} to client ${quote.client.name}`);
    req.flash('success_msg', 'Quote resent successfully');
    res.redirect('/tools/quotes');
  } else {
    res.redirect('/tools');
  }
});

module.exports = router;
