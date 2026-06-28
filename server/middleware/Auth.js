const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

const protectRoute = async (req, res, next) => {
  try {
    const token = req.headers.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.json({ message: error.message });
  }
};

module.exports = { protectRoute };