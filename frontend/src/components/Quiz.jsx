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
  const [showReview, setShowReview] = useState(false);

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

  const validateAnswers = () => {
    const answeredCount = Object.keys(answers).length;

    if (answeredCount === 0) {
      setError('Please answer at least one question before submitting.');
      return false;
    }

    if (answeredCount < questions.length) {
      setError(`You have answered ${answeredCount} out of ${questions.length} questions. Some questions are unanswered.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateAnswers()) {
      return;
    }

    setShowReview(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await api.post('/quizzes/submit', { user_answers: answers });
      navigate(`/results/${response.data.resultId}`, { state: { report: response.data.report } });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit quiz.';
      setError(errorMessage);
      if (errorMessage.includes('Invalid question')) {
        setError('Invalid questions detected. Please refresh the page and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center">Loading questions...</div>;
  if (error && !questions.length) return <div className="text-center text-red-500">{error}</div>;

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  if (showReview) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Review Your Answers</h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-blue-600 text-sm font-semibold">ANSWERED</p>
            <p className="text-4xl font-bold text-blue-700 mt-2">{answeredCount}</p>
            <p className="text-blue-600 text-sm mt-1">out of {questions.length}</p>
          </div>

          <div className="p-6 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-yellow-600 text-sm font-semibold">UNANSWERED</p>
            <p className="text-4xl font-bold text-yellow-700 mt-2">{unansweredCount}</p>
            <p className="text-yellow-600 text-sm mt-1">out of {questions.length}</p>
          </div>
        </div>

        <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-semibold text-gray-800 mb-3">Answered Questions</h3>
          <div className="space-y-2">
            {questions.map((q, index) => (
              answers[q.id] && (
                <div key={q.id} className="text-sm text-gray-700 p-2 bg-white rounded border-l-4 border-blue-400">
                  <span className="font-semibold">Q{index + 1}:</span> {q.question_text.substring(0, 60)}...
                  <span className="ml-2 font-bold text-blue-600">{answers[q.id]}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-3">Unanswered Questions</h3>
            <div className="space-y-2">
              {questions.map((q, index) => (
                !answers[q.id] && (
                  <div key={q.id} className="text-sm text-yellow-700 p-2 bg-white rounded border-l-4 border-yellow-400">
                    <span className="font-semibold">Q{index + 1}:</span> {q.question_text.substring(0, 60)}...
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-center text-red-500 mb-4">{error}</p>}

        <div className="flex gap-4">
          <button
            onClick={() => setShowReview(false)}
            className="flex-1 px-6 py-3 font-bold text-indigo-600 bg-white border-2 border-indigo-600 rounded-md hover:bg-indigo-50"
          >
            Back to Edit
          </button>
          <button
            onClick={handleConfirmSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {submitting ? 'Submitting...' : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    );
  }

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
