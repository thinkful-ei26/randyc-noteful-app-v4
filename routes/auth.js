'use strict';

const express = require('express');

const mongoose = require('mongoose');

const User = require('../models/user');

const passport = require('passport');
 
const router = express.Router();

const { JWT_SECRET, JWT_EXPIRY } = require('../config');

const dotenv = require('dotenv');

const jwt = require('jsonwebtoken');


 

/* ---- POST w/AUTH ----- */
const options = {session: false, failWithError: true};
const localAuth = passport.authenticate('local', options);

/* --- POST REFRESH ---*/
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

console.log('>>>> hello');

 
function createAuthToken (user) {
 
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });

}

router.post('/login', localAuth, function (req,res) {
  
  console.log('>>>> req.user', req.user);

  const authToken = createAuthToken(req.user);
  return res.json( {authToken} );

});
 
router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});



module.exports = router;