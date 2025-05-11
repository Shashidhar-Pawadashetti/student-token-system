const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());  // Native Express JSON parsing
app.use(express.urlencoded({ extended: true }));  // Native Express URL encoding

// Route imports
const authRoutes = require('./routes/auth');      // Handles /register and /login
const tokenRoutes = require('./routes/tokens');   // Handles token redeem/issue

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Student Token System Backend');
});

module.exports = app;
