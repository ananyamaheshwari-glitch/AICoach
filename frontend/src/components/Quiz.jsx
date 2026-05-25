import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

function Quiz() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get(`/quizzes/questions/${topic}`);
        setQuestions(response.data);
      } catch (err) {
        setError('Failed to fetch questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [topic]);

  const handleAnswerChange = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answers).length !== questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const response = await api.post('/quizzes/submit', { user_answers: answers });
      navigate(`/results/${response.data.resultId}`, { state: { report: response.data.report } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center">Loading questions...</div>;
  if (error && !questions.length) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 capitalize">{topic} Quiz</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((q, index) => (
          <div key={q.id} className="mb-8 p-4 border-b">
            <p className="text-lg font-semibold mb-4">{index + 1}. {q.question_text}</p>
            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map(option => (
                <label key={option} className="flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={option}
                    onChange={() => handleAnswerChange(q.id, option)}
                    className="form-radio h-5 w-5 text-indigo-600"
                    required
                  />
                  <span className="ml-3 text-gray-700">{q[`option_${option.toLowerCase()}`]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {error && <p className="text-center text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </form>
    </div>
  );
}

export default Quiz;
