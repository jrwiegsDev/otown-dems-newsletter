import api from '../api/axiosConfig'; // Use our custom api instance

const API_URL = '/api/newsletter/'; // The path is now relative

// Send the newsletter
const sendNewsletter = async (newsletterData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.post(API_URL + 'send', newsletterData, config);
  return response.data;
};

const newsletterService = {
  sendNewsletter,
};

export default newsletterService;