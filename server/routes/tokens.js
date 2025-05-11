const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// ⏳ Token validity in hours
const TOKEN_VALIDITY_HOURS = 48;

// ✅ Automatically issue tokens to a student
router.post('/auto-issue', async (req, res) => {
    const { studentId, amount, reason } = req.body;

    if (!studentId || !amount) {
        return res.status(400).json({ msg: 'Student ID and amount required' });
    }

    try {
        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ msg: 'Student not found' });

        // Add tokens to student's balance
        student.tokens += amount;
        await student.save();

        // Save transaction with expiry
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + TOKEN_VALIDITY_HOURS);

        const transaction = new Transaction({
            to: student._id,
            amount,
            reason,
            issuedAt: new Date(),
            expiresAt: expiryDate
        });

        await transaction.save();

        res.status(201).json({ msg: `Issued ${amount} tokens`, tokens: student.tokens });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error during auto-issue' });
    }
});

// 🎁 Redeem tokens (students only)
router.post('/redeem', authMiddleware, async (req, res) => {
    const { amount } = req.body;

    try {
        const student = await User.findById(req.user.id);
        if (!student) return res.status(404).json({ msg: 'Student not found' });

        if (student.tokens < amount) {
            return res.status(400).json({ msg: 'Insufficient tokens' });
        }

        student.tokens -= amount;
        await student.save();

        res.json({ msg: `Redeemed ${amount} tokens`, tokens: student.tokens });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error during redeem' });
    }
});

// 🔍 Get valid tokens
router.get('/valid-transactions', authMiddleware, async (req, res) => {
    try {
        const now = new Date();

        const transactions = await Transaction.find({
            to: req.user.id,
            expiresAt: { $gt: now }
        }).sort({ issuedAt: -1 });

        res.json({ validTransactions: transactions });
    } catch (err) {
        res.status(500).json({ msg: 'Server error fetching valid transactions' });
    }
});

// 💰 Check token balance
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ tokens: user.tokens });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
