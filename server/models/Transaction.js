const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // faculty
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // student
    amount: { type: Number, required: true },
    reason: { type: String },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
