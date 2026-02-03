import api from '../api/axiosConfig';

const API_URL = '/api/events/';

// Get all events (expanded with recurring instances for public display)
const getAllEvents = async () => {
  // No token is needed because this route is public
  const response = await api.get(API_URL);
  return response.data;
};

// Get raw events without expanding recurring instances (for admin management)
const getRawEvents = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.get(API_URL + 'raw', config);
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

// Toggle banner event status
const toggleBannerEvent = async (eventId, token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const response = await api.put(API_URL + eventId + '/banner', {}, config);
  return response.data;
};

const eventService = {
  createEvent,
  getAllEvents,
  getRawEvents,
  updateEvent,
  deleteEvent,
  toggleBannerEvent,
};

export default eventService;