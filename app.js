require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('connect-flash');
const { connectDB } = require('./config/database'); // Ensure this line correctly imports connectDB
const User = require('./models/User');
const clientsRouter = require('./routes/clients');
const quotesRouter = require('./routes/quotes');
const expressLayouts = require('express-ejs-layouts');
const settingsRouter = require('./routes/settings');
const uploadsRouter = require('./routes/uploads');

const app = express();
const port = 8081;

// Connect to MongoDB
connectDB(); // This should now correctly call the connectDB function

// Middleware to parse POST request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add this line to handle JSON requests

// Express session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null; // Make user available in all views
  next();
});

// Passport local strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) return done(null, false, { message: 'Unknown User' });

      if (user.password !== password) {
        return done(null, false, { message: 'Invalid password' });
      } else {
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Set EJS as templating engine and use express-ejs-layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve login page for the /tools route
app.get('/tools', (req, res) => {
  res.render('login', { layout: 'layout-login', title: 'Login', error: req.flash('error') });
});

// Handle login form submission
app.post('/tools/login', passport.authenticate('local', {
  successRedirect: '/tools/dashboard',
  failureRedirect: '/tools',
  failureFlash: true
}));

// Serve dashboard after successful login
app.get('/tools/dashboard', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('dashboard', { layout: 'layout', title: 'Dashboard', user: req.user });
  } else {
    res.redirect('/tools');
  }
});

// Clients routes
app.use('/tools/clients', clientsRouter);

// Quotes routes
app.use('/tools/quotes', quotesRouter);

app.use('/tools', settingsRouter);
app.use('/tools/uploads', uploadsRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
