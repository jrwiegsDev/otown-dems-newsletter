import api from '../api/axiosConfig'; // Use our custom api instance

const API_URL = '/api/subscribers/'; // The path is now relative

// Get all subscribers
const getSubscribers = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.get(API_URL, config);
  return response.data;
};

// Add a new subscriber
const addSubscriber = async (subscriberData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.post(API_URL, subscriberData, config);
  return response.data;
};

// --- THIS IS THE NEW FUNCTION ---
// Update a subscriber
const updateSubscriber = async (subscriberId, subscriberData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.put(API_URL + subscriberId, subscriberData, config);
  return response.data;
};
// --------------------------------

// Delete a subscriber
const deleteSubscriber = async (subscriberId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.delete(API_URL + subscriberId, config);
  return response.data;
};

const subscriberService = {
  getSubscribers,
  addSubscriber,
  updateSubscriber, // <-- ADDED TO EXPORT
  deleteSubscriber,
};

export default subscriberService;