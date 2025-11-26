import api from '../api/axiosConfig'; // Use our custom api instance

const API_URL = '/api/newsletter/'; // The path is now relative

// Send the newsletter
// If selectedEmails is provided and not empty, sends only to those emails
// Otherwise sends to all subscribers
const sendNewsletter = async (newsletterData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.post(API_URL + 'send', newsletterData, config);
  return response.data;
};

// ============================================
// DRAFT OPERATIONS
// ============================================

// Get all drafts
const getDrafts = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.get(API_URL + 'drafts', config);
  return response.data;
};

// Get a single draft by ID
const getDraft = async (draftId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.get(API_URL + 'drafts/' + draftId, config);
  return response.data;
};

// Create a new draft
const createDraft = async (draftData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.post(API_URL + 'drafts', draftData, config);
  return response.data;
};

// Update an existing draft
const updateDraft = async (draftId, draftData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.put(API_URL + 'drafts/' + draftId, draftData, config);
  return response.data;
};

// Delete a draft
const deleteDraft = async (draftId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await api.delete(API_URL + 'drafts/' + draftId, config);
  return response.data;
};

const newsletterService = {
  sendNewsletter,
  getDrafts,
  getDraft,
  createDraft,
  updateDraft,
  deleteDraft,
};

export default newsletterService;