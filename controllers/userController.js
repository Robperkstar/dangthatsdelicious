const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify'); // promisify makes old functions async await
// const User = mongoose.model('User');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login Form' });
};
exports.registerForm = (req, res) => {
  res.render('register', {title: 'register Form'});
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name'); // express validator has this sanitize method in it
  req.checkBody('name', 'you must supply a name').notEmpty();
  req.checkBody('email', 'that email is not valid').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  }); // will check email variation and add rules
  req.checkBody('password', 'Password cannot be blank').notEmpty();
  req.checkBody('password-confirm', ' confirmed password cannot be blank').notEmpty();
  req.checkBody('password-confirm', 'Oops your passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
    return; // stops the function from running
  }
  next(); // there were no erros- so the next middleware will be called.
};

exports.register = async (req, res, next) => {
  const user = new User({email: req.body.email, name: req.body.name});
  const register = promisify(User.register, User);// .register is a method from the plugin passportLocalMongoose which deals with password hashes(on the User schema)
  await register(user, req.body.password); // this encrypts password
  next(); // pass to authocontroller.login
};

exports.account = (req, res) => {
  res.render('account', {title: 'Edit your Account'});
};

exports.updateAccount = async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findOneAndUpdate( // this will update the user- need to include what needs to be updated
    { _id: req.user._id }, // user variable is available to us throughout the website
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );
  req.flash('success', 'Updated the account');
  res.redirect('back');
};
