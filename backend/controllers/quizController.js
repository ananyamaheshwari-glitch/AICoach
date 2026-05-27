// controllers/quizController.js
const { db, dbAll, dbRun } = require("../db/database");
const llmJudge = require("../services/llmJudge");

// Helper function for consistent error responses
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
    const questions = await dbAll(
      db,
      "SELECT id, question_text, option_a, option_b, option_c, option_d, topic FROM questions WHERE UPPER(topic) = UPPER(?)",
      [topic],
    );
    if (questions.length === 0) {
      return res
        .status(404)
        .json({ message: "No questions found for this topic." });
    }
    res.json(questions);
  } catch (error) {
    handleServerError(res, error, "Server error fetching questions.");
  }
};

exports.submitQuiz = async (req, res) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }

  const { user_answers } = req.body; // e.g., {"21": "A", "22": "C"}
  const userId = req.user.id; // Get user ID securely from the session via authMiddleware

  // Validate user_answers structure
  if (!user_answers || typeof user_answers !== 'object' || Object.keys(user_answers).length === 0) {
    return res.status(400).json({ message: "No answers provided." });
  }

  // Validate all answer values are valid options
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
    // 1. Fetch the questions that were submitted to get their details and topic
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

    // Get the topic from the first submitted question
    const topic = submittedQuestions[0].topic;

    // 2. Fetch all questions for this topic (the actual quiz)
    const allQuestions = await dbAll(
      db,
      "SELECT * FROM questions WHERE topic = ? ORDER BY id",
      [topic],
    );
    if (allQuestions.length === 0) {
      return res
        .status(404)
        .json({ message: "No questions found for this topic." });
    }

    // Validate no extra questions answered
    const validQuestionIds = allQuestions.map((q) => q.id.toString());
    const extraAnswers = submittedIds.filter(
      (id) => !validQuestionIds.includes(id),
    );
    if (extraAnswers.length > 0) {
      return res.status(400).json({
        message: `Invalid question IDs: ${extraAnswers.join(", ")}`,
      });
    }

    // 2. Calculate score, wrong answers, and unanswered
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const questionDetails = allQuestions.map((question) => {
      const userAnswer = user_answers[question.id] || null;
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

    // 3. Get LLM-generated report with analysis
    const llmReport = await llmJudge.generateReport({
      questions: allQuestions,
      user_answers: user_answers,
      score: score,
      topic: allQuestions[0]?.topic || "General",
    });


    const fullReport = {
      ...llmReport,
      topic: topic,
      score: score,
      scoreDisplay: `${correctCount} out of ${totalQuestions}`,
      correctAnswers: correctCount,
      answeredWrong: wrongCount,
      unanswered: unansweredCount,
      totalQuestions: totalQuestions,
      questionDetails: questionDetails,
    };

    console.log("Full Report Keys:", Object.keys(fullReport));
    console.log("key_insight:", fullReport.key_insight);
    console.log("strengths:", fullReport.strengths);
    console.log("weak_areas:", fullReport.weak_areas);
    console.log("overall_summary:", fullReport.overall_summary);
    console.log("detailed_breakdown:", fullReport.detailed_breakdown);
    console.log("personalized_roadmap:", fullReport.personalized_roadmap);

    // 4. Store results in the database
    const fullReportString = JSON.stringify(fullReport);
    const result = await dbRun(
      db,
      "INSERT INTO quiz_results (user_id, score, raw_answers, final_report) VALUES (?, ?, ?, ?)",
      [userId, score, JSON.stringify(user_answers), fullReportString],
    );

    res.status(201).json({
      message: "Quiz submitted and evaluated successfully.",
      resultId: result.id,
      report: fullReport,
    });
  } catch (error) {
    handleServerError(res, error, "An error occurred during quiz submission.");
  }
};

exports.getResultById = async (req, res) => {
  const { resultId } = req.params;
  const userId = req.user.id; // Get user ID from session

  // Validate resultId is a positive integer
  const id = parseInt(resultId);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid result ID format." });
  }

  try {
    const results = await dbAll(
      db,
      "SELECT * FROM quiz_results WHERE id = ? AND user_id = ?",
      [id, userId],
    );

    if (results.length === 0) {
      return res
        .status(404)
        .json({
          message: "Result not found or you do not have permission to view it.",
        });
    }

    const result = results[0];

    // Validate that final_report is valid JSON
    let report;
    try {
      report = JSON.parse(result.final_report);
    } catch (parseError) {
      return res.status(500).json({ message: "Failed to parse quiz report." });
    }

    // Validate required fields in report
    if (!report.overall_summary || report.score === undefined) {
      return res.status(500).json({ message: "Incomplete quiz report data." });
    }

    res.json({ report });
  } catch (error) {
    handleServerError(res, error, "Server error fetching result.");
  }
};
