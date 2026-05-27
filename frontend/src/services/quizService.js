import api from '../api/axiosConfig';

class QuizService {
  static async getQuestionsByTopic(topic) {
    try {
      const response = await api.get(`/quizzes/questions/${topic}`);
      return { success: true, questions: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch questions'
      };
    }
  }

  static async submitQuiz(userAnswers) {
    try {
      const response = await api.post('/quizzes/submit', { user_answers: userAnswers });
      return {
        success: true,
        resultId: response.data.resultId,
        report: response.data.report
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit quiz'
      };
    }
  }

  static async getResult(resultId) {
    try {
      const response = await api.get(`/quizzes/results/${resultId}`);
      return { success: true, report: response.data.report };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch results'
      };
    }
  }
}

export default QuizService;
