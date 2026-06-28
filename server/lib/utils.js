const jwt = require('jsonwebtoken');

module.exports.generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return token;
};