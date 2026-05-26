// services/keywordEvaluator.js
// Simple keyword-based answer evaluation for beginners

/**
 * Extract keywords from answer and compare to required keywords
 * Simple, fast, no API calls needed
 */
exports.evaluateAnswer = (studentAnswer, requiredKeywords) => {
  try {
    // Normalize: lowercase and remove punctuation
    const normalizedAnswer = studentAnswer
      .toLowerCase()
      .replace(/[.,!?;:()]/g, '')
      .trim();

    // Split into words
    const answerWords = new Set(normalizedAnswer.split(/\s+/));

    // Check each required keyword
    const foundKeywords = [];
    const missingKeywords = [];

    for (const keyword of requiredKeywords) {
      const normalizedKeyword = keyword.toLowerCase().trim();

      // Check if keyword exists in answer
      if (answerWords.has(normalizedKeyword) ||
          normalizedAnswer.includes(normalizedKeyword)) {
        foundKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    }

    // Calculate score based on keywords found
    const score = Math.round((foundKeywords.length / requiredKeywords.length) * 100);

    // Generate feedback
    let feedback = '';
    if (score === 100) {
      feedback = 'Excellent! You covered all the key concepts.';
    } else if (score >= 80) {
      feedback = 'Very good! You covered most key concepts.';
    } else if (score >= 60) {
      feedback = 'Good attempt! You covered some key concepts, but missed some important ones.';
    } else if (score >= 40) {
      feedback = 'You got started, but your answer is incomplete. Make sure to mention the missing concepts.';
    } else {
      feedback = 'Your answer needs more detail. Try to include the key concepts.';
    }

    return {
      score: score,
      foundKeywords: foundKeywords,
      missingKeywords: missingKeywords,
      feedback: feedback,
      isCorrect: score >= 70  // 70+ is considered passing
    };

  } catch (error) {
    console.error("Keyword evaluation error:", error.message);
    return {
      score: 0,
      foundKeywords: [],
      missingKeywords: requiredKeywords,
      feedback: "Could not evaluate answer. Please try again.",
      isCorrect: false
    };
  }
};

/**
 * Evaluate multiple answers at once
 */
exports.evaluateAnswers = (questions, answers) => {
  const evaluations = {};

  for (const [questionId, studentAnswer] of Object.entries(answers)) {
    const question = questions.find(q => q.id.toString() === questionId);

    // Skip if question not found or is multiple choice
    if (!question || question.question_type === 'multiple_choice') {
      continue;
    }

    // Only evaluate open-ended questions
    if (question.question_type === 'open_ended') {
      // Get required keywords from evaluation_criteria
      const requiredKeywords = parseKeywords(question.evaluation_criteria);

      const evaluation = this.evaluateAnswer(studentAnswer, requiredKeywords);

      evaluations[questionId] = {
        score: evaluation.score,
        foundKeywords: evaluation.foundKeywords,
        missingKeywords: evaluation.missingKeywords,
        feedback: evaluation.feedback,
        isCorrect: evaluation.isCorrect
      };
    }
  }

  return evaluations;
};

/**
 * Calculate combined score from multiple-choice and open-ended
 */
exports.calculateCombinedScore = (allQuestions, answers, evaluations) => {
  let totalScore = 0;
  let totalQuestions = 0;

  for (const question of allQuestions) {
    const studentAnswer = answers[question.id];

    if (question.question_type === 'multiple_choice') {
      totalQuestions++;
      const isCorrect = studentAnswer === question.correct_option;
      totalScore += isCorrect ? 100 : 0;
    } else if (question.question_type === 'open_ended') {
      totalQuestions++;
      const evaluation = evaluations[question.id];
      if (evaluation) {
        totalScore += evaluation.score;
      } else {
        totalScore += 0;  // No answer provided
      }
    }
  }

  const averageScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;
  return averageScore;
};

/**
 * Generate analysis of open-ended answers
 */
exports.generateAnalysis = (questions, answers, evaluations) => {
  const openEndedAnswers = [];

  for (const question of questions) {
    if (question.question_type === 'open_ended' && evaluations[question.id]) {
      const evaluation = evaluations[question.id];
      openEndedAnswers.push({
        questionId: question.id,
        question: question.question_text,
        studentAnswer: answers[question.id],
        score: evaluation.score,
        feedback: evaluation.feedback,
        foundKeywords: evaluation.foundKeywords,
        missingKeywords: evaluation.missingKeywords,
        isCorrect: evaluation.isCorrect
      });
    }
  }

  // Calculate average for open-ended only
  const averageScore = openEndedAnswers.length > 0
    ? Math.round(openEndedAnswers.reduce((sum, a) => sum + a.score, 0) / openEndedAnswers.length)
    : 0;

  return {
    totalOpenEnded: openEndedAnswers.length,
    averageScore: averageScore,
    answers: openEndedAnswers
  };
};

/**
 * Parse keywords from evaluation criteria string
 * Format: "Must mention: keyword1, keyword2, keyword3"
 */
function parseKeywords(evaluationCriteria) {
  if (!evaluationCriteria) {
    return [];
  }

  // Extract keywords after "mention:" or "include:"
  const match = evaluationCriteria.match(/(?:mention|include|know)[\s:]*([^.!?]+)/i);

  if (match) {
    return match[1]
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
  }

  return [];
}

module.exports.parseKeywords = parseKeywords;
