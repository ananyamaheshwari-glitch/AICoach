# Complete Project Flow Guide - With LLM Integration

## 1. HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                         QUIZ APPLICATION                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐         ┌─────────────┐         ┌──────────────┐  │
│  │  Frontend   │────────▶│   Backend   │────────▶│  LLM Service │  │
│  │  (React)    │         │  (Node.js)  │         │  (HuggingFace)   │
│  │             │◀────────│             │◀────────│              │  │
│  └─────────────┘         └─────────────┘         └──────────────┘  │
│                                 │                                    │
│                                 ▼                                    │
│                          ┌─────────────┐                            │
│                          │  Database   │                            │
│                          │  (SQLite)   │                            │
│                          └─────────────┘                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. QUIZ FLOW - STEP BY STEP

### A. Student Views Available Quizzes (Dashboard)

```
FRONTEND (React):
┌──────────────────────────────┐
│  Dashboard Page              │
│  ├─ Cloud Computing (Quiz)   │
│  ├─ Security (Quiz)          │
│  └─ Networking (Quiz)        │
└──────────────────────────────┘
         │
         │ Click "Cloud Computing"
         ▼
    HTTP GET /quizzes/questions/Cloud
         │
         ▼
BACKEND (Node.js):
  GET /quizzes/questions/:topic
    ├─ Receive topic: "Cloud"
    ├─ Query database:
    │  SELECT * FROM questions
    │  WHERE UPPER(topic) = UPPER('Cloud')
    │
    └─ Return JSON:
       [
         { id: 1, question_text: "What is IaaS?", 
           option_a: "...", option_b: "...", ...},
         { id: 2, question_text: "What is PaaS?",
           ... }
       ]
         │
         ▼
FRONTEND (React):
  Display Quiz:
  ┌──────────────────────────────────────┐
  │ Cloud Computing Quiz                 │
  │                                      │
  │ Q1: What is IaaS?                    │
  │ ○ Internet as Service                │
  │ ○ Infrastructure as Service          │
  │ ○ Information as System              │
  │ ○ Integration as Service             │
  │                                      │
  │ Q2: What is PaaS?                    │
  │ ○ ...                                │
  └──────────────────────────────────────┘
```

### B. Student Takes Quiz

```
FRONTEND (React):
┌──────────────────────────────────────┐
│ Q1: What is IaaS?                    │
│ ✓ Infrastructure as Service (Selected)
│                                      │
│ Q2: What is PaaS?                    │
│ ✓ Platform as Service (Selected)     │
│                                      │
│ Q3: What is CDN?                     │
│ ✓ Content Delivery Network (Selected)│
│                                      │
│ [Submit Quiz]                        │
└──────────────────────────────────────┘
         │
         │ User clicks "Submit Quiz"
         │ answers = { 1: "B", 2: "B", 3: "B" }
         ▼
    HTTP POST /quizzes/submit
    Body: { user_answers: { 1: "B", 2: "B", 3: "B" } }
```

### C. Backend Processes Quiz Submission

This is where the magic happens with LLMs:

```
BACKEND (Node.js) - quizController.js:
  POST /quizzes/submit
    │
    ├─ 1. FETCH QUESTIONS
    │  ├─ Get user_answers: { 1: "B", 2: "B", 3: "B" }
    │  ├─ Query database for questions
    │  └─ Result:
    │     [
    │       { id: 1, question: "IaaS?", correct_option: "B", ... },
    │       { id: 2, question: "PaaS?", correct_option: "B", ... },
    │       { id: 3, question: "CDN?", correct_option: "B", ... }
    │     ]
    │
    ├─ 2. CALCULATE SCORE
    │  ├─ Compare user_answers with correct_option
    │  ├─ Q1: B == B ✓ Correct
    │  ├─ Q2: B == B ✓ Correct
    │  ├─ Q3: B == B ✓ Correct
    │  └─ Score = 3/3 = 100%
    │
    ├─ 3. CALL LLM JUDGE ◀─── THIS IS THE KEY PART
    │  │
    │  └─ llmJudge.generateReport({
    │       questions: [...],
    │       user_answers: { 1: "B", 2: "B", 3: "B" },
    │       score: 100,
    │       topic: "Cloud"
    │     })
    │
    └─ 4. BUILD FINAL REPORT
       ├─ Combine score + LLM analysis
       └─ Return to frontend
```

## 3. LLM PIPELINE - THE 3-STAGE SYSTEM

This is the core innovation. The backend calls the LLM **3 times** in sequence:

### STAGE 1: `evaluateAnswers()` - Initial Analysis

```
INPUT TO LLM:
─────────────

System Prompt:
  "You are an expert education analyst. 
   Analyze the student's quiz performance and identify patterns.
   
   IMPORTANT:
   - Look at which wrong answers they picked
   - Do they pick the SAME wrong option multiple times? → Misconception
   - Do they pick different wrong options randomly? → Guess
   
   Return JSON with keys: score, strengths, weak_areas, error_pattern, 
   key_insight, topic_breakdown"

User Prompt:
  "STUDENT QUIZ PERFORMANCE ANALYSIS
  
   Score: 100% (3/3 correct)
   
   DETAILED ANSWER BREAKDOWN:
   [
     {
       "id": 1,
       "question": "What is IaaS?",
       "topic": "Cloud",
       "userAnswer": "B",
       "correctAnswer": "B",
       "isCorrect": true,
       "correctAnswerText": "Infrastructure as Service",
       "userAnswerText": "Infrastructure as Service",
       "allOptions": {
         "A": "Internet as Service",
         "B": "Infrastructure as Service",
         "C": "Information as System",
         "D": "Integration as Service"
       }
     },
     ... (same for Q2, Q3)
   ]
   
   TOPIC PERFORMANCE SUMMARY:
   {
     "Cloud": { "correct": 3, "total": 3 }
   }"


LLM PROCESSES:
──────────────
The LLM reads all this and analyzes:
  ✓ Student got all 3 questions correct
  ✓ All correct answers = no misconception pattern
  ✓ Strengths: Cloud topic
  ✓ Weak areas: None
  ✓ Key insight: Strong understanding


LLM RETURNS (JSON):
───────────────────
{
  "score": 100,
  "strengths": ["Cloud"],
  "weak_areas": [],
  "error_pattern": "None",
  "key_insight": "Student demonstrated strong understanding of cloud computing concepts",
  "topic_breakdown": {
    "Cloud": { "correct": 3, "total": 3 }
  }
}
```

### STAGE 1 CONTINUED: Data-Driven Validation

```
VALIDATION LAYER (in Backend):
───────────────────────────────

calculatePatternConfidence(detailedAnalysis, error_pattern):
  ├─ Get wrong answers: []  (none - all correct)
  ├─ Special case: 0 wrong answers = 1.0 confidence
  └─ confidence = 1.0

validateErrorPattern(evaluation, detailedAnalysis):
  ├─ Real confidence: 1.0
  ├─ Is 1.0 >= 0.5? YES
  └─ Return: {
       error_pattern: "None",
       error_pattern_confidence: 1.0,  ◀─ Data-driven!
       should_caution_in_feedback: false
     }

RESULT OF STAGE 1:
──────────────────
{
  "score": 100,
  "strengths": ["Cloud"],
  "weak_areas": [],
  "error_pattern": "None",
  "error_pattern_confidence": 1.0,    ◀─ Observable count
  "key_insight": "Strong understanding",
  "topic_breakdown": { "Cloud": { "correct": 3, "total": 3 } }
}
```

### STAGE 2: `getDetailedFeedback()` - Contextual Coaching

```
DECISION POINT:
───────────────
Is score >= 50%? YES (100%)
├─ Path A: LOW SCORE (< 50%) → Beginner explanation
└─ Path B: HIGH SCORE (>= 50%) → Advanced feedback ◀─ WE GO HERE


ADVANCED FEEDBACK PATH:
──────────────────────

System Prompt:
  "You are a senior architect/expert educator.
   
   IMPORTANT:
   - Reference their ACTUAL strengths shown in quiz answers
   - Provide next-level insights beyond basics
   - Suggest real-world applications of what they know
   - Discuss architectural trade-offs
   - NO markdown formatting (just plain text)"

User Prompt:
  "A student scored 100% and showed strength in: [\"Cloud\"]
   
   Topic breakdown: {\"Cloud\": {\"correct\": 3, \"total\": 3}}
   
   Give them advanced insights to deepen their expertise 
   in these areas. What should they study next?"


LLM PROCESSES:
──────────────
The LLM thinks:
  ✓ Score is 100% - they mastered this
  ✓ Perfect on all Cloud topics
  ✓ Time for advanced content
  ✓ Give real-world trade-offs and architecture patterns


LLM RETURNS (plain text):
─────────────────────────
"Excellent work! You've mastered the fundamentals of cloud 
computing. Now let's explore deeper:

### Cloud Deployment Models - Advanced Trade-offs

Since you understand Public/Private/Hybrid clouds, consider:
- Cost vs. Control: Public clouds optimize for cost but 
  reduce control. Private clouds give control at higher cost.
- Multi-cloud strategies: Using AWS for scalability, Azure 
  for compliance - how do you manage complexity?

### Service Model Trade-offs

You know IaaS, PaaS, SaaS. Now think about:
- Vendor lock-in: PaaS is easier but locks you to one provider
- Operational overhead: IaaS is flexible but needs DevOps skill
- Cold start problems: Serverless is cost-effective but has latency

### Next Level Topics

1. Multi-cloud architecture patterns
2. Cost optimization strategies
3. Disaster recovery and failover
4. Infrastructure as Code (Terraform, CloudFormation)
5. Observability and monitoring at scale"
```

### STAGE 3: `generateFinalReport()` - Roadmap & Summary

```
INPUT TO LLM:
─────────────

System Prompt:
  "You are a learning architect. Create a personalized 
   learning roadmap based on ACTUAL performance data.
   
   CRITICAL RULES:
   - overall_summary: 1-2 sentences using key_insight and score
   - detailed_breakdown: Include the feedback provided
   - personalized_roadmap: 4-5 SPECIFIC, ACTIONABLE next steps
     * For strong topics: Advanced patterns, real-world applications
     * Reference actual topic names and scores
     * Be concrete ('Explore multi-cloud patterns' not 'Study cloud')
   
   Return ONLY valid JSON"

User Prompt:
  "CREATE PERSONALIZED LEARNING ROADMAP

   Performance Analysis:
   {
     \"score\": 100,
     \"strengths\": [\"Cloud\"],
     \"weak_areas\": [],
     \"error_pattern\": \"None\",
     \"error_pattern_confidence\": 1.0,
     \"key_insight\": \"Strong understanding\",
     \"topic_breakdown\": {\"Cloud\": {\"correct\": 3, \"total\": 3}}
   }

   Detailed Feedback:
   [Advanced feedback from Stage 2 above]

   EXPLICIT TOPIC-BASED ROADMAP:
   Based on topic_breakdown:
   - Cloud (100%): Generate advanced/application steps"


LLM RETURNS (JSON):
───────────────────
{
  "overall_summary": "You scored 100% on cloud computing, 
                      demonstrating mastery of core concepts. 
                      Ready for advanced real-world applications.",
  
  "detailed_breakdown": "[Full advanced feedback from Stage 2]",
  
  "personalized_roadmap": [
    "Cloud (100%): Explore multi-cloud deployment patterns 
                   (AWS + Azure + GCP hybrid strategies)",
    
    "Cloud (100%): Study cost optimization techniques for 
                   cloud infrastructure across providers",
    
    "Cloud (100%): Learn infrastructure-as-code with Terraform 
                   and CloudFormation",
    
    "Cloud (100%): Master observability: implement distributed 
                   tracing, logging, monitoring at scale",
    
    "Advanced: Take a follow-up quiz on edge computing, 
              serverless, and cost optimization"
  ]
}
```

## 4. COMPLETE BACKEND FLOW (Code Level)

```javascript
// ========== QUIZ CONTROLLER ==========
POST /quizzes/submit
  │
  ├─ 1. Parse request
  │  const { user_answers } = req.body;
  │
  ├─ 2. Fetch questions from database
  │  const allQuestions = await dbAll(
  │    "SELECT * FROM questions WHERE id IN (...)",
  │    questionIds
  │  );
  │
  ├─ 3. Calculate score (simple count)
  │  let correctCount = 0;
  │  for (const question of allQuestions) {
  │    if (user_answers[question.id] === question.correct_option) {
  │      correctCount++;
  │    }
  │  }
  │  const score = Math.round((correctCount / allQuestions.length) * 100);
  │
  ├─ 4. Call LLM Judge ◀─── KEY STEP
  │  const llmReport = await llmJudge.generateReport({
  │    questions: allQuestions,
  │    user_answers: user_answers,
  │    score: score,
  │    topic: allQuestions[0]?.topic || 'General'
  │  });
  │
  └─ 5. Return final report
     const fullReport = {
       score: score,
       correctAnswers: correctCount,
       totalQuestions: allQuestions.length,
       ...llmReport  // Add LLM analysis
     };
     
     res.status(201).json({
       message: 'Quiz submitted...',
       resultId: result.id,
       report: fullReport
     });

// ========== LLM JUDGE (llmJudge.js) ==========
exports.generateReport = async (quizData) => {
  const { questions, user_answers, score, topic } = quizData;

  try {
    // Stage 1: Analyze performance
    console.log('Stage 1: Analyzing quiz performance...');
    const initialEvaluation = await aiService.evaluateAnswers(
      questions, 
      user_answers
    );
    // Includes: score, strengths, weak_areas, error_pattern,
    //          error_pattern_confidence (data-driven!)

    // Stage 2: Get contextual feedback
    console.log('Stage 2: Generating detailed feedback...');
    const detailedFeedback = await aiService.getDetailedFeedback(
      score,
      initialEvaluation,
      questions,
      user_answers
    );
    // Returns: Beginner explanation (low score) OR
    //         Advanced feedback (high score)

    // Stage 3: Create personalized roadmap
    console.log('Stage 3: Creating personalized roadmap...');
    const finalReport = await aiService.generateFinalReport(
      initialEvaluation, 
      detailedFeedback
    );
    // Returns: overall_summary, detailed_breakdown,
    //         personalized_roadmap

    // Return with confidence metadata
    return {
      ...finalReport,
      _metadata: {
        error_pattern_confidence: initialEvaluation.error_pattern_confidence,
        should_caution_in_feedback: initialEvaluation.should_caution_in_feedback
      }
    };

  } catch (error) {
    // Graceful fallback
    return {
      overall_summary: 'Unable to generate analysis',
      detailed_breakdown: 'Please try again',
      personalized_roadmap: ['Review course material', 'Practice']
    };
  }
}

// ========== AI SERVICES (Stage 1) ==========
exports.evaluateAnswers = async (questions, userAnswers) => {
  // 1. Build detailed analysis with question context
  const detailedAnalysis = questions.map(q => ({
    id: q.id,
    question: q.question_text,
    userAnswer: userAnswers[q.id],
    correctAnswer: q.correct_option,
    correctAnswerText: q[`option_${q.correct_option}`],
    userAnswerText: userAnswers[q.id] ? q[`option_${userAnswers[q.id]}`] : 'No answer',
    allOptions: { A: q.option_a, B: q.option_b, ... },
    isCorrect: userAnswers[q.id] === q.correct_option
  }));

  // 2. Send to LLM (WITHOUT asking for confidence)
  const systemPrompt = `You are an education analyst...
                        Return JSON with keys: score, strengths, 
                        weak_areas, error_pattern, key_insight, topic_breakdown
                        NOTE: Do NOT provide error_pattern_confidence`;

  const evaluation = await callAI(messages);

  // 3. Validate with DATA-DRIVEN confidence
  const validatedEvaluation = validateErrorPattern(
    evaluation, 
    detailedAnalysis
  );
  // This calculates real confidence from: 
  //   "How many wrong answers match the pattern?"

  return validatedEvaluation;
};

// ========== VALIDATION (Data-Driven Confidence) ==========
function calculatePatternConfidence(detailedAnalysis, errorPattern) {
  // Count observable pattern matches
  const wrongAnswers = detailedAnalysis.filter(qa => !qa.isCorrect);

  if (wrongAnswers.length === 0) return 1.0;  // All correct

  // Count which wrong answer appears most
  const answerFrequency = {};
  wrongAnswers.forEach(qa => {
    answerFrequency[qa.userAnswer] = 
      (answerFrequency[qa.userAnswer] || 0) + 1;
  });

  const mostCommon = Object.entries(answerFrequency)
    .sort((a, b) => b[1] - a[1])[0];

  // Confidence = how many match the most common
  const confidence = mostCommon[1] / wrongAnswers.length;
  return confidence;  // Data-driven, verifiable!
}
```

## 5. FRONTEND - DISPLAYING RESULTS

```
Backend returns:
{
  "report": {
    "score": 100,
    "correctAnswers": 3,
    "totalQuestions": 3,
    "strengths": ["Cloud"],
    "weak_areas": [],
    "overall_summary": "...",
    "detailed_breakdown": "...",
    "personalized_roadmap": [...]
  }
}

FRONTEND (Results.jsx):
┌──────────────────────────────────────────┐
│              Quiz Results                │
├──────────────────────────────────────────┤
│                                          │
│  Your Score: 100%                        │
│                                          │
│  Correct Answers: 3 out of 3             │
│                                          │
│  Strengths:                              │
│  • Cloud                                 │
│                                          │
│  Weak Areas:                             │
│  None identified. Great job!             │
│                                          │
├──────────────────────────────────────────┤
│  AI Evaluation Report                    │
│                                          │
│  Overall Summary:                        │
│  You scored 100%... (LLM output)         │
│                                          │
│  Detailed Breakdown:                     │
│  Excellent work! You've mastered...      │
│  (Full LLM feedback)                     │
│                                          │
│  Personalized Roadmap:                   │
│  1. Cloud (100%): Explore multi-cloud    │
│  2. Cloud (100%): Study cost optimization│
│  3. Cloud (100%): Learn Terraform        │
│  4. Cloud (100%): Master observability   │
│  5. Advanced: Take follow-up quiz        │
│                                          │
└──────────────────────────────────────────┘
```

## 6. DATABASE SCHEMA

```sql
-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP
);

-- Questions Table
CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL,  -- "A", "B", "C", or "D"
  topic TEXT NOT NULL,           -- e.g., "Cloud", "Security"
  question_type TEXT DEFAULT 'multiple_choice',
  evaluation_criteria TEXT
);

-- Quiz Results Table
CREATE TABLE quiz_results (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  quiz_timestamp TIMESTAMP,
  score REAL NOT NULL,           -- 0-100
  raw_answers TEXT NOT NULL,     -- JSON: {"1": "A", "2": "B"}
  final_report TEXT,             -- JSON: Full LLM report
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 7. DATA FLOW EXAMPLE (Actual Numbers)

```
Student takes 3-question quiz:
Q1: What is IaaS?     Student answers: B (Infrastructure...) ✓ CORRECT
Q2: What is PaaS?     Student answers: B (Platform...) ✓ CORRECT
Q3: What is CDN?      Student answers: B (Content...) ✓ CORRECT

STAGE 1 - evaluateAnswers():
──────────────────────────────
LLM sees:
  - 3/3 correct
  - All on Cloud topic
  - No pattern of wrong answers (none wrong)

LLM returns:
  {
    score: 100,
    strengths: ["Cloud"],
    weak_areas: [],
    error_pattern: "None",
    key_insight: "Strong cloud understanding"
  }

Validation (Data-driven):
  Wrong answers: [] (empty)
  Confidence: 1.0 (100% - all correct)
  
Result: 
  {
    error_pattern: "None",
    error_pattern_confidence: 1.0  ◀─ Calculated from data
  }

STAGE 2 - getDetailedFeedback():
─────────────────────────────────
Score >= 50%? YES
→ Call getAdvancedFeedback()

LLM returns:
  "Excellent! You've mastered Cloud concepts...
   Now let's explore multi-cloud strategies...
   Consider vendor lock-in trade-offs...
   Study infrastructure-as-code..."

STAGE 3 - generateFinalReport():
─────────────────────────────────
LLM uses:
  - overall_summary: Synthesize key_insight + score
  - detailed_breakdown: Include Stage 2 feedback
  - personalized_roadmap: "Cloud (100%): Explore multi-cloud..."

LLM returns:
  {
    overall_summary: "100% score shows mastery...",
    detailed_breakdown: "[Full Stage 2 feedback]",
    personalized_roadmap: [
      "Cloud (100%): Explore multi-cloud patterns",
      "Cloud (100%): Study cost optimization",
      "Cloud (100%): Learn infrastructure-as-code",
      "Cloud (100%): Master observability",
      "Advanced: Take follow-up quiz"
    ]
  }

FINAL REPORT TO FRONTEND:
──────────────────────────
{
  score: 100,
  correctAnswers: 3,
  totalQuestions: 3,
  strengths: ["Cloud"],
  weak_areas: [],
  overall_summary: "100% score shows mastery...",
  detailed_breakdown: "[Full advanced feedback]",
  personalized_roadmap: [5 items as above],
  _metadata: {
    error_pattern_confidence: 1.0,
    should_caution_in_feedback: false
  }
}

Frontend displays this beautifully to student.
```

## 8. KEY ARCHITECTURAL DECISIONS

### Why 3 LLM Calls?

```
Stage 1: Analyze performance
  ✓ LLM sees all data at once
  ✓ Identifies patterns
  ✓ Determines strengths/weaknesses

Stage 2: Contextualize feedback
  ✓ Low score → Beginner explanation
  ✓ High score → Advanced insights
  ✓ Tailored to their level

Stage 3: Create roadmap
  ✓ Synthesize Stage 1 + Stage 2
  ✓ Generate concrete next steps
  ✓ Make it actionable

Trade-off: More API calls (cost) but richer analysis per call
Benefit: Each stage can be optimized independently
```

### Why Data-Driven Confidence?

```
OLD APPROACH (Wrong):
  LLM: "I'm 0.87 confident about this pattern"
  Problem: Confidence is just another guess
  Validation based on: Unverified guess

NEW APPROACH (Correct):
  Data: "3 out of 4 wrong answers match the pattern"
  Problem: None - this is math
  Validation based on: Observable facts

Result: Validation layer is now actually reliable
```

## 9. COMPLETE REQUEST-RESPONSE CYCLE

```
1. USER TAKES QUIZ
   Frontend sends: POST /quizzes/submit
                  { user_answers: { 1: "B", 2: "B", 3: "B" } }

2. BACKEND PROCESSES
   ├─ Fetch questions from database
   ├─ Calculate score (100%)
   └─ Call LLM Judge (3-stage pipeline)

3. STAGE 1: evaluateAnswers()
   ├─ Send detailed analysis to LLM
   ├─ LLM identifies patterns
   ├─ Calculate data-driven confidence
   └─ Return: score, strengths, weak_areas, error_pattern

4. STAGE 2: getDetailedFeedback()
   ├─ Check score (100% >= 50%?)
   ├─ Call getAdvancedFeedback()
   └─ Return: Advanced insights on cloud topics

5. STAGE 3: generateFinalReport()
   ├─ Synthesize everything
   ├─ Generate personalized roadmap
   └─ Return: overall_summary, detailed_breakdown, roadmap

6. BACKEND RETURNS COMPLETE REPORT
   {
     score: 100,
     correctAnswers: 3,
     totalQuestions: 3,
     strengths: ["Cloud"],
     overall_summary: "...",
     detailed_breakdown: "...",
     personalized_roadmap: [5 items],
     _metadata: { ... }
   }

7. FRONTEND DISPLAYS RESULTS
   ├─ Show score: 100%
   ├─ Show correct answers: 3/3
   ├─ Show strengths: Cloud
   ├─ Show LLM feedback
   └─ Show personalized roadmap

8. DATABASE STORES RESULT
   INSERT INTO quiz_results
   (user_id, score, raw_answers, final_report)
   VALUES (1, 100, '{"1":"B"...}', '{full report}')
```

## 10. LLM CONFIGURATION

```
Service: HuggingFace Inference API
Model: (Configured in config.js)
Base URL: https://router.huggingface.co/v1
Temperature: 0.1 (Low - deterministic JSON output)
Max Tokens: (Configured per call)

Response Format:
- Stage 1 & 3: JSON object (enforced)
- Stage 2: Plain text (for readability)

Timeout: 30 seconds per call
Error Handling: Graceful fallback if LLM unavailable
```

This is the complete flow from quiz-taking to personalized feedback, with special emphasis on how the LLM system works at each stage!
