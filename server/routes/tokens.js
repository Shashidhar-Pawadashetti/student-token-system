const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Faculty issues tokens to a student
router.post('/issue', auth, roleCheck('faculty'), async (req, res) => {
    const { studentId, amount, reason } = req.body;

    try {
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ msg: 'Student not found' });
        }

        student.tokens += amount;
        await student.save();

        const tx = new Transaction({
            from: req.user.id,
            to: studentId,
            amount,
            reason
        });

        await tx.save();

        res.json({ msg: 'Tokens issued successfully', tokens: student.tokens });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
