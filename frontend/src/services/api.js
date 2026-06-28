const API_BASE = 'http://localhost:5000';

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

export const api = {
  // Dashboard
  fetchAlerts: () => apiCall('/api/alerts/history'),

  // Criminal Registration
  registerCriminal: async (formData) => {
    const url = `${API_BASE}/api/register/criminal`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Register Criminal Error:', error);
      throw error;
    }
  },

  // Surveillance
  analyzeImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const url = `${API_BASE}/api/surveillance/image`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Image Analysis Error:', error);
      throw error;
    }
  },

  analyzeVideo: async (file) => {
    const formData = new FormData();
    formData.append('video', file);
    const url = `${API_BASE}/api/surveillance/video`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Video Analysis Error:', error);
      throw error;
    }
  },

  detectFromCamera: async (frame) => {
    const formData = new FormData();
    formData.append('frame', frame);
    const url = `${API_BASE}/api/camera/detect`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Camera Detection Error:', error);
      throw error;
    }
  },

  // Criminals List
  fetchCriminals: () => apiCall('/criminals'),

  // Health Check
  healthCheck: () => apiCall('/health'),
};
