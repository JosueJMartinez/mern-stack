const mongoose = require('mongoose');
const chalk = require('chalk');
const config = require('./index');

/**
 * @function createUsers
 * Seed the given list of users
 *
 * @param {string} users The array of user info to be created
 * @returns {Promise} Resolve with a list of newly added users
 */
module.exports.createUsers = users => {
  const User = mongoose.model('User');
  // Only seed root and admin in production mode
  if (config.env === 'production') {
    users = users.filter(user => user.role !== 'user');
  }

  let addedUsers = [];

  return users
    .reduce((sequence, userInfo) => {
      return sequence
        .then(() => {
          return User.findOne({
            $or: [{ username: userInfo.username }, { email: userInfo.email }]
          });
        })
        .then(existingUser => {
          if (existingUser) {
            throw new Error(
              chalk.yellow(
                `[-] [Warning] Database seeding: Email (${userInfo.email}) or username (${userInfo.username}) already in use.`
              )
            );
          }
          const user = new User(userInfo);
          user.setSubId();
          user.provider.local = {
            userId: user._id
          };
          return user.setPasswordAsync(userInfo.password).then(() => {
            return user.save();
          });
        })
        .then(user => {
          if (config.seed.logging) {
            console.log(
              chalk.green(
                `[+] Database Seeding: A new user added (${userInfo.username} - ${userInfo.email} - ${userInfo.password})`
              )
            );
          }
          addedUsers.push(user);
        })
        .catch(err => {
          if (config.seed.logging) {
            console.log(err.message);
          }
        });
    }, Promise.resolve())
    .then(() => Promise.resolve(addedUsers));
};
