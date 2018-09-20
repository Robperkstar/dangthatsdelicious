const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: Date.confirmOwner
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // refernce is from the user Schema
    required: 'You must supply an author!'
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store', // refernce to store schema
    required: 'You must supply a store!'
  },
  text: {
    type: String,
    required: 'You must provide some text'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
});

function autoPopulate(next) {
  this.populate('author');
  next();
}

reviewSchema.pre('find', autoPopulate);
reviewSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Review', reviewSchema);
