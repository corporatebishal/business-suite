const mongoose = require('mongoose');
const User = require('../models/User');
const Client = require('../models/Client');
const Service = require('../models/Service');
const Quote = require('../models/Quote');
const Company = require('../models/Company');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/business-suite', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  // Drop existing collections
  await db.dropCollection('users').catch(err => console.log('users collection does not exist'));
  await db.dropCollection('clients').catch(err => console.log('clients collection does not exist'));
  await db.dropCollection('services').catch(err => console.log('services collection does not exist'));
  await db.dropCollection('quotes').catch(err => console.log('quotes collection does not exist'));
  await db.dropCollection('companies').catch(err => console.log('companies collection does not exist'));

  console.log('Collections dropped');

  // Create sample data
  const company = new Company({ name: 'My Company', address: '123 Business St', phone: '555-5555', email: 'contact@mycompany.com' });
  await company.save();

  const user = new User({ username: 'admin', password: 'password', company: company._id });
  await user.save();

  const client1 = new Client({ name: 'Client One', businessName: 'Business One', email: 'client1@example.com', phone: '1234567890', address: '123 Main St' });
  const client2 = new Client({ name: 'Client Two', businessName: 'Business Two', email: 'client2@example.com', phone: '0987654321', address: '456 Elm St' });
  await client1.save();
  await client2.save();

  const service1 = new Service({ name: 'Service One', price: 100, createdBy: user._id, company: company._id });
  const service2 = new Service({ name: 'Service Two', price: 200, createdBy: user._id, company: company._id });
  await service1.save();
  await service2.save();

  const quote = new Quote({
    client: client1._id,
    clientBusinessName: client1.businessName,
    services: [{ name: service1.name, price: service1.price }],
    totalAmount: 100,
    status: 'Pending'
  });
  await quote.save();

  console.log('Sample data created');

  mongoose.connection.close();
});
