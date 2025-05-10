const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth'); // JWT middleware

const router = express.Router();

// 🔐 Issue tokens (faculty only)
router.post('/issue', auth, async (req, res) => {
    if (req.user.role !== 'faculty') {
        return res.status(403).json({ msg: 'Only faculty can issue tokens' });
    }

    const { studentEmail, amount } = req.body;

    try {
        const student = await User.findOne({ email: studentEmail, role: 'student' });
        if (!student) return res.status(404).json({ msg: 'Student not found' });

        student.tokens += Number(amount);
        await student.save();

        res.json({ msg: `Issued ${amount} tokens to ${student.name}`, tokens: student.tokens });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// 🎁 Redeem tokens (students)
router.post('/redeem', auth, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ msg: 'Only students can redeem tokens' });
    }

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
        res.status(500).json({ msg: 'Server error' });
    }
});

// 🔍 Get current token balance
router.get('/balance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ tokens: user.tokens });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
