// frontend/src/services/announcementService.js

import api from '../api/axiosConfig';

const API_URL = '/api/announcements/';

// Get all announcements (includeExpired=true for admin view)
export const getAnnouncements = async ({ includeExpired = false } = {}) => {
  const params = includeExpired ? '?includeExpired=true' : '';
  const response = await api.get(API_URL + params);
  return response.data;
};

const authConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Create a new announcement
export const createAnnouncement = async (announcementData, token) => {
  const response = await api.post(API_URL, announcementData, authConfig(token));
  return response.data;
};

// Update an announcement
export const updateAnnouncement = async (id, announcementData, token) => {
  const response = await api.put(API_URL + id, announcementData, authConfig(token));
  return response.data;
};

// Delete an announcement
export const deleteAnnouncement = async (id, token) => {
  const response = await api.delete(API_URL + id, authConfig(token));
  return response.data;
};
