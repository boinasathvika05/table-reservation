import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Crucial for sharing HTTP-only cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor to format errors into digestible Javascript Errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let formattedError = {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the server. Please check your connection.'
    };

    if (error.response && error.response.data) {
      if (error.response.data.error) {
        formattedError = error.response.data.error;
      } else {
        formattedError.message = error.response.data.message || formattedError.message;
      }
    }

    return Promise.reject(formattedError);
  }
);

export default api;
