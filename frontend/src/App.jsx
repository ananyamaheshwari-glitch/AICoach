import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Quiz from './components/Quiz';
import Results from './components/Results';
import SessionWarning from './components/SessionWarning';
import useAuth from './hooks/useAuth';
import useSessionTimeout from './hooks/useSessionTimeout';
import api from './api/axiosConfig';

function App() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [warningRemainingTime, setWarningRemainingTime] = useState(null);

  const handleSessionWarning = (remainingTime) => {
    setWarningRemainingTime(remainingTime);
    setShowSessionWarning(true);
  };

  const handleSessionExpired = () => {
    setShowSessionWarning(false);
    setUser(null);
    navigate('/login', { state: { message: 'Your session has expired. Please login again.' } });
  };

  const handleExtendSession = () => {
    setShowSessionWarning(false);
  };

  const { formatRemainingTime } = useSessionTimeout(
    user ? handleSessionWarning : null,
    user ? handleSessionExpired : null
  );

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {user && (
        <header className="bg-white shadow">
          <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">AI Quiz</h1>
            <div>
              <span className="text-gray-800 mr-4">Welcome, {user.username}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </nav>
        </header>
      )}
      <main className="container mx-auto px-6 py-8">
        <Routes>
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/quiz/:topic" element={user ? <Quiz /> : <Navigate to="/login" />} />
          <Route path="/results/:resultId" element={user ? <Results /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </main>
      <SessionWarning
        isVisible={showSessionWarning}
        remainingTime={warningRemainingTime}
        formatTime={formatRemainingTime}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
