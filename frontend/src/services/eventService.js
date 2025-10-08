import api from '../api/axiosConfig';

const API_URL = '/api/events/';

// Get all events
const getAllEvents = async () => {
  // No token is needed because this route is public
  const response = await api.get(API_URL);
  return response.data;
};

// Create a new event
const createEvent = async (eventData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.post(API_URL, eventData, config);
  return response.data;
};

// Update an event
const updateEvent = async (eventId, eventData, token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const response = await api.put(API_URL + eventId, eventData, config);
  return response.data;
};

// Delete an event
const deleteEvent = async (eventId, token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const response = await api.delete(API_URL + eventId, config);
  return response.data;
};

const eventService = {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
};

export default eventService;