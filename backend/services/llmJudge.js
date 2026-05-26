const aiService = require('./aiServices');

const getDefaultRoadmap = (score) => {
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
};

exports.generateReport = async (quizData) => {
  const { questions, user_answers, score, topic } = quizData;

  try {
    // Stage 1: Detailed analysis of performance
    console.log('Stage 1: Analyzing quiz performance...');
    const initialEvaluation = await aiService.evaluateAnswers(questions, user_answers);
    console.log('Performance analysis complete:', {
      score: initialEvaluation.score,
      strengths: initialEvaluation.strengths,
      weakAreas: initialEvaluation.weak_areas,
      errorPattern: initialEvaluation.error_pattern,
      errorPatternConfidence: initialEvaluation.error_pattern_confidence,
      shouldCautionInFeedback: initialEvaluation.should_caution_in_feedback
    });

    // Confidence check: Warn if error pattern is unreliable
    if (initialEvaluation.error_pattern_confidence < 0.5) {
      console.warn('⚠️  Low confidence error pattern - feedback will be cautious');
    }

    // Stage 2: Contextual feedback (beginner or advanced)
    console.log('Stage 2: Generating detailed feedback...');
    const detailedFeedback = await aiService.getDetailedFeedback(
      score,
      initialEvaluation,
      questions,
      user_answers
    );
    console.log('Detailed feedback generated');

    // Stage 3: Final report with personalized roadmap
    console.log('Stage 3: Creating personalized roadmap...');
    const finalReport = await aiService.generateFinalReport(initialEvaluation, detailedFeedback);
    console.log('Final report complete');

    // Ensure roadmap is always present and complete
    const roadmap = finalReport.personalized_roadmap || getDefaultRoadmap(score);
    const roadmapArray = Array.isArray(roadmap)
      ? roadmap.filter(item => item && item.trim())
      : roadmap.steps?.map(s => s.step) || [roadmap];

    // Ensure we have at least 3 roadmap items
    if (!roadmapArray || roadmapArray.length < 3) {
      roadmapArray.push(...getDefaultRoadmap(score).slice(roadmapArray.length));
    }

    // Attach confidence metadata for frontend if needed
    return {
      ...finalReport,
      strengths: initialEvaluation.strengths,
      weak_areas: initialEvaluation.weak_areas,
      personalized_roadmap: roadmapArray,
      _metadata: {
        error_pattern_confidence: initialEvaluation.error_pattern_confidence,
        should_caution_in_feedback: initialEvaluation.should_caution_in_feedback
      }
    };
  } catch (error) {
    console.error('Error generating LLM report:', error);

    // Calculate fallback strengths and weak areas from topic performance
    const questionsArray = Array.isArray(questions) ? questions : [];
    const topicPerf = {};
    questionsArray.forEach(q => {
      if (!topicPerf[q.topic]) {
        topicPerf[q.topic] = { correct: 0, total: 0 };
      }
      topicPerf[q.topic].total++;
      if (user_answers[q.id] === q.correct_option) {
        topicPerf[q.topic].correct++;
      }
    });

    const fallbackStengths = Object.entries(topicPerf)
      .filter(([topic, perf]) => (perf.correct / perf.total) >= 0.75)
      .map(([topic, perf]) => `${topic} (score ${Math.round((perf.correct / perf.total) * 100)}%)`)
      .filter(Boolean);

    const fallbackWeakAreas = Object.entries(topicPerf)
      .filter(([topic, perf]) => (perf.correct / perf.total) <= 0.50)
      .map(([topic, perf]) => `${topic} (score ${Math.round((perf.correct / perf.total) * 100)}%)`)
      .filter(Boolean);

    // Fallback if LLM call fails
    return {
      overall_summary: 'Unable to generate detailed analysis at this time.',
      detailed_breakdown: 'Please try submitting the quiz again.',
      personalized_roadmap: ['Review the course material', 'Practice similar questions', 'Identify your knowledge gaps'],
      strengths: fallbackStengths,
      weak_areas: fallbackWeakAreas
    };
  }
};
