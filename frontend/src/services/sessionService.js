import api from '../api/axiosConfig';

class SessionService {
  static formatRemainingTime(ms) {
    if (!ms || ms < 0) return '0 minutes';

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  static async checkSession() {
    try {
      const response = await api.get('/auth/status');

      if (!response.data.session) {
        return { isActive: false };
      }

      const { session } = response.data;
      return {
        isActive: true,
        remaining: session.remainingTimeMs,
        formattedTime: this.formatRemainingTime(session.remainingTimeMs),
        expiresAt: new Date(session.expiresAt),
        isExpiringSoon: session.isExpiringSoon,
        warningThreshold: session.warningTimeMs
      };
    } catch (error) {
      console.error('Session check failed:', error);
      return { isActive: false, error: error.message };
    }
  }

  static async extendSession() {
    try {
      const response = await api.get('/auth/status');
      return { success: true };
    } catch (error) {
      console.error('Failed to extend session:', error);
      return { success: false, error: error.message };
    }
  }
}

export default SessionService;
