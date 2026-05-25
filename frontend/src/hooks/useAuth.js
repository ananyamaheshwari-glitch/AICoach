import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get('/auth/status');
        if (response.data && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        // Not logged in, or server is down. No need to show an error to the user,
        // but logging it can be helpful for development.
        console.error("Auth status check failed:", error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { user, loading, setUser };
};

export default useAuth;
