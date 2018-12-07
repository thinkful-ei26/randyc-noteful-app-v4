'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

const passport = require('passport');

const router = express.Router();



//Do note folder id's and tags belong to the current user?
 
//folderId = undefined
//folderId = invalid
//folderId = empty string
//folderId = valid mongo id just does not exist ...yet
//folderId = folder belongs ot another user

//**  folderId = valid folder id which belongs to the current user

//Validation function for folder ids 
function validateFolderId(folderId, userId) {

  console.log('hello folders validation function', folderId, userId);

  //undefined means there is no folder assigned to the note so keep going...
  if(folderId === undefined){

    return Promise.resolve();

  }

   

  //If we get here then there must be a folder assigned to the note so ...Is folder Id a valid mongo id?
  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    
    const err = new Error('The `folderId` is not valid');//not valid mongo id
    err.status = 400;
    return false;

  }

  //If we get here then the note has a folder id and the folder id is valid but 
  //now there should be a Folder in the folder collection with the current user's id attached to it...
  return Folder.countDocuments({ _id: folderId, userId })
    .then(count => {
      if(count === 0 && folderId) {
        const err = new Error('The `folderId` is not valid');//does not exist in the Folder collection with the current user id attached
        err.status = 400;
        return Promise.reject(err);
      }
        
    });
 

}



function validateTagIds(tags, userId) {

  console.log('hello tags validation function', tags, userId);

  //no tag exists move on ....
  if(tags === undefined){

    return Promise.resolve();

  }

  console.log('ok so the note has something in the tags field....');

  //tags must exist ...check to make sure they are in an array...
  if (!Array.isArray(tags)) {
    const err = new Error('The `tags` property must be an array');
    err.status = 400;
    return Promise.reject(err);
  }

   
   
  console.log('>>> tags length is: ',tags.length);//testing

  //check each tag fro valid id... 
  for (let i = 0; i < tags.length; i++){
     
    console.log('>>> tag', tags[i]);//testing

    //Is tag Id a valid mongo id?
    if (tags[i] && !mongoose.Types.ObjectId.isValid(tags[i])) {
    
      const err = new Error('The `tagId` is not valid');
      err.status = 400;
      return Promise.reject(err);

    }

  }
   
  //Look at the Tags collection to see how many tags with this user id and these tag ids exist
  //then compare to the the current user and the curent length of the tags array to see if they are equal
  return Tag.find({ $and: [{ _id: { $in: tags }, userId }] })
    .then(results => {
      if (tags.length !== results.length) {
        const err = new Error('The `tags` array contains an invalid `id`');
        err.status = 400;
        return Promise.reject(err);
      }
    });
 

}
 
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


  const newNote = { userId, title, content, folderId, tags };

  // if folder id is blank then get rid of the field in newNote object... 
  if (newNote.folderId === '') {
    delete newNote.folderId;
  }



  console.log('new note >>>> ',newNote);

  Promise.all([
    validateFolderId(newNote.folderId, userId),
    validateTagIds(newNote.tags, userId)
 
  ])
    .then(() => {
      
      console.log('finished with tags function...'); 

      Note.create(newNote);
        
    })
    .then(result => {
      console.log('result >>>> ',result);
      //res.location(`${req.originalUrl}/${result.id}`).status(201).json(result); what is wrong here?
      res.location(`${req.originalUrl}/${userId}`).status(201).json(result);
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

  // Note.findOneAndUpdate({ _id: id, userId }, toUpdate, { new: true })
  //   .then(result => {
  //     if (result) {
  //       res.json(result);
  //     } else {
  //       next();
  //     }
  //   })
  //   .catch(err => {
  //     next(err);
  //   });

  Promise.all([
    validateFolderId(toUpdate.folderId, userId),
    validateTagIds(toUpdate.tags, userId)
  ])
    .then(() => {
      return Note.findOneAndUpdate({ _id: id, userId }, toUpdate, { new: true })
        .populate('tags');
    })
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
