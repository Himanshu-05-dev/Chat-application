const express = require('express');
const { protectRoute } = require('../middleware/Auth');
const { getMessages, getUserForSidebar, markMessageAsSeen, sendMessages } = require('../Controller/Message.controller');

const messageRouter = express.Router();

messageRouter.get('/users', protectRoute, getUserForSidebar);
messageRouter.get('/:id', protectRoute, getMessages);
messageRouter.put('/mark/:id', protectRoute, markMessageAsSeen);
messageRouter.post('/send/:id', protectRoute, sendMessages);

module.exports = messageRouter;
