'use strict';

const express = require('express');

const mongoose = require('mongoose');

const User = require('../models/user');

const router = express.Router();

/* ---- POST ----- */

router.post('/', (req,res,next) => {

  const { username, password } = req.body;

  const newUser = {

    username: username,
    password: password

  };

  User.create(newUser)
    .then(result => {
      res.location(`${req.originalUrl}`).status(201).json(result);
    })
    .catch(err => {

      next(err);

    });


});
   
module.exports = router;
