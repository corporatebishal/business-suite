const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('connect-flash');
const { connectDB, sequelize } = require('./config/database');
const User = require('./models/User');
const clientsRouter = require('./routes/clients');

const app = express();
const port = 8081;

// Connect to MySQL
connectDB();

// Middleware to parse POST request body
app.use(bodyParser.urlencoded({ extended: true }));

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
  next();
});

// Passport local strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ where: { username: username } });
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
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve login page for the /tools route
app.get('/tools', (req, res) => {
  res.render('login', { error: req.flash('error') });
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
    res.render('dashboard', { user: req.user });
  } else {
    res.redirect('/tools');
  }
});

// Clients routes
app.use('/tools/clients', clientsRouter);

// Sync all models that aren't already in the database
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}).catch(err => {
  console.error('Unable to sync the database:', err);
});
