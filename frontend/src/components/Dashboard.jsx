import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  const quizzes = [
    {
      id: 'cloud',
      title: 'Cloud Computing',
      description: 'Test your knowledge on core cloud concepts like IaaS, PaaS, SaaS, and more.',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'google cloud platform',
      title: 'Google Cloud Platform',
      description: 'Explore Google Cloud services including Compute, Storage, Databases, and Analytics.',
      color: 'bg-red-500 hover:bg-red-600'
    }
  ];

  const startQuiz = (topic) => {
    navigate(`/quiz/${topic}`);
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Quiz Dashboard</h2>
      <div className="space-y-4">
        <p className="text-lg text-gray-600">
          Select a quiz topic to begin.
        </p>
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="p-4 border rounded-lg">
            <h3 className="text-xl font-semibold">{quiz.title}</h3>
            <p className="text-gray-500 mt-2">{quiz.description}</p>
            <button
              onClick={() => startQuiz(quiz.id)}
              className={`mt-4 px-6 py-2 font-bold text-white ${quiz.color} rounded-md`}
            >
              Start Quiz
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
