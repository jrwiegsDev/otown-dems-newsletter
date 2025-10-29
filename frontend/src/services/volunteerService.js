import api from '../api/axiosConfig';

const API_URL = '/api/volunteers/';

// Get all volunteers
const getVolunteers = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.get(API_URL, config);
  return response.data;
};

// Add a new volunteer
const addVolunteer = async (volunteerData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.post(API_URL, volunteerData, config);
  return response.data;
};

// Update a volunteer
const updateVolunteer = async (volunteerId, volunteerData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.put(API_URL + volunteerId, volunteerData, config);
  return response.data;
};

// Delete a volunteer
const deleteVolunteer = async (volunteerId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.delete(API_URL + volunteerId, config);
  return response.data;
};

const volunteerService = {
  getVolunteers,
  addVolunteer,
  updateVolunteer,
  deleteVolunteer,
};

export default volunteerService;
