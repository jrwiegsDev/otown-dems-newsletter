import axios from 'axios';

const API_URL = 'http://localhost:5000/api/subscribers/';

// Get all subscribers
const getSubscribers = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

// Add a new subscriber
const addSubscriber = async (subscriberData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(API_URL, subscriberData, config);
  return response.data;
};

// Delete a subscriber
const deleteSubscriber = async (subscriberId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.delete(API_URL + subscriberId, config);
  return response.data;
};

const subscriberService = {
  getSubscribers,
  addSubscriber,
  deleteSubscriber,
};

export default subscriberService;