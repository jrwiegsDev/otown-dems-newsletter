// server.js

const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const subscriberRoutes = require('./routes/subscriberRoutes'); // 1. IMPORT THE ROUTES

const app = express();

// Middleware to parse JSON bodies
app.use(express.json()); // 2. ADD THIS MIDDLEWARE

const PORT = process.env.PORT || 8000;

// --- Main Route for the API ---
app.use('/api/subscribers', subscriberRoutes); // 3. USE THE ROUTES

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB:', error.message);
  });