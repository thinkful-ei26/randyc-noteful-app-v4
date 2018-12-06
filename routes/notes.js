'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Note = require('../models/note');

const passport = require('passport');

const router = express.Router();


// Protect endpoints using JWT Strategy
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }));

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
 
  const userId = req.user.id;//coming from jwt

  console.log('folder id >>>> ',folderId);

  let filter = { userId };
 
  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'content': re }];
  }
   
  //filter by folder Id
  if (folderId) {
    filter.folderId = folderId;
  }

  //Filter by Tag id
  if (tagId) {
    filter.tags = tagId;
  }

  console.log('notes filter: ',filter);

  Note.find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  console.log('user id >>>>>',userId);
  console.log('note id >>>>>',id);

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  //console.log('note id >>>>>', {_id:id});

  Note.findOne({ _id: id, userId })
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

//folderId = undefined
//folderId = invalid
//folderId = empty string
//folderId = valid mongo id just does not exist ...yet
//folderId = folder belongs ot another user

//**  folderId = valid folder id which belongs to the current user

//Validation for folder ids -- later
const validateFolderId = function (folderId, userId) {

  //undefiend go make it
  if(folderId === undefined){

    return Promise.resolved();

  }

  //invalid folder Id can't be empty
  if(folderId === ''){

    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return Promise.reject(err);

  }

  //Is folder Id is a valid mongo id?
  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
    
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return false;

  }

  //Duplicate id check -- any docs with the same folderId?
  folderId.countDocuments({ _id: folderId, userId })
    .then(count => {
      if(count === 0 && folderId) {
        const err = new Error('The `folderId` is not vlaid');
        err.status = 400;
        return Promise.reject(err);
      }
        
    });
 

};



//Works
/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  //Notes -- require titles!
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  
 
  //tags
  if (tags) {
    const badIds = tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if (badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
  }


  const newNote = { userId, title, content, folderId, tags };
 
  if (newNote.folderId === '') {
    delete newNote.folderId;
  }


  //Folders
  // return validateFolderId(folderId, userId)
  //   .then(() => {
 
  //     return Note.create(newNote);

  //   })
  //   .then(result => {

  //     res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);

  //   })
  //   .catch(err => {
  //     next(err);
  //   });

  //no validation
  Note.create(newNote)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      next(err);
    });

    
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const toUpdate = {};
  const updateableFields = ['title', 'content', 'folderId', 'tags'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.folderId && !mongoose.Types.ObjectId.isValid(toUpdate.folderId)) {
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.tags) {
    const badIds = toUpdate.tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if (badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
  }

  if (toUpdate.folderId === '') {
    delete toUpdate.folderId;
    toUpdate.$unset = {folderId : 1};
  }

  Note.findOneAndUpdate({ _id: id, userId }, toUpdate, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  
  const { id } = req.params;
  const userId = req.user.id;

  
  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOneAndDelete({ _id: id, userId })
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
