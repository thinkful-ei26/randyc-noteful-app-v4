'use strict';

const express = require('express');

//const mongoose = require('mongoose');

const User = require('../models/user');

//const passport = require('passport');

const router = express.Router();
 
// Protect endpoints using JWT Strategy
//router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

router.get('/',(req,res,next) => {

  User.find()
    .sort('asc')
    .then (results => {
      res.json(results);
 
    })
    .catch(error => {

      next(error);
  
    });
  
});

/* ---- POST CREATE----- */

router.post('/', (req,res,next) => {

  const { username, password, fullname } = req.body;//what syntax does front end use? --- camel case or lower case for fullname?
 
  return User.hashPassword(password)
 
    .then(digest => {
      
      const newUser = {
        username,
        password: digest,
        fullname
      };

      return User.create(newUser);
      
    })
    .then(result => {
      return res.status(201).location(`/api/users/${result.id}`).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });


});
   
module.exports = router;
