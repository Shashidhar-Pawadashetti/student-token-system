const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Token = require('./models/Token');           // <- You must create this file if missing
const Transaction = require('./models/Transaction');

// Middleware
const authenticateToken = require('./middleware/auth');

// Load env variables
dotenv.config();
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Root Route
app.get('/', (req, res) => {
  res.send('🚀 Student Token System Backend Running');
});

// ✅ Register Student
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'student'
    });
    await newUser.save();

    const initialToken = new Token({
      userId: newUser._id,
      balance: 10,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    await initialToken.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: newUser._id, name, email, role: newUser.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ Check Token Balance
app.get('/api/tokens/balance', authenticateToken, async (req, res) => {
  try {
    const tokenData = await Token.findOne({ userId: req.user.id });
    if (!tokenData) return res.status(404).json({ msg: 'No token record found' });

    if (new Date() > tokenData.expiryDate) {
      return res.status(400).json({ msg: 'Tokens have expired' });
    }

    res.json({ balance: tokenData.balance, expires: tokenData.expiryDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ Redeem Tokens
app.post('/api/tokens/redeem', authenticateToken, async (req, res) => {
  const { amount } = req.body;

  try {
    const tokenData = await Token.findOne({ userId: req.user.id });
    if (!tokenData) return res.status(404).json({ msg: 'No token record found' });

    if (amount > tokenData.balance) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    tokenData.balance -= amount;
    await tokenData.save();

    res.json({ msg: 'Tokens redeemed successfully', balance: tokenData.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
