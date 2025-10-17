const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const subscriberRoutes = require('./routes/subscriberRoutes');
const userRoutes = require('./routes/userRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

// --- SECURE CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:5173',               // Your local dev frontend
  'https://ofallondemsnewsletter.com',   // Your LIVE newsletter app
  'https://otown-dems-hub.onrender.com',  // The old Render URL
  'https://ofallonildems.org'              // ADD THIS LINE for your new official domain
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// --- END OF CORS CONFIGURATION ---

app.use(express.json());

const PORT = process.env.PORT || 8000;

// --- Main Routes for the API ---
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/users', userRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/events', eventRoutes);

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