// routes/game.js
const express = require('express');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const router = express.Router();

// Update high score and save past scores
router.post('/update-score', protect, async (req, res) => {
  const { score } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update high score if necessary
    if (score > user.highScore) {
      user.highScore = score;
    }

    // Save score to user's past scores
    user.scores.push(score);
    await user.save();

    res.status(200).json({ highScore: user.highScore, scores: user.scores });
  } catch (err) {
    res.status(500).json({ message: 'Error updating score', error: err });
  }
});

// Fetch past scores and high score
router.get('/get-scores', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ highScore: user.highScore, scores: user.scores });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching scores', error: err });
  }
});

module.exports = router;