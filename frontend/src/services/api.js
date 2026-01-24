import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

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

// Chatbot services
export const chatAPI = {
  sendMessage: (message, scanResult = null) =>
    api.post('/chat/message', { message, scanResult }),
  remediate: (scanResult) => api.post('/chat/remediate', { scanResult }),
  getTopics: () => api.get('/chat/topics'),
  getTopic: (name) => api.get(`/chat/topic/${name}`)
};

export default api;
