import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Scanner services
export const scannerAPI = {
  scanVulnerabilities: (input) => api.post('/scanner/vulnerabilities', { input }),
  scanVirus: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/scanner/virus', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getHistory: () => api.get('/scanner/history'),
  getScan: (id) => api.get(`/scanner/scan/${id}`)
};

// Password services
export const passwordAPI = {
  analyzePassword: (password) => api.post('/password/analyze', { password }),
  storePassword: (password, userId) => api.post('/password/store', { password, userId }),
  getStoredPasswords: (userId) => api.get(`/password/stored/${userId}`),
  generatePassword: (length = 16, special = true) =>
    api.get('/password/generate', { params: { length, special } })
};

// Password Manager services
export const passwordManagerAPI = {
  addEntry: (userId, site, username, password, notes = '') =>
    api.post('/password-manager/add', { userId, site, username, password, notes }),
  getEntries: (userId) => api.get(`/password-manager/entries/${userId}`),
  getEntry: (userId, entryId) => api.get(`/password-manager/entry/${userId}/${entryId}`),
  updateEntry: (entryId, userId, site, username, password, notes) =>
    api.put(`/password-manager/update/${entryId}`, { userId, site, username, password, notes }),
  deleteEntry: (userId, entryId) => api.delete(`/password-manager/delete/${userId}/${entryId}`),
  searchEntries: (userId, query) => api.get(`/password-manager/search/${userId}`, { params: { q: query } })
};

// Chatbot services
export const chatAPI = {
  sendMessage: (message, scanResult = null) =>
    api.post('/chat/message', { message, scanResult }),
  remediate: (scanResult) => api.post('/chat/remediate', { scanResult }),
  getTopics: () => api.get('/chat/topics'),
  getTopic: (name) => api.get(`/chat/topic/${name}`)
};

export default api;
