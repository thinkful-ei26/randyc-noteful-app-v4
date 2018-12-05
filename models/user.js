'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  fullname: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
 
});

//prevent password from being returned
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
    delete result.password;//password gets gone

  }
});


userSchema.methods.validatePassword = function (incomingPassword) {
  
  const currentUser = this;
  return bcrypt.compare(incomingPassword, currentUser.password);
};

userSchema.statics.hashPassword = function (incomingPassword) {
  const digest = bcrypt.hash(incomingPassword, 10);
  return digest;
};

module.exports = mongoose.model('User', userSchema);

