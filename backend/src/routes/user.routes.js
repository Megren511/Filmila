const express = require('express');
const router = express.Router();
const { User } = require('../models');
const auth = require('../middleware/auth');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive information
    const { password_hash, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedUpdates = ['first_name', 'last_name', 'email'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const updatedUser = await User.update(req.user.id, updates);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive information
    const { password_hash, ...userProfile } = updatedUser;
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user profile', error: error.message });
  }
});

// Delete user account
router.delete('/', auth, async (req, res) => {
  try {
    const deletedUser = await User.delete(req.user.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user account', error: error.message });
  }
});

module.exports = router;
