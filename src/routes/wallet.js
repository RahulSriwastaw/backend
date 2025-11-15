import express from 'express';

const router = express.Router();

// Get wallet balance
router.get('/balance', async (req, res) => {
  try {
    // In production, get from database
    res.json({
      balance: 100,
      totalEarned: 100,
      totalSpent: 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transactions
router.get('/transactions', async (req, res) => {
  try {
    // In production, get from database
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add points (for testing/admin)
router.post('/add-points', async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    res.json({
      success: true,
      message: `${amount} points added`,
      newBalance: 100 + amount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

