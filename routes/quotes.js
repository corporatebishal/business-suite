const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Client = require('../models/Client');
const Service = require('../models/Service');
const User = require('../models/User');
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
    const clients = await Client.find();
    const services = await Service.find({ company: req.user.company });
    res.render('add-quote', { title: 'Add Quote', user: req.user, clients, services });
  } else {
    res.redirect('/tools');
  }
});

// Handle adding a new quote
router.post('/add', async (req, res) => {
  if (req.isAuthenticated()) {
    const { client, clientBusinessName, services, totalAmount } = req.body;

    try {
      // Fetch service details from the database
      const serviceArray = await Promise.all(services.map(async (serviceId) => {
        const service = await Service.findById(serviceId);
        return { name: service.name, price: service.price };
      }));

      const newQuote = new Quote({
        client,
        clientBusinessName,
        services: serviceArray,
        totalAmount,
        user: req.user._id,
        company: req.user.company
      });
      await newQuote.save();

      // Generate PDF using Puppeteer
      const pdfPath = path.join(__dirname, '..', 'public', 'quotes', `${newQuote._id}.pdf`);
      const htmlContent = await ejs.renderFile(path.join(__dirname, '..', 'views', 'quote-pdf-template.ejs'), {
        quote: newQuote,
        client,
        clientBusinessName,
        services: serviceArray,
        totalAmount
      });

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(htmlContent);
      await page.pdf({ path: pdfPath, format: 'A4' });

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

    console.log('Received Name:', name);
    console.log('Received Price:', price);

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

// Download a quote (for simplicity, just send the quote details as a text file)
router.get('/download/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const quote = await Quote.findById(req.params.id).populate('client').populate('user');
    if (!quote) {
      return res.status(404).send('Quote not found');
    }
    // For simplicity, we'll just send a text file. In a real app, you'd generate a PDF or other file format.
    res.setHeader('Content-Disposition', 'attachment; filename=quote.txt');
    res.setHeader('Content-Type', 'text/plain');
    res.send(`Client: ${quote.client.name}\nBusiness Name: ${quote.clientBusinessName}\nTotal Amount: $${quote.totalAmount}\nDate: ${new Date(quote.date).toLocaleDateString()}\nStatus: ${quote.status}\nCreated By: ${quote.user.username}`);
  } else {
    res.redirect('/tools');
  }
});

// Resend a quote (for simplicity, we'll just log a message)
router.get('/resend/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const quote = await Quote.findById(req.params.id).populate('client').populate('user');
    if (!quote) {
      return res.status(404).send('Quote not found');
    }
    // For simplicity, we'll just log a message. In a real app, you'd send an email or other notification.
    console.log(`Resending quote ${quote._id} to client ${quote.client.name}`);
    req.flash('success_msg', 'Quote resent successfully');
    res.redirect('/tools/quotes');
  } else {
    res.redirect('/tools');
  }
});


module.exports = router;
