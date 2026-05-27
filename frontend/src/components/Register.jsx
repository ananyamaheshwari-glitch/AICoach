import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

function Register({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const passwordStrength = checkPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        username,
        password
      });

      // Auto-login after successful registration
      const loginResponse = await api.post('/auth/login', {
        username,
        password
      });

      setUser(loginResponse.data.user);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">At least 3 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                password && isPasswordStrong(password)
                  ? 'border-green-400'
                  : password
                  ? 'border-red-400'
                  : 'border-gray-300'
              }`}
            />

            {/* Password Requirements Checklist */}
            {password && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Password must contain:</p>
                <div className="space-y-1">
                  <div className="flex items-center text-xs">
                    <span className={`mr-2 ${passwordStrength.hasUpperCase ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      {passwordStrength.hasUpperCase ? '✓' : '○'}
                    </span>
                    <span className={passwordStrength.hasUpperCase ? 'text-green-700 font-medium' : 'text-gray-600'}>
                      At least one uppercase letter (A-Z)
                    </span>
                  </div>

                  <div className="flex items-center text-xs">
                    <span className={`mr-2 ${passwordStrength.hasLowerCase ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      {passwordStrength.hasLowerCase ? '✓' : '○'}
                    </span>
                    <span className={passwordStrength.hasLowerCase ? 'text-green-700 font-medium' : 'text-gray-600'}>
                      At least one lowercase letter (a-z)
                    </span>
                  </div>

                  <div className="flex items-center text-xs">
                    <span className={`mr-2 ${passwordStrength.hasNumber ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      {passwordStrength.hasNumber ? '✓' : '○'}
                    </span>
                    <span className={passwordStrength.hasNumber ? 'text-green-700 font-medium' : 'text-gray-600'}>
                      At least one number (0-9)
                    </span>
                  </div>

                  <div className="flex items-center text-xs">
                    <span className={`mr-2 ${passwordStrength.minLength ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      {passwordStrength.minLength ? '✓' : '○'}
                    </span>
                    <span className={passwordStrength.minLength ? 'text-green-700 font-medium' : 'text-gray-600'}>
                      At least 6 characters
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
