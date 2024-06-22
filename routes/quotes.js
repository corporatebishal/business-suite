const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
const crypto = require('crypto');

const Quote = require('../models/Quote');
const Client = require('../models/Client');
const Service = require('../models/Service');
const User = require('../models/User');
const BusinessDetails = require('../models/BusinessDetails');
const PaymentDetails = require('../models/PaymentDetails');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.dreamhost.com',
  port: 465,
  secure: true,
  auth: {
    user: 'quotes@bishal.au',
    pass: 'sia@1303#',
  },
});

// Helper function to generate the quote number
function generateQuoteNumber(businessName, lastQuoteNumber) {
  const initials = businessName.split(' ').map(word => word[0]).join('');
  const lastNumber = lastQuoteNumber ? parseInt(lastQuoteNumber.replace(/^\D+/g, '')) : 0;
  return `QN${initials}${lastNumber + 1}`;
}

// List all quotes
router.get('/', async (req, res) => {
  if (req.isAuthenticated()) {
    const quotes = await Quote.find({ company: req.user.company }).sort({ date: -1 }).populate('client').populate('user');
    res.render('quotes', { title: 'Quotes', user: req.user, quotes, currentRoute: '/tools/quotes' });
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
    const lastQuote = await Quote.findOne({ company: req.user.company }).sort({ dateCreated: -1 });

    const newQuoteNumber = generateQuoteNumber(businessDetails.businessName, lastQuote ? lastQuote.quoteNumber : null);

    res.render('add-quote', {
      title: 'Add Quote',
      user: req.user,
      clients,
      services,
      businessDetails,
      paymentDetails,
      newQuoteNumber,
      currentRoute: '/tools/quotes/add'
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

      const uniqueToken = crypto.randomBytes(16).toString('hex');

      const newQuote = new Quote({
        client,
        clientBusinessName,
        services: serviceArray,
        totalAmount: total,
        user: req.user._id,
        company: req.user.company,
        pdfPath,
        quoteNumber,
        uniqueToken,
        dateCreated: new Date(),
        dateSent: sendEmail ? new Date() : null
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

      if (sendEmail) {
        const clientDetails = await Client.findById(client);
        const emailContent = await ejs.renderFile(path.join(__dirname, '..', 'views', 'quote-email-template.ejs'), {
          clientName: clientDetails.name,
          businessName: businessDetails.businessName,
          quoteNumber: newQuote.quoteNumber,
          quoteLink: `http://localhost:8081/tools/quotes/view-token/${newQuote.uniqueToken}`,
          acceptLink: `http://localhost:8081/tools/quotes/accept-token/${newQuote.uniqueToken}`
        });

        const mailOptions = {
          from: 'quotes@bishal.au',
          to: clientDetails.email,
          subject: `RE: Quote received from ${businessDetails.businessName} - #${quoteNumber}`,
          html: emailContent
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
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

// View a quote by ID
router.get('/view/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const quote = await Quote.findById(req.params.id).populate('client').populate('user');
      if (!quote) {
        return res.status(404).send('Quote not found');
      }

      const businessDetails = await BusinessDetails.findOne({ user: quote.user._id });
      const paymentDetails = await PaymentDetails.findOne({ user: quote.user._id });

      res.render('view-quote', {
        title: 'View Quote',
        quote,
        client: await Client.findById(quote.client),
        businessDetails,
        paymentDetails,
        currentRoute: '/tools/quotes/view'
      });
    } catch (err) {
      console.error('Error viewing quote:', err);
      res.status(500).send('Server Error');
    }
  } else {
    res.redirect('/tools');
  }
});

// View a quote by token
router.get('/view-token/:token', async (req, res) => {
  try {
    const quote = await Quote.findOne({ uniqueToken: req.params.token }).populate('client').populate('user');
    if (!quote) {
      return res.status(404).send('Quote not found');
    }

    quote.dateViewed = new Date();
    quote.isViewed = true;
    await quote.save();

    const businessDetails = await BusinessDetails.findOne({ user: quote.user._id });
    const paymentDetails = await PaymentDetails.findOne({ user: quote.user._id });

    res.render('view-quote-public', {
      layout: 'layout-public',
      title: 'View Quote',
      quote,
      client: await Client.findById(quote.client),
      businessDetails,
      paymentDetails
    });
  } catch (err) {
    console.error('Error viewing quote:', err);
    res.status(500).send('Server Error');
  }
});

// Handle quote acceptance without login
router.get('/accept-token/:token', async (req, res) => {
  try {
    const quote = await Quote.findOne({ uniqueToken: req.params.token });
    if (!quote) {
      return res.status(404).send('Quote not found');
    }

    quote.status = 'Accepted';
    quote.dateAccepted = new Date();
    await quote.save();

    // Notify client
    const client = await Client.findById(quote.client);
    const user = await User.findById(quote.user);
    const businessDetails = await BusinessDetails.findOne({ user: quote.user });

    const clientEmailContent = await ejs.renderFile(path.join(__dirname, '..', 'views', 'quote-accepted-client.ejs'), {
      clientName: client.name,
      businessName: businessDetails.businessName,
      quoteLink: `http://localhost:8081/tools/quotes/view-token/${quote.uniqueToken}`
    });

    const clientMailOptions = {
      from: 'quotes@bishal.au',
      to: client.email,
      subject: `Thank you for accepting the quote from ${businessDetails.businessName}`,
      html: clientEmailContent
    };

    transporter.sendMail(clientMailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email to client:', error);
      } else {
        console.log('Client email sent:', info.response);
      }
    });

    // Notify user
    const userEmailContent = await ejs.renderFile(path.join(__dirname, '..', 'views', 'quote-accepted-user.ejs'), {
      userName: user.username,
      clientName: client.name,
      quoteLink: `http://localhost:8081/tools/quotes/view/${quote._id}`
    });

    const userMailOptions = {
      from: 'quotes@bishal.au',
      to: user.email,
      subject: `Quote accepted by ${client.name}`,
      html: userEmailContent
    };

    transporter.sendMail(userMailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email to user:', error);
      } else {
        console.log('User email sent:', info.response);
      }
    });

    res.render('thank-you', {
      layout: 'layout-public',
      title: 'Thank You',
      message: 'Thank you for accepting the quote. We will be in touch shortly. An update with the quote will be sent to you shortly.'
    });
  } catch (err) {
    console.error('Error accepting quote:', err);
    res.status(500).send('Server Error');
  }
});

// Handle quote acceptance
router.get('/accept/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).send('Quote not found');
    }

    quote.status = 'Accepted';
    quote.dateAccepted = new Date();
    await quote.save();

    req.flash('success_msg', 'Quote accepted successfully');
    res.redirect(`/tools/quotes/view/${quote._id}`);
  } catch (err) {
    console.error('Error accepting quote:', err);
    res.status(500).send('Server Error');
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

// Get quote details by ID
router.get('/:quoteId', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.quoteId).populate('client');
    if (!quote) {
      return res.status(404).send('Quote not found');
    }
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
