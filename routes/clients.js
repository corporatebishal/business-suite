const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// List clients
router.get('/', async (req, res) => {
  if (req.isAuthenticated()) {
    const clients = await Client.find();
    res.render('clients', { title: 'Clients', user: req.user, clients: clients });
  } else {
    res.redirect('/tools');
  }
});

// Add client form
router.get('/add', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('add-client', { title: 'Add Client', user: req.user });
  } else {
    res.redirect('/tools');
  }
});

// Handle add client form submission
router.post('/add', async (req, res) => {
  const { name, businessName, email, phone, address, suburb } = req.body;

  try {
    const newClient = new Client({
      name,
      businessName,
      email,
      phone,
      address,
      suburb,
      user: req.user._id,  // Link to the logged-in user
      company: req.user.company  // Link to the user's company
    });

    await newClient.save();
    res.redirect('/tools/clients');
  } catch (err) {
    console.error('Error adding client:', err);
    req.flash('error', 'Error adding client');
    res.redirect('/tools/clients/add');
  }
});

// View client details
router.get('/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const client = await Client.findById(req.params.id);
    if (client) {
      res.render('view-client', { title: 'View Client', user: req.user, client: client });
    } else {
      res.send('Client not found');
    }
  } else {
    res.redirect('/tools');
  }
});

module.exports = router;
