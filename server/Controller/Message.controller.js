const mongoose = require('mongoose');
const Message = require('../models/Message.model');
const cloudinary = require('../lib/cloudinary');
// Lazy reference – accessed at request-time (after server.js fully loads), not at require-time
const serverModule = require('../server');
const User = require('../models/User.model');

// Get list of users for sidebar with unseen message counts
const getUserForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filterUsers = await User.find({ _id: { $ne: userId } }).select('-password');
    const unseenMessages = {};
    const promises = filterUsers.map(async (user) => {
      const msgs = await Message.find({ senderId: user._id, receiverId: userId, seen: false });
      if (msgs.length > 0) {
        unseenMessages[user._id] = msgs.length;
      }
    });
    await Promise.all(promises);
    return res.json({ success: true, users: filterUsers, unseenMessages });
  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Get messages between two users
const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });
    // Mark messages from the selected user as seen
    await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });
    return res.json({ success: true, messages });
  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Mark a single message as seen
const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    return res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Send a new message and emit via Socket.IO
const sendMessages = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = await Message.create({ senderId, receiverId, text, image: imageUrl });
    const receiverSocketId = serverModule.UserSocketMap[receiverId];
    if (receiverSocketId) {
      serverModule.io.to(receiverSocketId).emit('newMessage', newMessage);
    }
    return res.json({ success: true, newMessage });
  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
  }
};

module.exports = { getUserForSidebar, getMessages, markMessageAsSeen, sendMessages };