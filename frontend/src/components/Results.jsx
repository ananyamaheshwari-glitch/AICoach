import React, { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';

function Results() {
  const location = useLocation();
  const { resultId } = useParams();
  const [report, setReport] = useState(location.state?.report || null);
  const [loading, setLoading] = useState(!report);
  const [error, setError] = useState('');

  useEffect(() => {
    // If the report wasn't passed via navigation state, fetch it.
    if (!report && resultId) {
      const fetchResult = async () => {
        try {
          const response = await api.get(`/quizzes/results/${resultId}`);
          setReport(response.data.report);
        } catch (err) {
          setError('Failed to fetch quiz results. They may not exist or you may not have permission to view them.');
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
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

  return (
    <div className="p-8 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Results</h2>
      
      <div className="mb-6 p-6 rounded-lg bg-indigo-50 border border-indigo-200">
        <h3 className="text-xl font-semibold text-indigo-800">Your Score</h3>
        <p className="text-5xl font-bold text-indigo-600 mt-2">{report.score}%</p>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Key Insight</h3>
        <p className="text-gray-600 italic">"{report.key_insight}"</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-bold text-green-800">Strengths</h4>
          {report.strengths.length > 0 ? (
            <ul className="list-disc list-inside mt-2 text-green-700">
              {report.strengths.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : <p className="text-gray-500 mt-2">None identified.</p>}
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-bold text-red-800">Weak Areas</h4>
          {report.weak_areas.length > 0 ? (
            <ul className="list-disc list-inside mt-2 text-red-700">
              {report.weak_areas.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : <p className="text-gray-500 mt-2">None identified. Great job!</p>}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-3">AI Evaluation Report</h3>
        <div className="p-6 bg-gray-50 rounded-lg border">
            <h4 className="text-xl font-bold mb-2">Overall Summary</h4>
            <p className="text-gray-700 mb-4">{report.overall_summary}</p>

            <h4 className="text-xl font-bold mb-2">Detailed Breakdown</h4>
            <div className="prose max-w-none text-gray-700 mb-4" dangerouslySetInnerHTML={{ __html: report.detailed_breakdown.replace(/\n/g, '<br />') }} />
            
            <h4 className="text-xl font-bold mb-2">Personalized Roadmap</h4>
            <ul className="list-disc list-inside text-gray-700">
                {report.personalized_roadmap.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link to="/dashboard" className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Results;
