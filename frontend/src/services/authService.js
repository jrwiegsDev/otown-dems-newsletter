import api from '../api/axiosConfig'; // Use our custom api instance

const API_URL = '/api/users/'; // The path is now relative

// Login user
const login = async (userData) => {
  const response = await api.post(API_URL + 'login', userData);
  return response.data;
};

const authService = {
  login,
};

export default authService;