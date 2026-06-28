const cloudinary = require('../lib/cloudinary');
const { generateToken } = require('../lib/utils');
const User = require('../models/User.model');
const bcrypt = require('bcrypt');

// Sign up a new user
const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;
  try {
    if (!fullName || !password || !email || !bio) {
      return res.json({ success: false, message: 'Missing details' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: 'Account already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({ fullName, email, password: hashedPassword, bio });
    const token = generateToken(newUser._id);
    return res.json({
      success: true,
      message: 'User created successfully',
      userData: newUser,
      token,
    });
  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Login existing user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateToken(user._id);
    return res.json({
      success: true,
      message: 'Login successful',
      userData: user,
      token,
    });
  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
};

const checkAuth = (req, res) => {
  return res.json({ success: true, user: req.user });
};

const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });
    } else {
      console.log('[updateProfile] Uploading image to Cloudinary...');
      const upload = await cloudinary.uploader.upload(profilePic);
      console.log('[updateProfile] Cloudinary upload success:', upload.secure_url);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }
    return res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('[updateProfile] ERROR:', error);
    return res.json({ success: false, message: error.message });
  }
};

module.exports = { signup, login, checkAuth, updateProfile };