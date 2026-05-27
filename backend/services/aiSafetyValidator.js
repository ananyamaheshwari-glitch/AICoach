// services/aiSafetyValidator.js
// AI Safety Implementation: LLM Output Safety Validation

/**
 * Validates LLM output for harmful, toxic, or inappropriate content
 * Returns safe content or triggers fallback
 */

const HARMFUL_KEYWORDS = [
  // Violence - only extreme cases
  'kill yourself', 'murder', 'assault someone', 'attack someone',
  // Discrimination - clear hate speech
  'you are racist', 'you are sexist', 'you are homophobic',
  // Hate speech - directed at person
  'i hate you', 'you are disgusting', 'you are despicable',
  // Self-harm
  'suicide', 'self-harm', 'cut yourself', 'harm yourself',
  // Illegal activities - clear instruction
  'commit crime', 'sell drugs', 'steal', 'cheat on exam',
];

const MAX_OUTPUT_LENGTH = 50000; // 50KB max
const MIN_OUTPUT_LENGTH = 10;    // At least 10 characters

/**
 * Check if content contains harmful keywords
 */
function containsHarmfulContent(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const lowerText = text.toLowerCase();

  for (const keyword of HARMFUL_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        safe: false,
        reason: `Harmful keyword detected: "${keyword}"`,
        keyword: keyword
      };
    }
  }

  return { safe: true };
}

/**
 * Validate output length
 */
function validateOutputLength(text) {
  if (!text || typeof text !== 'string') {
    return {
      safe: false,
      reason: 'Output is empty or invalid'
    };
  }

  if (text.length < MIN_OUTPUT_LENGTH) {
    return {
      safe: false,
      reason: `Output too short (${text.length} chars, minimum ${MIN_OUTPUT_LENGTH})`
    };
  }

  if (text.length > MAX_OUTPUT_LENGTH) {
    return {
      safe: false,
      reason: `Output too long (${text.length} chars, maximum ${MAX_OUTPUT_LENGTH})`
    };
  }

  return { safe: true };
}

/**
 * Check for suspicious patterns in JSON output
 */
function validateJSONStructure(text) {
  try {
    const json = JSON.parse(text);

    // Check that required fields exist for evaluation output
    if (json.score !== undefined || json.strengths !== undefined) {
      if (typeof json.score !== 'number' || json.score < 0 || json.score > 100) {
        return {
          safe: false,
          reason: 'Invalid score value (should be 0-100)'
        };
      }
    }

    return { safe: true };
  } catch (e) {
    return {
      safe: false,
      reason: `Invalid JSON format: ${e.message}`
    };
  }
}

/**
 * Check for excessive repetition (potential spam/abuse)
 */
function checkForRepetition(text, threshold = 0.3) {
  if (!text || typeof text !== 'string') {
    return { safe: true };
  }

  const words = text.toLowerCase().split(/\s+/);
  if (words.length < 10) {
    return { safe: true }; // Skip check for very short text
  }

  const wordFreq = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  // Check if any word appears more than threshold of total words
  const maxFrequency = Math.max(...Object.values(wordFreq));
  const repetitionRatio = maxFrequency / words.length;

  if (repetitionRatio > threshold) {
    return {
      safe: false,
      reason: `Excessive repetition detected (${(repetitionRatio * 100).toFixed(1)}%)`
    };
  }

  return { safe: true };
}

/**
 * MAIN VALIDATION FUNCTION: Comprehensive safety check
 */
function validateLLMOutput(output, outputType = 'text') {
  console.log(`\n🔒 Validating LLM ${outputType} output...`);
  console.log(`Output length: ${output ? output.length : 0} characters`);

  const validationResults = [];

  // 1. Check length
  const lengthCheck = validateOutputLength(output);
  validationResults.push(lengthCheck);
  if (!lengthCheck.safe) {
    console.warn(`⚠️  Length check failed: ${lengthCheck.reason}`);
  } else {
    console.log(`✅ Length check passed`);
  }

  // 2. Check for harmful content
  const harmfulCheck = containsHarmfulContent(output);
  validationResults.push(harmfulCheck);
  if (!harmfulCheck.safe) {
    console.warn(`⚠️  Harmful content detected: ${harmfulCheck.reason}`);
  } else {
    console.log(`✅ Harmful content check passed`);
  }

  // 3. Check for excessive repetition
  const repetitionCheck = checkForRepetition(output);
  validationResults.push(repetitionCheck);
  if (!repetitionCheck.safe) {
    console.warn(`⚠️  Repetition check failed: ${repetitionCheck.reason}`);
  } else {
    console.log(`✅ Repetition check passed`);
  }

  // 4. If JSON output, validate structure
  if (outputType === 'json') {
    const jsonCheck = validateJSONStructure(output);
    validationResults.push(jsonCheck);
    if (!jsonCheck.safe) {
      console.warn(`⚠️  JSON validation failed: ${jsonCheck.reason}`);
    } else {
      console.log(`✅ JSON structure check passed`);
    }
  }

  // Determine overall safety
  const allSafe = validationResults.every(result => result.safe);

  if (allSafe) {
    console.log('✅ Output validation PASSED - Safe to use');
  } else {
    console.log('❌ Output validation FAILED - Using fallback');
  }

  return {
    safe: allSafe,
    checks: validationResults,
    failureReasons: validationResults
      .filter(r => !r.safe)
      .map(r => r.reason)
  };
}

/**
 * Safe evaluation output fallback
 */
function getFallbackEvaluation(score) {
  return {
    score: score,
    strengths: ['Continue practicing to identify strengths'],
    weak_areas: ['Review course material for weak areas'],
    error_pattern: 'Insufficient data - needs more attempts to identify patterns',
    key_insight: `You scored ${score}% on this quiz. Continue practicing to improve.`,
    topic_breakdown: { General: { correct: 0, total: 0 } }
  };
}

/**
 * Safe feedback output fallback
 */
function getFallbackFeedback(score) {
  if (score < 50) {
    return `You scored ${score}% on this quiz. Review the course material and try again. Practice makes perfect!`;
  } else {
    return `Great job! You scored ${score}% on this quiz. Keep up the good work and continue learning!`;
  }
}

/**
 * Safe roadmap fallback
 */
function getFallbackRoadmap(score) {
  if (score >= 80) {
    return [
      'Continue exploring advanced concepts in this topic area',
      'Practice real-world scenarios and case studies',
      'Help peers by explaining concepts you\'ve mastered',
      'Explore related topics to deepen your expertise',
      'Consider teaching or mentoring others'
    ];
  } else if (score >= 60) {
    return [
      'Review core concepts that you found challenging',
      'Complete 10 practice problems focusing on weak areas',
      'Study worked examples for the topics you missed',
      'Take another quiz after a week to reinforce learning',
      'Join study groups to discuss difficult concepts'
    ];
  } else {
    return [
      'Review fundamental concepts from the beginning',
      'Complete 15 basic practice problems with explanations',
      'Watch tutorial videos on core topics',
      'Practice daily with timed quizzes',
      'Schedule a tutoring session or study group session'
    ];
  }
}

module.exports = {
  validateLLMOutput,
  containsHarmfulContent,
  validateOutputLength,
  validateJSONStructure,
  checkForRepetition,
  getFallbackEvaluation,
  getFallbackFeedback,
  getFallbackRoadmap
};
