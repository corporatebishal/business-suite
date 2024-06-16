require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Quote = require('../models/Quote');
const User = require('../models/User');
const Client = require('../models/Client');
const Company = require('../models/Company');
const { connectDB } = require('../config/database');

connectDB();

const createSampleData = async () => {
  try {
    // Fetch necessary data from existing collections
    const user = await User.findOne();
    const client = await Client.findOne();
    const quote = await Quote.findOne();
    const company = await Company.findOne();

    if (!user || !client || !quote || !company) {
      console.log('Make sure you have at least one User, Client, Quote, and Company in the database.');
      return;
    }

    const sampleInvoices = [
      {
        client: client._id,
        quote: quote._id,
        dueDate: new Date('2023-12-31'),
        taskCompletionDate: new Date(),
        paymentMethods: ['Bank Transfer', 'PayPal'],
        status: 'Pending',
        user: user._id,
        company: company._id
      },
      {
        client: client._id,
        quote: quote._id,
        dueDate: new Date('2024-01-15'),
        taskCompletionDate: new Date(),
        paymentMethods: ['Online Payment', 'BSB'],
        status: 'Pending',
        user: user._id,
        company: company._id
      }
    ];

    await Invoice.insertMany(sampleInvoices);
    console.log('Sample invoices added successfully!');
    process.exit();
  } catch (error) {
    console.error('Error adding sample data:', error);
    process.exit(1);
  }
};

createSampleData();
