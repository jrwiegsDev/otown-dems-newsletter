const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // 1. Import the 'http' module
const WebSocket = require('ws'); // 2. Import the 'ws' library
const { startPollScheduler } = require('./utils/pollScheduler'); // Import poll scheduler

const subscriberRoutes = require('./routes/subscriberRoutes');
const userRoutes = require('./routes/userRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const eventRoutes = require('./routes/eventRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const pollRoutes = require('./routes/pollRoutes');

const app = express();

// --- SECURE CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://ofallondemsnewsletter.com',
  'https://otown-dems-hub.onrender.com',
  'https://ofallonildems.org'
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
app.use('/api/announcements', announcementRoutes);
app.use('/api/poll', pollRoutes);

// --- 3. Create an HTTP server using the Express app ---
// This allows both Express (HTTP) and WebSockets (WS) to run on the same port.
const server = http.createServer(app);

// --- 4. Create a WebSocket server attached to the HTTP server ---
const wss = new WebSocket.Server({ server });

// --- 5. Set to keep track of all connected clients ---
const clients = new Set();

// --- 6. Broadcast function to send data to all connected clients ---
function broadcastUserCount() {
  const userCount = clients.size;
  const message = JSON.stringify({ type: 'userCount', count: userCount });
  console.log(`Broadcasting user count: ${userCount}`);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// --- Poll Results Broadcast Function ---
function broadcastPollResults(results) {
  const message = JSON.stringify({ type: 'pollResults', data: results });
  console.log(`Broadcasting poll results update`);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Make broadcastPollResults available globally
global.broadcastPollResults = broadcastPollResults;

// --- 7. Handle WebSocket connections ---
wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws); // Add new client to the set
  broadcastUserCount(); // Send the current count immediately

  // Handle client closing connection
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws); // Remove client from the set
    broadcastUserCount(); // Broadcast the updated count
  });

  // Optional: Handle messages from clients (not needed for simple count)
  ws.on('message', (message) => {
    console.log('Received:', message);
  });

  // Optional: Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws); // Clean up if there's an error
    broadcastUserCount();
  });
});

// --- 8. Connect to MongoDB and start the HTTP server (instead of app.listen) ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    
    // Start the poll scheduler
    startPollScheduler();
    
    // Start the HTTP server, which now also handles WebSocket connections
    server.listen(PORT, () => {
      console.log(`Server (HTTP & WS) is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log('Error connecting to MongoDB:', error.message);
  });