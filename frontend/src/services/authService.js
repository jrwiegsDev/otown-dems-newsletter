import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users/';

// Login user
const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData);

  // Axios puts the response data inside a 'data' property
  return response.data;
};

const authService = {
  login,
};

export default authService;