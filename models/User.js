const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true, // make sure the email address hasn't been used before
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid Email Address'], // needs to be an email or error message thrown
    required: 'Please supply an email address' // need an email or error
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts: [
    {type: mongoose.Schema.ObjectId, ref: 'Store'}
  ]
});

userSchema.virtual('gravatar').get(function () { // this is used to obtain a gravatar for the signed in page based on ursers email address
  const hash = md5(this.email); // provides a has of the  email so it isn't leaked => this is the email associtated with the current user
  return `https://gravatar.com/avatar/${hash}?s=200`; // this is the gravatae with size of 200
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' }); // sorts out the password
userSchema.plugin(mongodbErrorHandler); // makes the erros nice

module.exports = mongoose.model('User', userSchema);
