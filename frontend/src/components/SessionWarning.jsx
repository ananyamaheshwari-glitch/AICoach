import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

function SessionWarning({ isVisible, remainingTime, formatTime, onExtend, onLogout }) {
  const [timeLeft, setTimeLeft] = useState(remainingTime);

  // Update countdown timer
  useEffect(() => {
    if (!isVisible) return;

    setTimeLeft(remainingTime);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) return 0;
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, remainingTime]);

  const handleExtendSession = async () => {
    try {
      // Simple way to extend session: make a request to trigger session refresh
      await api.get('/auth/status');
      onExtend();
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-orange-500 text-white p-4 rounded-t-lg">
          <h3 className="text-xl font-bold">⏰ Session Expiring Soon</h3>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Your session will expire in:
          </p>

          {/* Countdown Timer */}
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">
              {formatTime(timeLeft)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              remaining to save your work
            </p>
          </div>

          <p className="text-sm text-gray-600">
            For security purposes, your session will automatically expire if you remain inactive.
            Click "Continue" to extend your session.
          </p>

          {/* Warning message */}
          <div className="bg-red-50 border-l-4 border-red-500 p-3">
            <p className="text-sm text-red-700">
              💡 Make sure to save any work before your session expires!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 p-4 rounded-b-lg flex gap-3 border-t">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2 bg-red-500 text-white font-bold rounded-md hover:bg-red-600 transition"
          >
            Logout Now
          </button>

          <button
            onClick={handleExtendSession}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-md hover:bg-indigo-700 transition"
          >
            Continue Working
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionWarning;
