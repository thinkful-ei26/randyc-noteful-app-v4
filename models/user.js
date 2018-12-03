'use strict';

const mongoose = require('mongoose');

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

userSchema.method.validatePassword = function (incomingPassword) {

  const user = this;
  return incomingPassword === user.password;//return true or false

};

module.exports = mongoose.model('User', userSchema);

