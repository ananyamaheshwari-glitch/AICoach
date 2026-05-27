// services/aiService.js
const { OpenAI } = require("openai");
const path = require('path');
const config = require(path.join(__dirname, '..', 'config.js'));
const aiSafetyValidator = require('./aiSafetyValidator');

const openai = new OpenAI({
  apiKey: config.huggingface.token,
  baseURL: "https://router.huggingface.co/v1", // Using the specified base URL
});

const AI_MODEL = config.huggingface.model;

async function callAI(messages, response_format = { type: 'text' }) {
  const options = {
    model: AI_MODEL,
    messages: messages,
    // The openai library uses a different parameter name for max tokens
    max_tokens: config.huggingface.max_tokens,
    temperature: 0.1, // Lower temperature for more deterministic JSON output
  };
  if (response_format.type === 'json_object') {
    options.response_format = response_format;
  }
  try {
    const result = await openai.chat.completions.create(options, {
      timeout: 30000, // 30-second timeout
    });

    if (result.choices && result.choices.length > 0) {
      const content = result.choices[0].message.content;
      // Sanitize the content to remove non-printable/control characters except for standard whitespace.
      return content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    }
    throw new Error("AI returned an empty response.");
  } catch (error) {
    console.error("AI Service Error:", error);
    // The openai library has a different error structure for timeouts
    if (error.name === 'AbortError') {
      throw new Error("Network error: The request to the AI service timed out after 30 seconds.");
    }
    if (error.cause && error.cause.code === 'ENOTFOUND') {
      throw new Error("Network error: Could not resolve the AI service hostname. Please check the server's internet connection and DNS settings.");
    }
    throw new Error("Failed to get response from the AI model.");
  }
}

// A helper to safely parse JSON from the AI's text response
function safeParseJson(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Failed to parse AI JSON response:", error);
        if (process.env.NODE_ENV !== 'production') {
            console.error("Original AI response:", jsonString);
        }
        throw new Error("AI returned an invalid JSON format.");
    }
}

// Calculate confidence from OBSERVABLE DATA, not LLM guessing
// This counts how many wrong answers actually match the error pattern
function calculatePatternConfidence(detailedAnalysis, errorPattern) {
  // Get all wrong answers
  const wrongAnswers = detailedAnalysis.filter(qa => !qa.isCorrect);

  // If no wrong answers, confidence is perfect (nothing to be wrong about)
  if (wrongAnswers.length === 0) {
    return 1.0;
  }

  // Special case: "Insufficient data" pattern
  if (errorPattern === 'Insufficient data - mixed misconceptions or random errors' ||
      errorPattern === 'None' ||
      !errorPattern) {
    return 0.0;
  }

  // Count how many wrong answers show the SAME USER ANSWER
  // This detects if they picked the same wrong option multiple times (clear misconception)
  const answerFrequency = {};
  wrongAnswers.forEach(qa => {
    const answer = qa.userAnswer;
    answerFrequency[answer] = (answerFrequency[answer] || 0) + 1;
  });

  // Find the most common wrong answer
  const mostCommonAnswer = Object.entries(answerFrequency)
    .sort((a, b) => b[1] - a[1])[0];

  if (!mostCommonAnswer) {
    return 0.0;
  }

  // Confidence = how many wrong answers picked the most common wrong option
  const matchingAnswers = mostCommonAnswer[1];
  const confidence = matchingAnswers / wrongAnswers.length;

  return Math.min(1.0, Math.max(0.0, confidence)); // Clamp 0-1
}

// Validate error pattern using DATA-DRIVEN confidence
function validateErrorPattern(evaluation, detailedAnalysis) {
  // Calculate REAL confidence from observable data
  const realConfidence = calculatePatternConfidence(
    detailedAnalysis,
    evaluation.error_pattern
  );

  console.log(`Pattern confidence: ${evaluation.error_pattern}`);
  console.log(`  Claimed (LLM): ${evaluation.error_pattern_confidence || 0}`);
  console.log(`  Actual (data): ${realConfidence}`);

  // If real confidence is below threshold, mark as unreliable
  if (realConfidence < 0.5) {
    console.warn(`Low data-driven confidence (${realConfidence}). Using safe fallback.`);
    return {
      ...evaluation,
      error_pattern: 'Insufficient data - mixed misconceptions or random errors',
      error_pattern_confidence: 0,
      should_caution_in_feedback: true
    };
  }

  // Use the REAL confidence, not the LLM-guessed one
  return {
    ...evaluation,
    error_pattern_confidence: realConfidence,  // Override with real data
    should_caution_in_feedback: false
  };
}

// LLM Call 1: Comprehensive initial evaluation
exports.evaluateAnswers = async (questions, userAnswers) => {
  let correctCount = 0;
  const questionMap = new Map(questions.map(q => [q.id.toString(), q]));

  // Build detailed analysis with explanation context
  const detailedAnalysis = questions.map(q => {
    const userAnswer = userAnswers[q.id];
    const isCorrect = userAnswer === q.correct_option;
    if (isCorrect) correctCount++;

    // Generate explanation context for LLM to make informed analysis
    const wrongAnswerLabel = userAnswer && userAnswer !== q.correct_option
      ? userAnswer
      : null;

    return {
      id: q.id,
      question: q.question_text,
      topic: q.topic,
      userAnswer: userAnswer,
      correctAnswer: q.correct_option,
      isCorrect: isCorrect,
      correctAnswerText: q[`option_${q.correct_option.toLowerCase()}`],
      userAnswerText: userAnswer ? q[`option_${userAnswer.toLowerCase()}`] : 'No answer',
      allOptions: {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d
      },
      wrongAnswerExplanationNeeded: !isCorrect // Flag for LLM to explain difference
    };
  });

  const score = Math.round((correctCount / questions.length) * 100);

  // Identify which topics they got right vs wrong
  const topicPerformance = {};
  detailedAnalysis.forEach(qa => {
    if (!topicPerformance[qa.topic]) {
      topicPerformance[qa.topic] = { correct: 0, total: 0 };
    }
    topicPerformance[qa.topic].total++;
    if (qa.isCorrect) topicPerformance[qa.topic].correct++;
  });

  const systemPrompt = `You are an expert education analyst. Analyze the student's quiz performance and identify patterns.

IMPORTANT RULES:
- Return ONLY valid JSON (no markdown, explanations, or extra text)
- Base analysis ONLY on actual question performance shown
- error_pattern: If you see a clear pattern in WRONG answers, describe it. If pattern is unclear, say "Insufficient data - mixed question types"
  * Look at which wrong answers they picked
  * Do they pick the same wrong option multiple times? → Misconception
  * Do they pick different wrong options randomly? → Guess
- key_insight: Summarize their performance based ONLY on score and actual results
- strengths: Topics where they answered >= 75% correctly
- weak_areas: Topics where they answered <= 50% correctly

NOTE: Do NOT provide error_pattern_confidence. Confidence will be calculated from observable data.

Return JSON with keys: score, strengths, weak_areas, error_pattern, key_insight, topic_breakdown`;

  const userPrompt = `
STUDENT QUIZ PERFORMANCE ANALYSIS

Score: ${score}% (${correctCount}/${questions.length} correct)

DETAILED ANSWER BREAKDOWN:
${JSON.stringify(detailedAnalysis, null, 2)}

TOPIC PERFORMANCE SUMMARY:
${JSON.stringify(topicPerformance, null, 2)}

ANALYSIS TASK:
Analyze the answer breakdown. Look at the userAnswer field.

1. Do they pick the SAME wrong option multiple times?
   → If YES: Describe what misconception (they're confusing X with Y)
   → If NO: Say "Insufficient data - mixed misconceptions or random errors"

2. Provide key_insight about their overall performance

3. Identify strengths (topics 75%+) and weak_areas (topics 50%-)

IMPORTANT: Do NOT rate your own confidence. Just describe the pattern you see.
Confidence will be calculated from how many wrong answers match the pattern.`;


  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  const responseText = await callAI(messages, { type: 'json_object' });

  // Safety: Validate LLM output before parsing
  const safetyCheck = aiSafetyValidator.validateLLMOutput(responseText, 'json');
  if (!safetyCheck.safe) {
    console.warn(`🚨 SAFETY VIOLATION in evaluation output: ${safetyCheck.failureReasons.join(', ')}`);
    return aiSafetyValidator.getFallbackEvaluation(score);
  }

  const evaluation = safeParseJson(responseText);

  // Ensure strengths and weak_areas are always populated
  const strengthsList = Object.entries(topicPerformance)
    .filter(([topic, perf]) => (perf.correct / perf.total) >= 0.75)
    .map(([topic, perf]) => `${topic} (score ${Math.round((perf.correct / perf.total) * 100)}%)`)
    .filter(Boolean);

  const weakList = Object.entries(topicPerformance)
    .filter(([topic, perf]) => (perf.correct / perf.total) <= 0.50)
    .map(([topic, perf]) => `${topic} (score ${Math.round((perf.correct / perf.total) * 100)}%)`)
    .filter(Boolean);

  evaluation.strengths = (evaluation.strengths && evaluation.strengths.length > 0)
    ? evaluation.strengths
    : strengthsList;

  evaluation.weak_areas = (evaluation.weak_areas && evaluation.weak_areas.length > 0)
    ? evaluation.weak_areas
    : weakList;

  console.log('Final strengths:', evaluation.strengths);
  console.log('Final weak_areas:', evaluation.weak_areas);

  // Validate error pattern to avoid hallucinations
  const validatedEvaluation = validateErrorPattern(evaluation, detailedAnalysis);

  return validatedEvaluation;
};

// LLM Call 2A: Beginner-friendly explanation for low scores
async function getBeginnerExplanation(weakAreas, errorPattern, questions, userAnswers, score) {
  const systemPrompt = `You are a supportive tutor helping a struggling student understand core concepts.

IMPORTANT:
- Write in simple, clear language with examples
- Address the SPECIFIC misconceptions they showed
- Explain WHY the correct answer is right
- Use real-world analogies
- Be encouraging about their effort
- NO markdown formatting (just plain text with line breaks)`;

  const userPrompt = `
A student scored poorly on these topics: ${JSON.stringify(weakAreas)}

Their specific error pattern: ${errorPattern}

NOTE: If the error pattern says "Insufficient data", explain the fundamentals without assuming a specific misconception.

Help them understand these concepts simply. Explain what they misunderstood and why.`;

  const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }];
  const feedback = await callAI(messages);

  // Safety: Validate feedback output
  const safetyCheck = aiSafetyValidator.validateLLMOutput(feedback, 'text');
  if (!safetyCheck.safe) {
    console.warn(`🚨 SAFETY VIOLATION in feedback: ${safetyCheck.failureReasons.join(', ')}`);
    return aiSafetyValidator.getFallbackFeedback(score);
  }

  return feedback;
}

// LLM Call 2B: Advanced feedback for high scores
async function getAdvancedFeedback(strengths, score, topicBreakdown) {
  const systemPrompt = `You are a senior architect/expert educator.

IMPORTANT:
- Reference their ACTUAL strengths shown in quiz answers
- Provide next-level insights beyond basics
- Suggest real-world applications of what they know
- Discuss architectural trade-offs relevant to their strong areas
- NO markdown formatting (just plain text with line breaks)`;

  const userPrompt = `
A student scored ${score}% and showed strength in: ${JSON.stringify(strengths)}

Topic breakdown: ${JSON.stringify(topicBreakdown)}

Give them advanced insights to deepen their expertise in these areas. What should they study next?`;

  const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }];
  const feedback = await callAI(messages);

  // Safety: Validate feedback output
  const safetyCheck = aiSafetyValidator.validateLLMOutput(feedback, 'text');
  if (!safetyCheck.safe) {
    console.warn(`🚨 SAFETY VIOLATION in feedback: ${safetyCheck.failureReasons.join(', ')}`);
    return aiSafetyValidator.getFallbackFeedback(score);
  }

  return feedback;
}

exports.getDetailedFeedback = async (score, initialEvaluation, questions, userAnswers) => {
    const scoreThreshold = 50;
    if (score < scoreThreshold) {
      if (initialEvaluation.weak_areas && initialEvaluation.weak_areas.length > 0) {
        return getBeginnerExplanation(
          initialEvaluation.weak_areas,
          initialEvaluation.error_pattern,
          questions,
          userAnswers,
          score
        );
      }
      const systemPrompt = `You are a supportive tutor. A student scored ${score}% but we haven't identified specific weak areas yet. Write an encouraging message suggesting they review fundamentals. NO markdown - just plain text.`;
      const feedback = await callAI([{ role: 'system', content: systemPrompt }]);

      // Safety: Validate feedback output
      const safetyCheck = aiSafetyValidator.validateLLMOutput(feedback, 'text');
      if (!safetyCheck.safe) {
        console.warn(`🚨 SAFETY VIOLATION in feedback: ${safetyCheck.failureReasons.join(', ')}`);
        return aiSafetyValidator.getFallbackFeedback(score);
      }

      return feedback;
    } else {
      if (initialEvaluation.strengths && initialEvaluation.strengths.length > 0) {
        return getAdvancedFeedback(
          initialEvaluation.strengths,
          score,
          initialEvaluation.topic_breakdown
        );
      }
      const systemPrompt = `You are a senior architect. A student scored ${score}% showing solid knowledge. Congratulate them and suggest advanced next steps. NO markdown - just plain text.`;
      const feedback = await callAI([{ role: 'system', content: systemPrompt }]);

      // Safety: Validate feedback output
      const safetyCheck = aiSafetyValidator.validateLLMOutput(feedback, 'text');
      if (!safetyCheck.safe) {
        console.warn(`🚨 SAFETY VIOLATION in feedback: ${safetyCheck.failureReasons.join(', ')}`);
        return aiSafetyValidator.getFallbackFeedback(score);
      }

      return feedback;
    }
};

// LLM Call 3: Final report and roadmap generation
exports.generateFinalReport = async (initialEvaluation, detailedFeedback) => {
  const systemPrompt = `You are a learning architect. Create a personalized learning roadmap based on ACTUAL performance data.

CRITICAL RULES:
- overall_summary: 1-2 sentences using ONLY key_insight and score, no generic statements
- detailed_breakdown: Include the detailed_feedback provided
- personalized_roadmap: Generate 4-5 SPECIFIC, ACTIONABLE next steps using topic_breakdown
  * For weak topics (score < 50%): Suggest fundamental drills, practice problems
  * For strong topics (score >= 75%): Suggest advanced patterns, real-world applications
  * Reference actual topic names and scores
  * Be concrete ("Complete 5 IaaS/PaaS practice problems" not "Study cloud")
  * Include confidence level if error_pattern_confidence is low

Return ONLY valid JSON with keys: overall_summary, detailed_breakdown, personalized_roadmap`;

  const userPrompt = `
CREATE PERSONALIZED LEARNING ROADMAP - USE TOPIC BREAKDOWN

Performance Analysis:
${JSON.stringify(initialEvaluation, null, 2)}

Detailed Feedback:
${detailedFeedback}

EXPLICIT TOPIC-BASED ROADMAP INSTRUCTIONS:
Use the topic_breakdown provided above. For each topic:
- If they scored < 50%: Add fundamental practice step
- If they scored 50-74%: Add reinforcement step
- If they scored >= 75%: Add advanced/application step

Example format:
- "Cloud (score 60%): Complete 5 practice problems on [specific weak concept]"
- "Security (score 90%): Explore advanced patterns in [their strong area]"

Create 4-5 steps total based on ACTUAL topic performance shown in topic_breakdown above.`;


  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  const responseText = await callAI(messages, { type: 'json_object' });

  // Safety: Validate LLM output before parsing
  const safetyCheck = aiSafetyValidator.validateLLMOutput(responseText, 'json');
  if (!safetyCheck.safe) {
    console.warn(`🚨 SAFETY VIOLATION in final report: ${safetyCheck.failureReasons.join(', ')}`);
    return {
      overall_summary: `You scored ${initialEvaluation.score}%. Continue practicing to improve.`,
      detailed_breakdown: detailedFeedback,
      personalized_roadmap: aiSafetyValidator.getFallbackRoadmap(initialEvaluation.score)
    };
  }

  const reportData = safeParseJson(responseText);

  // Ensure detailed_breakdown always includes the feedback
  return {
    ...reportData,
    detailed_breakdown: reportData.detailed_breakdown || detailedFeedback
  };
};
