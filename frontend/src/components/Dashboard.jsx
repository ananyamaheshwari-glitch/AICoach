import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const quizTopic = 'cloud'; // Only "Cloud Computing" is available

  const startQuiz = () => {
    navigate(`/quiz/${quizTopic}`);
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Quiz Dashboard</h2>
      <div className="space-y-4">
        <p className="text-lg text-gray-600">
          Select a quiz topic to begin.
        </p>
        <div className="p-4 border rounded-lg">
          <h3 className="text-xl font-semibold">Cloud Computing</h3>
          <p className="text-gray-500 mt-2">Test your knowledge on core cloud concepts like IaaS, PaaS, SaaS, and more.</p>
          <button
            onClick={startQuiz}
            className="mt-4 px-6 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600"
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
