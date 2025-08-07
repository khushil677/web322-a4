// modules/auth-service.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// 1) Define the User schema
const userSchema = new mongoose.Schema({
  userName:     { type: String, unique: true },
  password:     String,
  email:        String,
  loginHistory: [
    {
      dateTime:  Date,
      userAgent: String
    }
  ]
});

let User; // will be set in initialize()

// 2) initialize(): connect to MongoDB Atlas & compile model
function initialize() {
  return new Promise((resolve, reject) => {
    const db = mongoose.createConnection(process.env.MONGODB, {
      useNewUrlParser:    true,
      useUnifiedTopology: true
    });

    db.on('error', err => reject(err));
    db.once('open', () => {
      User = db.model('users', userSchema);
      resolve();
    });
  });
}

// 3) registerUser(): hash & store new user
function registerUser(userData) {
  return new Promise((resolve, reject) => {
    // passwords must match
    if (userData.password !== userData.password2) {
      return reject('Passwords do not match');
    }

    // hash the password
    bcrypt.hash(userData.password, 10)
      .then(hashed => {
        // create document without password2
        const newUser = new User({
          userName:     userData.userName,
          password:     hashed,
          email:        userData.email,
          loginHistory: []
        });
        return newUser.save();
      })
      .then(() => resolve())
      .catch(err => {
        // duplicate userName?
        if (err.code === 11000) {
          reject('User Name already taken');
        } else {
          reject(`There was an error creating the user: ${err}`);
        }
      });
  });
}

// 4) checkUser(): validate & update login history
function checkUser(userData) {
  return new Promise((resolve, reject) => {
    let foundUser;
    // find by userName
    User.find({ userName: userData.userName })
      .then(users => {
        if (!users.length) {
          throw `Unable to find user: ${userData.userName}`;
        }
        foundUser = users[0];
        // compare provided password with hash
        return bcrypt.compare(userData.password, foundUser.password);
      })
      .then(match => {
        if (!match) {
          throw `Incorrect Password for user: ${userData.userName}`;
        }

        // update loginHistory (keep latest 8)
        const history = foundUser.loginHistory.slice(0, 7);
        history.unshift({
          dateTime:  new Date().toString(),
          userAgent: userData.userAgent
        });

        // save back to database
        return User.updateOne(
          { userName: foundUser.userName },
          { $set: { loginHistory: history } }
        );
      })
      .then(() => {
        // return the user doc (without password)
        resolve({
          userName:     foundUser.userName,
          email:        foundUser.email,
          loginHistory: foundUser.loginHistory
        });
      })
      .catch(err => {
        // reject string errors or wrap others
        reject(typeof err === 'string' ? err : `There was an error verifying the user: ${err}`);
      });
  });
}

module.exports = {
  initialize,
  registerUser,
  checkUser
};
