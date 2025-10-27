// frontend/src/services/announcementService.js

import api from '../api/axiosConfig';

const API_URL = '/api/announcements/';

// Get all announcements
export const getAnnouncements = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

// Create a new announcement
export const createAnnouncement = async (announcementData) => {
  const response = await api.post(API_URL, announcementData);
  return response.data;
};

// Update an announcement
export const updateAnnouncement = async (id, announcementData) => {
  const response = await api.put(API_URL + id, announcementData);
  return response.data;
};

// Delete an announcement
export const deleteAnnouncement = async (id) => {
  const response = await api.delete(API_URL + id);
  return response.data;
};
