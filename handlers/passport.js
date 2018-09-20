const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use(User.createStrategy()); // this is from the plugin on User.js
passport.serializeUser(User.serializeUser()); // pass on the user object
passport.deserializeUser(User.deserializeUser());
