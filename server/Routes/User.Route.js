const express = require('express');
const { checkAuth, login, signup, updateProfile } = require('../Controller/User.Controller');
const { protectRoute } = require('../middleware/Auth');

const userRouter = express.Router();

userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.put('/update-profile', protectRoute, updateProfile);
userRouter.get('/check', protectRoute, checkAuth);

module.exports = userRouter;
