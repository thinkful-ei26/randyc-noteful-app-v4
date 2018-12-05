'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');

const User = require('../models/user');
const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const { users, folders, notes, tags } = require('../db/data');

console.log(`Connecting to mongodb at ${MONGODB_URI}`);
mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.info('Delete Data');
    return Promise.all([
      User.deleteMany(),
      Note.deleteMany(),
      Folder.deleteMany(),
      Tag.deleteMany(),
    ]);
  })
  .then(() => {
    console.info('Seeding Database');
    return Promise.all([
      User.insertMany(users),
      Note.insertMany(notes),
      Folder.insertMany(folders),
      Tag.insertMany(tags)
    ]);
  })
  .then(results => {
    console.log('Inserted', results);
    console.info('Disconnecting');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    return mongoose.disconnect();
  });
