const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // student receiving the token
    amount: { type: Number, required: true },
    reason: { type: String }, // Optional, e.g., "achievement", "event participation"
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }, // Token validity
    status: { type: String, enum: ['active', 'expired', 'redeemed'], default: 'active' }
});

module.exports = mongoose.model('Transaction', transactionSchema);
