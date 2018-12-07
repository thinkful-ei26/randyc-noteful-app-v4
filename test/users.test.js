'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  const usernameTest2 = '';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
      .then(() => User.deleteMany());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return User.deleteMany();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('POST /api/users', function () {

    it('Should create a new user', function () {
       
      let res;

      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, fullname })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'username', 'fullname');
          expect(res.body.id).to.exist;
          expect(res.body.username).to.equal(username);
          expect(res.body.fullname).to.equal(fullname);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.exist;
          expect(user.id).to.equal(res.body.id);
          expect(user.fullname).to.equal(fullname);
          return user.validatePassword(password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });

    it('Should reject users with missing username', function (){
       
      return chai
        .request(app)
        .post('/api/users')
        .send({ password, fullname })
        .then(result => {
           
          expect(result).to.have.status(422);

        });
       
    });

    it('Should reject users with missing password', function (){

      return chai
        .request(app)
        .post('/api/users')
        .send({ username, fullname })
        .then(result => {

          expect(result).to.have.status(422);

        });
 
    });
 
    it('Should reject users with non-string username', function (){
  
      return chai
        .request(app)
        .post('/api/users')
        .send({ username: 44, password, fullname })
        .then(result => {

          expect(result).to.have.status(422);

        });



    });
 
    it('Should reject users with non-string password', function (){

      return chai 
        .request(app)
        .post('/api/users')
        .send({ username, password: 44, fullname })
        .then(result => {

          expect(result).to.have.status(422);

        });
 
    });


    it('Should reject users with non-trimmed username', function (){

      return chai 
        .request(app)
        .post('/api/users')
        .send({ username: ' Name', password, fullname})
        .then(result => {

          expect(result).to.have.status(422);

        });

    });


    it('Should reject users with non-trimmed password', function(){

      return chai 
        .request(app)
        .post('/api/users')
        .send({ username, password: ' Password', fullname})
        .then(result => {

          expect(result).to.have.status(422);

        });

    });


    it('Should reject users with empty username', function(){

      return chai 
        .request(app)
        .post('/api/users')
        .send({ username: '', password, fullname })
        .then(result => {

          expect(result).to.have.status(422);

        });

    });


    it('Should reject users with password less than 8 characters', function(){

      return chai 
        .request(app)
        .post('/api/users')
        .send({ username, password: 'a', fullname})
        .then(result => {

          expect(result).to.have.status(422);

        });

    });


    it('Should reject users with password greater than 72 characters', function(){

      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password: 'wwwwwwwwwwhhhhhhhhhhaaaaaaaaaattttttttttOMGwwwwwwwwwwhhhhhhhhhhaaaaaaaaaatttttttttt'})
        .then(result => {

          expect(result).to.have.status(422);
 
        });

    });


    it('Should reject users with duplicate username', function(){

      return User.create(
        { username: 'msgreen',password }
      )
        .then(() => {

          return chai
            .request(app)
            .post('/api/users')
            .send({ username: 'msgreen', password, fullname })
            .then(result => {
            
              expect(result).to.have.status(400);

            });
         
        });

    });


    it('Should trim fullname', function(){

      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, fullname: ' Full Name'})
        .then(result => {

          expect(result.body.fullname).to.equal('Full Name');
 
        }); 

    });
  
  });

});