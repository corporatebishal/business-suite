const express = require('express');
const router = express.Router();
const { Client } = require('../models/Client');

// List clients
router.get('/', async (req, res) => {
  if (req.isAuthenticated()) {
    const clients = await Client.findAll();
    res.render('clients', { user: req.user, clients: clients });
  } else {
    res.redirect('/tools');
  }
});

// Add client form
router.get('/add', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('add-client', { user: req.user });
  } else {
    res.redirect('/tools');
  }
});

// Handle add client form submission
router.post('/add', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const { name, email, phone, address } = req.body;
      await Client.create({ name, email, phone, address });
      res.redirect('/tools/clients');
    } catch (err) {
      console.error(err);
      res.send('Error adding client');
    }
  } else {
    res.redirect('/tools');
  }
});

// View client details
router.get('/:id', async (req, res) => {
  if (req.isAuthenticated()) {
    const client = await Client.findByPk(req.params.id);
    if (client) {
      res.render('view-client', { user: req.user, client: client });
    } else {
      res.send('Client not found');
    }
  } else {
    res.redirect('/tools');
  }
});

module.exports = router;
