import React, { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

function Results() {
  const location = useLocation();
  const { resultId } = useParams();
  const [report, setReport] = useState(location.state?.report || null);
  const [loading, setLoading] = useState(!report);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState('questions');

  useEffect(() => {
    // If the report wasn't passed via navigation state, fetch it.
    if (!report && resultId) {
      const fetchResult = async () => {
        try {
          const response = await api.get(`/quizzes/results/${resultId}`);
          console.log('Fetched report:', response.data.report);
          setReport(response.data.report);
        } catch (err) {
          console.error('Error fetching report:', err);
          setError('Failed to fetch quiz results. They may not exist or you may not have permission to view them.');
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    } else if (report) {
      console.log('Report from navigation state:', report);
    }
  }, [report, resultId]);

  if (loading) return <div className="text-center">Loading results...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  if (!report) {
    return (
      <div className="text-center">
        <p>No results to display. Please complete a quiz first.</p>
        <Link to="/dashboard" className="text-indigo-600 hover:underline">Go to Dashboard</Link>
      </div>
    );
  }

  // Page 1: Questions and Answers
  if (currentPage === 'questions') {
    return (
      <div className="p-8 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Quiz Results - Questions Review</h2>

        <div className="mb-6 p-6 rounded-lg bg-indigo-50 border border-indigo-200">
          <h3 className="text-xl font-semibold text-indigo-800">Your Score</h3>
          <p className="text-5xl font-bold text-indigo-600 mt-2">{report.score}%</p>
        </div>

        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-gray-700"><strong>Correct Answers:</strong> {report.correctAnswers} out of {report.totalQuestions}</p>
          {report.answeredWrong !== undefined && <p className="text-gray-700"><strong>Answered Wrong:</strong> {report.answeredWrong}</p>}
          {report.unanswered !== undefined && <p className="text-gray-700"><strong>Unanswered:</strong> {report.unanswered}</p>}
        </div>

        {report.questionDetails && report.questionDetails.length > 0 && (
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Question Details</h3>
            <div className="space-y-4">
              {report.questionDetails.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border-2 ${
                    question.is_unanswered
                      ? 'bg-gray-50 border-gray-300'
                      : question.is_correct
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  <h4 className="font-bold text-gray-800 mb-2">
                    Question {index + 1}
                    <span className={`ml-2 text-sm font-semibold ${
                      question.is_unanswered
                        ? 'text-gray-600'
                        : question.is_correct
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {question.is_unanswered ? '(Unanswered)' : question.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </h4>
                  <p className="text-gray-700 mb-3">{question.question_text}</p>

                  <div className="space-y-2 mb-3">
                    {['A', 'B', 'C', 'D'].map((option) => {
                      const optionKey = `option_${option.toLowerCase()}`;
                      const isCorrectAnswer = option === question.correct_answer;
                      const isUserAnswer = option === question.user_answer;
                      const isWrongAnswer = isUserAnswer && !isCorrectAnswer;

                      return (
                        <div
                          key={option}
                          className={`p-3 rounded flex items-start justify-between ${
                            isCorrectAnswer ? 'bg-green-100 border-l-4 border-green-500' : ''
                          } ${
                            isWrongAnswer ? 'bg-red-100 border-l-4 border-red-500' : ''
                          } ${
                            !isCorrectAnswer && !isUserAnswer ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <span className="font-semibold">{option}.</span> {question[optionKey]}
                          </div>
                          <div className="ml-2 flex-shrink-0">
                            {isCorrectAnswer && (
                              <span className="text-green-600 text-xl font-bold">✓</span>
                            )}
                            {isWrongAnswer && (
                              <span className="text-red-600 text-xl font-bold">✗</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!question.is_unanswered && (
                    <div className="text-sm text-gray-600">
                      <strong>Your Answer:</strong> {question.user_answer || 'Not answered'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <Link to="/dashboard" className="flex-1 px-6 py-3 text-center font-bold text-indigo-600 bg-white border-2 border-indigo-600 rounded-md hover:bg-indigo-50">
            Back to Dashboard
          </Link>
          <button
            onClick={() => setCurrentPage('feedback')}
            className="flex-1 px-6 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            View Feedback →
          </button>
        </div>
      </div>
    );
  }

  // Helper function to get related quiz topics
  const getRelatedQuizzes = (topic) => {
    const quizzes = {
      'Cloud': ['Google Cloud Platform', 'Microservices', 'Containerization', 'Security'],
      'Google Cloud Platform': ['Cloud', 'Microservices', 'Big Data', 'API Design'],
      'DevOps': ['Cloud', 'CI/CD', 'Infrastructure as Code', 'Monitoring'],
      'Microservices': ['Cloud', 'API Design', 'Distributed Systems', 'Google Cloud Platform'],
      'Containerization': ['Cloud', 'Orchestration', 'Docker', 'Microservices'],
      'CI/CD': ['DevOps', 'Git', 'Automation', 'Testing'],
      'API Design': ['Microservices', 'REST', 'GraphQL', 'Web Services'],
      'Default': ['Cloud', 'Google Cloud Platform', 'Microservices', 'Containerization']
    };
    return quizzes[topic] || quizzes['Default'];
  };

  // Page 2: Feedback
  if (currentPage === 'feedback') {
    console.log('Feedback Report:', report);
    console.log('Report type:', typeof report);
    console.log('Report keys:', report ? Object.keys(report) : 'null');

    const quizTopic = report?.topic || report?.report?.topic || 'Cloud';
    const relatedTopics = getRelatedQuizzes(quizTopic);

    // Handle nested report structure if it exists
    const reportData = report?.report || report;
    const overallSummary = reportData?.overall_summary;

    if (!reportData || !overallSummary) {
      return (
        <div className="p-8 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Quiz Results - Feedback & Insights</h2>
          <div className="text-yellow-600 p-4 bg-yellow-50 rounded-lg mb-4">
            <p>⚠️ Feedback is loading...</p>
            <p className="text-sm mt-2">If this persists, try refreshing the page.</p>
          </div>
          <div className="text-gray-600 p-4 bg-gray-50 rounded-lg mb-4">
            <p className="text-xs font-mono break-all">{JSON.stringify(reportData).substring(0, 300)}...</p>
          </div>
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setCurrentPage('questions')}
              className="flex-1 px-6 py-3 font-bold text-indigo-600 bg-white border-2 border-indigo-600 rounded-md hover:bg-indigo-50"
            >
              ← Back to Questions
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 font-bold text-white bg-orange-600 rounded-md hover:bg-orange-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Quiz Results - Feedback & Insights</h2>

        <div className="mb-6 p-6 rounded-lg bg-indigo-50 border border-indigo-200">
          <h3 className="text-xl font-semibold text-indigo-800">Your Score</h3>
          <p className="text-5xl font-bold text-indigo-600 mt-2">{reportData.score}%</p>
        </div>

        {reportData.key_insight && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Key Insight</h3>
            <p className="text-gray-600 italic">"{reportData.key_insight}"</p>
          </div>
        )}

        <div className="mb-6 p-6 rounded-lg bg-purple-50 border border-purple-200">
          <h3 className="text-xl font-semibold text-purple-800 mb-4">Suggested Quizzes</h3>
          <p className="text-gray-700 mb-4">Based on your performance, we recommend exploring these related topics:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {relatedTopics.map((topic) => (
              <Link
                key={topic}
                to={`/quiz/${topic.toLowerCase()}`}
                className="p-3 text-center font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {topic}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-bold text-green-800">Strengths</h4>
            {(() => {
              let strengthsList = [];
              if (Array.isArray(reportData.strengths)) {
                strengthsList = reportData.strengths.filter(item => {
                  const str = String(item).trim();
                  return str && str !== '[object Object]';
                });
              } else if (typeof reportData.strengths === 'object' && reportData.strengths !== null) {
                strengthsList = Object.entries(reportData.strengths)
                  .map(([k, v]) => String(k || v).trim())
                  .filter(s => s && s !== '[object Object]');
              }
              return strengthsList.length > 0 ? (
                <ul className="list-disc list-inside mt-2 text-green-700">
                  {strengthsList.map((item, i) => (
                    <li key={i}>{String(item)}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mt-2">None identified.</p>
              );
            })()}
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-bold text-red-800">Weak Areas</h4>
            {(() => {
              let weakList = [];
              if (Array.isArray(reportData.weak_areas)) {
                weakList = reportData.weak_areas.filter(item => {
                  const str = String(item).trim();
                  return str && str !== '[object Object]';
                });
              } else if (typeof reportData.weak_areas === 'object' && reportData.weak_areas !== null) {
                weakList = Object.entries(reportData.weak_areas)
                  .map(([k, v]) => String(k || v).trim())
                  .filter(s => s && s !== '[object Object]');
              }
              return weakList.length > 0 ? (
                <ul className="list-disc list-inside mt-2 text-red-700">
                  {weakList.map((item, i) => (
                    <li key={i}>{String(item)}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mt-2">None identified. Great job!</p>
              );
            })()}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">AI Evaluation Report</h3>
          <div className="p-6 bg-gray-50 rounded-lg border">
            <h4 className="text-xl font-bold mb-2">Overall Summary</h4>
            <p className="text-gray-700 mb-4">{reportData.overall_summary}</p>

            <h4 className="text-xl font-bold mb-2">Detailed Breakdown</h4>
            <div className="text-gray-700 mb-4 leading-relaxed whitespace-pre-wrap">
              {reportData.detailed_breakdown ? (
                reportData.detailed_breakdown
                  .replace(/\*\*/g, '')
                  .replace(/#+\s+/g, '')
                  .replace(/^[\s]*[*+-]\s+/gm, '')
                  .replace(/^\s+[+]\s+/gm, '')
              ) : (
                <p className="text-gray-500">No detailed feedback available.</p>
              )}
            </div>

            <h4 className="text-xl font-bold mb-2">Personalized Roadmap</h4>
            <ul className="list-disc list-inside text-gray-700">
              {(() => {
                let roadmapItems = [];
                if (Array.isArray(reportData.personalized_roadmap)) {
                  roadmapItems = reportData.personalized_roadmap
                    .map(item => {
                      if (typeof item === 'string') return item;
                      if (typeof item === 'object' && item !== null) {
                        return Object.values(item).join(' - ');
                      }
                      return String(item);
                    })
                    .filter(s => s && s.trim());
                }
                return roadmapItems.map((item, i) => (
                  <li key={i}>{String(item)}</li>
                ));
              })()}
            </ul>
          </div>
        </div>

        <div className="mb-6 p-6 rounded-lg bg-orange-50 border border-orange-200">
          <h3 className="text-xl font-semibold text-orange-800 mb-3">Next Challenge: Google Cloud Platform Quiz</h3>
          <p className="text-gray-700 mb-4">Now that you've completed the Cloud Computing fundamentals, take the next step with our Google Cloud Platform quiz. This quiz covers GCP-specific services and features to deepen your cloud expertise.</p>
          <Link
            to="/quiz/google cloud platform"
            className="inline-block px-6 py-2 font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            Start GCP Quiz →
          </Link>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setCurrentPage('questions')}
            className="flex-1 px-6 py-3 font-bold text-indigo-600 bg-white border-2 border-indigo-600 rounded-md hover:bg-indigo-50"
          >
            ← Back to Questions
          </button>
          <Link to="/dashboard" className="flex-1 px-6 py-3 text-center font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
}

export default Results;
