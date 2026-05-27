const { validationResult } = require("express-validator");
const QuizService = require("../services/quizService");

const handleServerError = (res, error, customMessage) => {
  console.error(`${customMessage}:`, error);
  const responseError = { message: customMessage };
  if (process.env.NODE_ENV !== "production") {
    responseError.error = error.message;
  }
  res.status(500).json(responseError);
};

exports.getQuestionsByTopic = async (req, res) => {
  const { topic } = req.params;
  try {
    const result = await QuizService.getQuestionsByTopic(topic);
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }
    res.json(result.questions);
  } catch (error) {
    handleServerError(res, error, "Server error fetching questions.");
  }
};

exports.submitQuiz = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }

  const { user_answers } = req.body;
  const userId = req.user.id;

  if (!user_answers || typeof user_answers !== 'object' || Object.keys(user_answers).length === 0) {
    return res.status(400).json({ message: "No answers provided." });
  }

  const validOptions = ['A', 'B', 'C', 'D'];
  for (const [questionId, answer] of Object.entries(user_answers)) {
    if (!validOptions.includes(answer)) {
      return res.status(400).json({ message: `Invalid answer for question ${questionId}. Must be A, B, C, or D.` });
    }
    if (isNaN(questionId) || parseInt(questionId) <= 0) {
      return res.status(400).json({ message: `Invalid question ID: ${questionId}` });
    }
  }

  try {
    const { db, dbAll } = require("../db/database");

    const submittedIds = Object.keys(user_answers);
    const placeholders = submittedIds.map(() => "?").join(",");
    const submittedQuestions = await dbAll(
      db,
      `SELECT * FROM questions WHERE id IN (${placeholders})`,
      submittedIds,
    );

    if (submittedQuestions.length === 0) {
      return res.status(400).json({ message: "Invalid questions." });
    }

    const topic = submittedQuestions[0].topic;
    const allQuestions = await dbAll(
      db,
      "SELECT * FROM questions WHERE topic = ? ORDER BY id",
      [topic],
    );

    if (allQuestions.length === 0) {
      return res.status(404).json({ message: "No questions found for this topic." });
    }

    const validQuestionIds = allQuestions.map((q) => q.id.toString());
    const extraAnswers = submittedIds.filter((id) => !validQuestionIds.includes(id));
    if (extraAnswers.length > 0) {
      return res.status(400).json({
        message: `Invalid question IDs: ${extraAnswers.join(", ")}`,
      });
    }

    const evaluation = await QuizService.evaluateQuiz(allQuestions, user_answers);
    const fullReport = await QuizService.generateReport(allQuestions, user_answers, evaluation, topic);
    const saveResult = await QuizService.saveResult(userId, user_answers, fullReport);

    if (!saveResult.success) {
      return res.status(500).json({ message: saveResult.message });
    }

    res.status(201).json({
      message: "Quiz submitted and evaluated successfully.",
      resultId: saveResult.resultId,
      report: fullReport,
    });
  } catch (error) {
    handleServerError(res, error, "An error occurred during quiz submission.");
  }
};

exports.getResultById = async (req, res) => {
  const { resultId } = req.params;
  const userId = req.user.id;

  const id = parseInt(resultId);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid result ID format." });
  }

  try {
    const result = await QuizService.getResultById(id, userId);
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }
    res.json(result);
  } catch (error) {
    handleServerError(res, error, "Server error fetching result.");
  }
};
