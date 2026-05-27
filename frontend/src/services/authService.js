import api from '../api/axiosConfig';

class AuthService {
  static async register(username, password) {
    try {
      const response = await api.post('/auth/register', { username, password });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        errors: error.response?.data?.errors
      };
    }
  }

  static async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  }

  static async logout() {
    try {
      const response = await api.post('/auth/logout');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed'
      };
    }
  }

  static async checkStatus() {
    try {
      const response = await api.get('/auth/status');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Session check failed'
      };
    }
  }
}

export default AuthService;
