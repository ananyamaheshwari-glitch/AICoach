import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

function Login({ setUser }) {
  const location = useLocation();
  const registeredUsername = location.state?.registeredUsername || '';
  const [username, setUsername] = useState(registeredUsername);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Show success message if redirected from registration
  useEffect(() => {
    if (registeredUsername) {
      setSuccess('Account created! Please login with your credentials.');
      // Clear success message after 5 seconds
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [registeredUsername]);

  const checkPasswordStrength = (pwd) => {
    return {
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      minLength: pwd.length >= 6
    };
  };

  const isPasswordStrong = (pwd) => {
    const strength = checkPasswordStrength(pwd);
    return strength.hasUpperCase && strength.hasLowerCase && strength.hasNumber && strength.minLength;
  };

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required.');
      return false;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return false;
    }

    if (!password) {
      setError('Password is required.');
      return false;
    }

    if (!isPasswordStrong(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 6 characters long.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      console.log('Attempting login with:', { username });
      const response = await fetch('http://localhost:3007/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.message || 'Login failed. Please try again.';
      setError(errorMsg);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {success && (
            <p className="text-sm text-green-600 bg-green-50 p-3 rounded border border-green-200">
              ✓ {success}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              {error}
            </p>
          )}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
