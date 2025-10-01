import axios from 'axios';

const API_URL = 'http://localhost:5000/api/newsletter/';

// Send the newsletter
const sendNewsletter = async (newsletterData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(API_URL + 'send', newsletterData, config);
  return response.data;
};

const newsletterService = {
  sendNewsletter,
};

export default newsletterService;