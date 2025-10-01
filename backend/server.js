const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const subscriberRoutes = require('./routes/subscriberRoutes');
const userRoutes = require('./routes/userRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes'); // <-- 1. IMPORT

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;

// --- Main Routes for the API ---
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/users', userRoutes);
app.use('/api/newsletter', newsletterRoutes); // <-- 2. USE THE ROUTE

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