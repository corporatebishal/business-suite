const { Sequelize } = require('sequelize');

// Initialize Sequelize to connect to MySQL
const sequelize = new Sequelize('bishalcomau_businesssuite', 'businesssuite', 'Supple@135#', {
  host: 'mysql.bishal.com.au',
  dialect: 'mysql'
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, connectDB };
