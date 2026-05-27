const { db, dbAll, dbRun } = require('../db/database');
const llmJudge = require('./llmJudge');

class QuizService {
  static async getQuestionsByTopic(topic) {
    try {
      const questions = await dbAll(
        db,
        "SELECT id, question_text, option_a, option_b, option_c, option_d, topic FROM questions WHERE UPPER(topic) = UPPER(?)",
        [topic]
      );

      if (questions.length === 0) {
        return { success: false, message: 'No questions found for this topic.' };
      }

      return { success: true, questions };
    } catch (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }
  }

  static async evaluateQuiz(allQuestions, userAnswers) {
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const questionDetails = allQuestions.map((question) => {
      const userAnswer = userAnswers[question.id] || null;
      const isCorrect = userAnswer === question.correct_option;
      const isUnanswered = userAnswer === null || userAnswer === undefined;

      if (isUnanswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      return {
        id: question.id,
        question_text: question.question_text,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        user_answer: userAnswer,
        correct_answer: question.correct_option,
        is_correct: isCorrect,
        is_unanswered: isUnanswered,
      };
    });

    const totalQuestions = allQuestions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    return {
      correctCount,
      wrongCount,
      unansweredCount,
      totalQuestions,
      score,
      questionDetails
    };
  }

  static async generateReport(allQuestions, userAnswers, evaluation, topic) {
    try {
      const llmReport = await llmJudge.generateReport({
        questions: allQuestions,
        user_answers: userAnswers,
        score: evaluation.score,
        topic: topic,
      });

      return {
        ...llmReport,
        topic: topic,
        score: evaluation.score,
        scoreDisplay: `${evaluation.correctCount} out of ${evaluation.totalQuestions}`,
        correctAnswers: evaluation.correctCount,
        answeredWrong: evaluation.wrongCount,
        unanswered: evaluation.unansweredCount,
        totalQuestions: evaluation.totalQuestions,
        questionDetails: evaluation.questionDetails,
      };
    } catch (error) {
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  static async saveResult(userId, userAnswers, report) {
    try {
      const fullReportString = JSON.stringify(report);
      const result = await dbRun(
        db,
        "INSERT INTO quiz_results (user_id, score, raw_answers, final_report) VALUES (?, ?, ?, ?)",
        [userId, report.score, JSON.stringify(userAnswers), fullReportString]
      );

      return { success: true, resultId: result.id };
    } catch (error) {
      throw new Error(`Failed to save result: ${error.message}`);
    }
  }

  static async getResultById(resultId, userId) {
    try {
      const results = await dbAll(
        db,
        "SELECT * FROM quiz_results WHERE id = ? AND user_id = ?",
        [resultId, userId]
      );

      if (results.length === 0) {
        return {
          success: false,
          message: 'Result not found or you do not have permission to view it.'
        };
      }

      const result = results[0];
      let report;

      try {
        report = JSON.parse(result.final_report);
      } catch (parseError) {
        return { success: false, message: 'Failed to parse quiz report.' };
      }

      if (!report.overall_summary || report.score === undefined) {
        return { success: false, message: 'Incomplete quiz report data.' };
      }

      return { success: true, report };
    } catch (error) {
      throw new Error(`Failed to fetch result: ${error.message}`);
    }
  }
}

module.exports = QuizService;
