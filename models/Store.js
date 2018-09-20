const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');
const striptags = require('striptags');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name.com!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId, // this is a field on our User model at the moment
    ref: 'User', // get reference to User which is where the objecID is
    required: 'you must provide an author'
  }
}, {
  toJSON: {virtuals: true}, // this will show any virtual fields with the store schema when converted to JSON(i.e reviews)
  toObject: {virtuals: true} // this will show any vitual fields when converted to an object
});
// The below is for indexing in mongodb so it's easier to find data by indedx. eg name etc.

storeSchema.index({
  name: 'text',
  description: 'text' // these two fields are the fields will index by- this is a compound index as there are two fields in one index
});

storeSchema.pre('save', async function (next) {
  this.name = await striptags(this.name);
  // this.slug = slug(this.name);
  this.description = await striptags(this.description);
  this.location['address'] = await striptags(this.location['address']);
  this.location['coordinates'] = await striptags(this.location['coordinates']);
  this.photo = await striptags(this.photo);
  next();
});

// The below is used for when we save a store with the same name as another one
storeSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of wes, wes-1, wes-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    // lookup Stores and populate their reviews
    { $lookup: {from: 'reviews', localField:'_id', // reviews is actually Review- but mongoDB will lower case it and add an s to it.
      foreignField: 'store', as: 'reviews'}}, // foreignField is the field in the Revie model. we will call this field reviews - this is what "as" does
    // filter for only items that have 2 or more reviews so our reviews are skewed by stores with just one
    {$match: {'reviews.1': {$exists: true}}}, // we will only provide stores where there is a index of 1 ie. [0,1] which is two reviews
    // add the average reviews fields
    {$addFields: { // $addField will add another field
      averageRating: {$avg: '$reviews.rating'} // averageRating is the name of the new field. $avg will do the maths for the review rating
    }},
    // sort it by our new field, highest reviews first
    { $sort: {averageRating: -1} }, // sort it by highest first
    // limit to 10 reviews
    {$limit: 10}
  ]);
};

storeSchema.statics.getTagsList = function () {
  return this.aggregate([ // aggregate is funciton similar to find takes an array
    {$unwind: '$tags'}, // we need to unwind the tags- see video on this on wesbos
    {$group: { _id: '$tags', count: { $sum: 1 } }}, // group everything based on tags fiels and each time there is an instance will add one
    {$sort: { count: -1 }} // sort by count desending or assending
  ]);
};
// find reviews where the store _id property is === reviews store property
storeSchema.virtual('reviews', {
  ref: 'Review', // what model to link using "virtual"
  localField: '_id', // this is the local refence for this model- i.e the store id
  foreignField: 'store' // this is the reference on the review schema - ie which store has that review
});

function autoPopulate (next) {
  this.populate('reviews');
  next();
};
storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);
