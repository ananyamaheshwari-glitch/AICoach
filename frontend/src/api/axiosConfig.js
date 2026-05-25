import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3007/api', // Your backend URL
  withCredentials: true, // This is crucial for sending cookies
});

export default api;
