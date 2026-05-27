import { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';

const useSessionTimeout = (onWarning, onExpired) => {
  const [sessionInfo, setSessionInfo] = useState({
    remainingTime: null,
    isExpiringSoon: false,
    expiresAt: null,
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkSessionStatus = useCallback(async () => {
    try {
      setIsChecking(true);
      const response = await api.get('/auth/status');

      if (response.data && response.data.session) {
        const { remainingTimeMs, isExpiringSoon, expiresAt } = response.data.session;

        setSessionInfo({
          remainingTime: remainingTimeMs,
          isExpiringSoon,
          expiresAt: new Date(expiresAt),
        });

        // Trigger warning callback if session is expiring soon
        if (isExpiringSoon && onWarning) {
          onWarning(remainingTimeMs);
        }
      } else {
        // Session expired
        if (onExpired) {
          onExpired();
        }
      }
    } catch (error) {
      console.error('Session check failed:', error.message);
      // If we can't check session, assume it might be expired
      if (error.response?.status === 401 && onExpired) {
        onExpired();
      }
    } finally {
      setIsChecking(false);
    }
  }, [onWarning, onExpired]);

  // Check session status every minute
  useEffect(() => {
    // Check immediately on mount
    checkSessionStatus();

    // Set up interval to check every 60 seconds
    const interval = setInterval(checkSessionStatus, 60000);

    return () => clearInterval(interval);
  }, [checkSessionStatus]);

  // Format remaining time as readable string
  const formatRemainingTime = (ms) => {
    if (!ms || ms < 0) return '0 minutes';

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return {
    sessionInfo,
    checkSessionStatus,
    formatRemainingTime,
    isChecking,
  };
};

export default useSessionTimeout;
