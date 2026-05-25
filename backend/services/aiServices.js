// services/aiService.js
const { OpenAI } = require("openai");
const path = require('path');
const config = require(path.join(__dirname, '..', 'config.js'));

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

// LLM Call 1: Comprehensive initial evaluation
exports.evaluateAnswers = async (questions, userAnswers) => {
  // --- Start of added logic ---
  let correctCount = 0;
  const strengths = new Set();
  const weak_areas = new Set();

  const questionMap = new Map(questions.map(q => [q.id.toString(), q]));

  for (const questionId in userAnswers) {
    const question = questionMap.get(questionId);
    if (question) {
      if (userAnswers[questionId] === question.correct_option) {
        correctCount++;
        strengths.add(question.topic);
      } else {
        weak_areas.add(question.topic);
      }
    }
  }

  const score = Math.round((correctCount / questions.length) * 100);
  // --- End of added logic ---

  const systemPrompt = `You are an expert quiz evaluation system. Based on the user's quiz data, respond ONLY with a single, minified JSON object with the following keys:
    - "score": ${score} (Use this pre-calculated value).
    - "strengths": ${JSON.stringify(Array.from(strengths))} (Use this pre-calculated array).
    - "weak_areas": ${JSON.stringify(Array.from(weak_areas))} (Use this pre-calculated array).
    - "error_pattern": A brief string describing any recurring pattern of mistakes (e.g., "Confuses IaaS with PaaS", "Struggles with networking concepts", or "None").
    - "key_insight": A single, concise sentence summarizing the user's performance.`;

  const userPrompt = `
    Here is the quiz data:
    - Questions & Answers: ${JSON.stringify(questions.map(q => ({ id: q.id, question: q.question_text, topic: q.topic, correct_option: q.correct_option, user_answer: userAnswers[q.id] })), null, 2)}
    - User's Submitted Answers: ${JSON.stringify(userAnswers)}
    - Pre-calculated Score: ${score}%
  `;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  const responseText = await callAI(messages, { type: 'json_object' });
  return safeParseJson(responseText);
};

// LLM Call 2A: Beginner-friendly explanation for low scores
async function getBeginnerExplanation(weakAreas) {
  const systemPrompt = `You are a friendly tutor. Explain the core concepts for the topics the user provides in a simple, clear, and encouraging way. Use Markdown for formatting.`;
  const userPrompt = `I'm struggling with these topics: ${JSON.stringify(weakAreas)}. Can you explain them?`;
  const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }];
  return callAI(messages);
}

// LLM Call 2B: Advanced feedback for high scores
async function getAdvancedFeedback(strengths) {
  const systemPrompt = `You are a senior architect. For the topics the user provides, provide advanced insights. Discuss real-world trade-offs, best practices, or deeper architectural implications. Go beyond the basic definitions. Use Markdown for formatting.`;
  const userPrompt = `I did well on these topics: ${JSON.stringify(strengths)}. Can you give me some advanced feedback?`;
  const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }];
  return callAI(messages);
}

exports.getDetailedFeedback = async (score, initialEvaluation) => {
    const scoreThreshold = 50;
    if (score < scoreThreshold) {
      if (initialEvaluation.weak_areas && initialEvaluation.weak_areas.length > 0) {
        return getBeginnerExplanation(initialEvaluation.weak_areas);
      }
      // Fallback AI call for low scores with no specific weak areas
      const systemPrompt = `You are a friendly and encouraging tutor. A user scored ${score}% on a quiz but no specific weak areas were identified. Write a brief, encouraging message (2-3 sentences) suggesting they review the general topic to solidify their understanding. Use Markdown for formatting.`;
      return callAI([{ role: 'system', content: systemPrompt }]);
    } else {
      if (initialEvaluation.strengths && initialEvaluation.strengths.length > 0) {
        return getAdvancedFeedback(initialEvaluation.strengths);
      }
      // Fallback AI call for high scores with no specific strengths
      const systemPrompt = `You are a senior architect. A user scored ${score}% on a quiz, showing good overall knowledge, but no specific standout strengths were identified. Write a brief, positive message (2-3 sentences) congratulating them on their solid performance and encouraging continued learning. Use Markdown for formatting.`;
      return callAI([{ role: 'system', content: systemPrompt }]);
    }
};

// LLM Call 3: Final report and roadmap generation
exports.generateFinalReport = async (initialEvaluation, detailedFeedback) => {
  const systemPrompt = `You are an AI career coach. Based on the performance analysis and detailed feedback provided by the user, create a final report.
    Respond ONLY with a single, minified JSON object with the following keys:
    - "overall_summary": A concise, one-paragraph summary of the user's performance, incorporating the 'key_insight'.
    - "detailed_breakdown": The full detailed feedback text you were provided.
    - "personalized_roadmap": An array of 3-4 specific, actionable string suggestions for what the user should study or practice next, based on their 'weak_areas' or 'strengths'.`;

  const userPrompt = `
    Please generate the final report based on this data:

    **Performance Analysis:**
    ${JSON.stringify(initialEvaluation, null, 2)}

    **Detailed Feedback:**
    ${detailedFeedback}
  `;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  const responseText = await callAI(messages, { type: 'json_object' });
  return safeParseJson(responseText);
};
