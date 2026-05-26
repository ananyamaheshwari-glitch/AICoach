// controllers/quizController.js
const { db, dbAll, dbRun } = require('../db/database');
const llmJudge = require('../services/llmJudge');

// Helper function for consistent error responses
const handleServerError = (res, error, customMessage) => {
  console.error(`${customMessage}:`, error);
  const responseError = { message: customMessage };
  if (process.env.NODE_ENV !== 'production') {
    responseError.error = error.message;
  }
  res.status(500).json(responseError);
};

exports.getQuestionsByTopic = async (req, res) => {
  const { topic } = req.params;
  try {
    const questions = await dbAll(db, 'SELECT id, question_text, option_a, option_b, option_c, option_d, topic FROM questions WHERE UPPER(topic) = UPPER(?)', [topic]);
    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this topic.' });
    }
    res.json(questions);
  } catch (error) {
    handleServerError(res, error, 'Server error fetching questions.');
  }
};


exports.submitQuiz = async (req, res) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { user_answers } = req.body; // e.g., {"1": "A", "2": "C"}
  const userId = req.user.id; // Get user ID securely from the session via authMiddleware

  if (!user_answers || Object.keys(user_answers).length === 0) {
    return res.status(400).json({ message: 'No answers provided.' });
  }

  try {
    // 1. Fetch all questions related to the submission to get correct answers
    const questionIds = Object.keys(user_answers);
    const placeholders = questionIds.map(() => '?').join(',');
    const allQuestions = await dbAll(db, `SELECT * FROM questions WHERE id IN (${placeholders})`, questionIds);

    if (allQuestions.length !== questionIds.length) {
        return res.status(404).json({ message: 'One or more questions not found.' });
    }

    // 2. Calculate score based on correct answers
    let correctCount = 0;
    for (const question of allQuestions) {
      if (user_answers[question.id] === question.correct_option) {
        correctCount++;
      }
    }
    const score = Math.round((correctCount / allQuestions.length) * 100);

    // 3. Get LLM-generated report with analysis
    const llmReport = await llmJudge.generateReport({
      questions: allQuestions,
      user_answers: user_answers,
      score: score,
      topic: allQuestions[0]?.topic || 'General'
    });

    const fullReport = {
      ...llmReport,
      score: score,
      correctAnswers: correctCount,
      totalQuestions: allQuestions.length
    };

    // 4. Store results in the database
    const fullReportString = JSON.stringify(fullReport);
    const result = await dbRun(
      db,
      'INSERT INTO quiz_results (user_id, score, raw_answers, final_report) VALUES (?, ?, ?, ?)',
      [userId, score, JSON.stringify(user_answers), fullReportString]
    );

    res.status(201).json({
      message: 'Quiz submitted and evaluated successfully.',
      resultId: result.id,
      report: fullReport
    });

  } catch (error) {
    handleServerError(res, error, 'An error occurred during quiz submission.');
  }
};

exports.getResultById = async (req, res) => {
  const { resultId } = req.params;
  const userId = req.user.id; // Get user ID from session

  try {
    const results = await dbAll(db, 'SELECT * FROM quiz_results WHERE id = ? AND user_id = ?', [resultId, userId]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Result not found or you do not have permission to view it.' });
    }

    const result = results[0];
    res.json({ report: JSON.parse(result.final_report) });
  } catch (error) {
    handleServerError(res, error, 'Server error fetching result.');
  }
};
