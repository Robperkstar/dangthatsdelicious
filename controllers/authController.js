const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto'); // this us a method built into nodejs for encrypting things
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', { // local is a stratergy used with passport
  failureRedirect: '/login', // redirects to login page if login fails
  failureFlash: 'Failed Login', // flashes mesage if fail to login
  successRedirect: '/', // takes to home page if successful loginForm
  successFlash: 'You are now logged in'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  req.flash('error', 'Oops you must be logged in to add a store');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. see if a user with that email exists
  const user = await User.findOne({email: req.body.email});
  if (!user) {
    req.flash('error', 'No account with that email');
    return res.redirect('/login');
  }
  // 2. set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex'); // encrypts password token
  user.resetPasswordExpires = Date.now() + 3600000; // the reset password expires in 1 hour
  await user.save();
  // 3. send an email with token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    subject: 'Password Reset',
    resetURL,
    filename: 'password-reset'
  });
  req.flash('success', `You have been emailed a password reset link`);
  // 4. redirect to login page
  res.redirect('/login');
};
exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token, // get the token from the params of the users
    resetPasswordExpires: { $gt: Date.now() } // check that the token is $gt (greater than) right now - if not then it has expired
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  // if there is a user, show the reset password Form
  res.render('reset', { title: 'Reset your password' });
};
exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) { // square barckets used because of "-"
    next();
    return;
  }
  req.flash('error', 'passwords do not match');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token, // get the token from the params of the users
    resetPasswordExpires: { $gt: Date.now() } // check that the token is $gt (greater than) right now - if not then it has expired
  });
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    return res.redirect('/login');
  }
  const setPassword = promisify(user.setPassword, user); // nee to promisify this as it is an old function
  await setPassword(req.body.password);
  user.resetPasswordToken = undefined; // we want to delete resetPasswordToken so we set to undefied
  user.resetPasswordExpires = undefined; // same as above
  const updatedUser = await user.save(); // this actually saves the above commands to the database
  await req.login(updatedUser);
  req.flash('success', 'Password has been reset whoop');
  res.redirect('/');
};
