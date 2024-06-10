const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const oauth2Client = require('../config/oauth2');

const Quote = require('../models/Quote');
const Client = require('../models/Client');
const Service = require('../models/Service');
const User = require('../models/User');
const BusinessDetails = require('../models/BusinessDetails');
const PaymentDetails = require('../models/PaymentDetails');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');

// Helper function to generate the quote number
function generateQuoteNumber(businessName, lastQuoteNumber) {
  const initials = businessName.split(' ').map(word => word[0]).join('');
  const lastNumber = lastQuoteNumber ? parseInt(lastQuoteNumber.replace(`QN${initials}`, '')) : 0;
  return `QN${initials}${lastNumber + 1}`;
}

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
    const businessDetails = await BusinessDetails.findOne({ user: req.user._id });
    const paymentDetails = await PaymentDetails.findOne({ user: req.user._id });
    const lastQuote = await Quote.findOne({ company: req.user.company }).sort({ date: -1 });

    const newQuoteNumber = generateQuoteNumber(businessDetails.businessName, lastQuote ? lastQuote.quoteNumber : null);

    res.render('add-quote', {
      title: 'Add Quote',
      user: req.user,
      clients,
      services,
      businessDetails,
      paymentDetails,
      newQuoteNumber
    });
  } else {
    res.redirect('/tools');
  }
});

// Handle adding a new quote
router.post('/add', async (req, res) => {
  if (req.isAuthenticated()) {
    const { client, clientBusinessName, services, customPrices, totalAmount, customTotalAmount, quoteNumber, sendEmail } = req.body;

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
        pdfPath,
        quoteNumber
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

      // Send email if requested
      if (sendEmail) {
        const user = await User.findById(req.user._id);
        const clientDetails = await Client.findById(client);

        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URL
        );

        oauth2Client.setCredentials({
          access_token: user.oauthTokens.accessToken,
          refresh_token: user.oauthTokens.refreshToken,
          expiry_date: user.oauthTokens.expiryDate
        });

        oauth2Client.on('tokens', (tokens) => {
          if (tokens.refresh_token) {
            user.oauthTokens.refreshToken = tokens.refresh_token;
            user.oauthTokens.accessToken = tokens.access_token;
            user.oauthTokens.expiryDate = tokens.expiry_date;
            user.save();
          }
        });

        const transport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: user.email,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: user.oauthTokens.refreshToken,
            accessToken: user.oauthTokens.accessToken
          }
        });

        const mailOptions = {
          from: user.email,
          to: clientDetails.email,
          subject: `Quote ${quoteNumber}`,
          text: 'Please find the attached quote.',
          attachments: [
            {
              filename: 'quote.pdf',
              path: fullPdfPath
            }
          ]
        };

        transport.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error('Error sending email:', err);
          } else {
            console.log('Email sent:', info.response);
          }
        });
      }

      res.redirect('/tools/quotes');
    } catch (err) {
      console.error('Error creating quote:', err);
      res.status(500).send('Server Error');
    }
  } else {
    res.redirect('/tools');
  }
});

// Delete a quote
router.post('/delete/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const quote = await Quote.findById(req.params.id);
      if (!quote) {
        return res.status(404).send('Quote not found');
      }
      await Quote.findByIdAndDelete(req.params.id);
      req.flash('success_msg', 'Quote deleted successfully');
      res.redirect('/tools/quotes');
    } catch (err) {
      console.error('Error deleting quote:', err);
      res.status(500).send('Server Error');
    }
  } else {
    res.redirect('/tools');
  }
});

// Fetch client business name and address
router.get('/client/:id/business-name', async (req, res) => {
  if (req.isAuthenticated()) {
    const client = await Client.findById(req.params.id);
    res.json({
      businessName: client ? client.businessName : '',
      address: client ? client.address : ''
    });
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
