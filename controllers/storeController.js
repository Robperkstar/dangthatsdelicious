const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const User = mongoose.model('User');
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter (req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going!
  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id; // set the author to the user_id
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  if (page < 1) {
    req.flash('info', 'the page number must be positive so I\'ve put you back on page 1');
    res.redirect(`/stores/page/1`);
    return;
  }
  const limit = 4;
  const skip = (page * limit) - limit; // work out how many stores to skip by depending on page number
  // 1. Query the database for a list of all stores
  const storesPromise = Store
    .find() // find all the stores
    .skip(skip) // skip the amount of stores depending on how many stores we have to skip
    .limit(limit) // limit the amount of stores we show to the limit (4 in this case)
    .sort({created: 'desc'}); // sort by latest first

  const countPromise = Store.count(); // looks like count will count number of stores and return this promise- not sure where this function comes from though
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit); // count is number of stores we have and ceil will limit how many pages there are to the next whole number
  if (!stores.length && skip) {
    req.flash('info', `you asked for page ${page}. But it doesn't exist so I put you on page
    ${pages}`);
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render('stores', { title: 'Stores', stores, page, pages, count });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) { // if the store author isn't equal to the user id then throw error we use equal as we are using an objectID
    throw Error('you must own the store to edit it');
  }
};

exports.editStore = async (req, res) => {
  // 1. Find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the store
  confirmOwner(store, req.user); // this will check if the store author is equal to the objectID
  // 3. Render out the edit form so the user can update their store
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true
  }).exec();

  // to do - update the store slug so that the link is the correct nane
  await store.save();

  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View Store →</a>`);
  res.redirect(`/stores/${store._id}/edit`);
  // Redriect them the store and tell them it worked
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug })
    .populate('author reviews');
  // populate will provide all the details for the author and reviews, not just ID
  if (!store) return next();
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({tags: tagQuery});
  const allStoresPromise = Store.find();
  var both = Promise.all([tagsPromise, storesPromise, allStoresPromise]);
  const [tags, stores, allStores] = await both;
  res.render('tag', { tags, title: 'Tags', tag, stores, allStores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
    .find({
      $text: { // this is an operator for mongodb- alows us to search index
        $search: req.query.q // this is what we are searching
      }
    }, {
      score: {$meta: 'textScore'} // this looks at the query searched and gives it a score depending on how manyt imes its mentioned
    }).sort({ // this sorts the $meta data by textScore
      score: {$meta: 'textScore'
      }
    })
    .limit(5); // this will limit to results to the top 5
  res.json(stores);
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString()); // we want an array of strings not objects
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'; // if the hearts includes the id then operator = remove. if not then add to set
  const user = await User
    .findByIdAndUpdate(req.user._id, // find the USer by ID and update
      {[operator]: {hearts: req.params.id}}, // the operator will either be pull or addtoset, and it will add or remove the req.params.id (store clicked)
      {new: true} // this will mean we will use the updated version of req.user._id rather than previous
    );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: {$in: req.user.hearts}
  });
  res.render('stores', {title: 'favourite Stores', stores});
};

exports.getTopStores = async(req, res)=>{
  const stores = await Store.getTopStores(); // this method is complecated so we put on the Store model
  res.render('topStores', {stores, title: 'top stores'});
};
