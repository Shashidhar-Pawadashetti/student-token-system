const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  expiryDate: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('Token', tokenSchema);
