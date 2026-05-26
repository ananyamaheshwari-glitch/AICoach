# Application Flow Diagram

## User Registration & Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  USER VISITS http://localhost:5175                                 │
│                   │                                                 │
│                   ▼                                                 │
│  ┌─────────────────────────────┐                                   │
│  │  React Router Navigation    │                                   │
│  │  ┌──────────────┐           │                                   │
│  │  │ Login Page   │◄──────┐   │                                   │
│  │  └──────────────┘       │   │                                   │
│  │         │               │   │                                   │
│  │    "Register here"   Logout  │                                   │
│  │      link (1)          │     │                                   │
│  │         │              │     │                                   │
│  │         ▼              │     │                                   │
│  │  ┌──────────────┐      │     │                                   │
│  │  │Register Page │      │     │                                   │
│  │  │(NEW)         │      │     │                                   │
│  │  └──────────────┘      │     │                                   │
│  │         │              │     │                                   │
│  │  Form Validation:      │     │                                   │
│  │  • Username 3+ chars   │     │                                   │
│  │  • Password 6+ chars   │     │                                   │
│  │  • Passwords match     │     │                                   │
│  │         │              │     │                                   │
│  │    Submit (2)          │     │                                   │
│  │         │              │     │                                   │
│  │         ▼              │     │                                   │
│  │  ┌──────────────────────────────────────┐  (3)                  │
│  │  │ POST /auth/register                 │◄─── HTTP Request       │
│  │  │ {username, password}                │                        │
│  │  └──────────────────────────────────────┘                       │
│  │         ▼ (Backend)                     │                       │
│  │  Database: INSERT into users            │                       │
│  │  bcrypt.hash(password, 10)             │                       │
│  │         │                               │                       │
│  │         ▼                               │                       │
│  │  ┌──────────────────────────────────┐   │                       │
│  │  │ Response: {userId, message}      │   │                       │
│  │  └──────────────────────────────────┘   │                       │
│  │         │                         ▲     │                       │
│  │    Auto-login (4)                │     │                       │
│  │         │                        └─────┘                        │
│  │         ▼                                                       │
│  │  ┌──────────────────────────────────┐                          │
│  │  │ POST /auth/login                │────► (5)                  │
│  │  │ {username, password}            │    HTTP Request           │
│  │  └──────────────────────────────────┘                          │
│  │         │ (Backend)                                            │
│  │    Session Created                                             │
│  │    Cookies Set                                                 │
│  │         │                                                       │
│  │         ▼                                                       │
│  │  ┌──────────────────────────────────┐                          │
│  │  │ Response: {user}                │                          │
│  │  │ Cookies: sessionId              │                          │
│  │  └──────────────────────────────────┘                          │
│  │         │                                                       │
│  │    Redirect (6)                                                │
│  │         ▼                                                       │
│  │  ┌──────────────────────────────────┐                          │
│  │  │      Dashboard Page              │                          │
│  │  │  "Welcome, username!"            │                          │
│  │  │                                  │                          │
│  │  │  Available Topics:               │                          │
│  │  │  ┌────────────────────────┐      │                          │
│  │  │  │ Cloud (5 questions)   │      │                          │
│  │  │  └────────────────────────┘      │                          │
│  │  │  [Select Topic Button]           │                          │
│  │  │  [Logout Button]                 │◄──────── Logout (7)      │
│  │  └──────────────────────────────────┘                          │
│  │                                                                 │
│  └─────────────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quiz Taking Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  USER SELECTS TOPIC (e.g., Cloud)                                  │
│                   │                                                 │
│                   ▼                                                 │
│  ┌─────────────────────────────────────────┐                       │
│  │ GET /quizzes/questions/Cloud            │────► (8)              │
│  │ (With sessionId cookie)                 │    HTTP Request       │
│  └─────────────────────────────────────────┘                       │
│         ▼ (Backend)                                                │
│  Database Query:                                                   │
│  SELECT * FROM questions WHERE topic='Cloud'                      │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │ Response: [                             │                       │
│  │   {                                     │                       │
│  │     id: 1,                             │                       │
│  │     question_text: "...",             │                       │
│  │     option_a, b, c, d: "...",        │                       │
│  │     topic: "Cloud"                     │                       │
│  │   },                                   │                       │
│  │   ... (5 total)                        │                       │
│  │ ]                                      │                       │
│  └─────────────────────────────────────────┘                       │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │            Quiz Page Renders                               │   │
│  │                                                             │   │
│  │  Question 1/5:                                             │   │
│  │  "Which of the following is an example of IaaS?"          │   │
│  │                                                             │   │
│  │  ◯ Google App Engine                                       │   │
│  │  ◯ Amazon EC2          ◄── User selects answer (9)        │   │
│  │  ◯ Salesforce                                             │   │
│  │  ◯ Microsoft Office 365                                   │   │
│  │                                                             │   │
│  │  [Previous] [Next] [Submit Quiz]                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                                                           │
│    User answers all 5 questions...                                │
│         │                                                           │
│    Click [Submit Quiz]                                            │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────┐                       │
│  │ POST /quizzes/submit                   │────► (10)             │
│  │ {                                       │    HTTP Request       │
│  │   topic: "Cloud",                      │                       │
│  │   user_answers: {                      │                       │
│  │     "1": "B",                          │                       │
│  │     "2": "B",                          │                       │
│  │     "3": "B",                          │                       │
│  │     "4": "C",                          │                       │
│  │     "5": "B"                           │                       │
│  │   }                                     │                       │
│  │ }                                       │                       │
│  └─────────────────────────────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backend LLM Evaluation Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                  QUIZ CONTROLLER                                    │
│  quizController.submitQuiz()                                        │
│                   │                                                 │
│  (11) Calculate Score:                                              │
│  score = (correctAnswers / totalQuestions) * 100                   │
│  Example: 5 correct / 5 total = 100%                              │
│                   │                                                 │
│                   ▼                                                 │
│  ┌─────────────────────────────────────────┐                       │
│  │  Call llmJudge.evaluateQuiz()           │                       │
│  │  Pass:                                  │                       │
│  │  • userAnswers: {1: "B", 2: "B", ...}  │                       │
│  │  • correctAnswers: {1: "B", 2: "B", ...}│                       │
│  │  • topic: "Cloud"                       │                       │
│  │  • score: 100                           │                       │
│  └─────────────────────────────────────────┘                       │
│                   │                                                 │
│                   ▼                                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ LLM JUDGE - 3-STAGE PIPELINE                                │  │
│  │                                                              │  │
│  │ ┌──────────────────────────────────────────────────────┐   │  │
│  │ │ STAGE 1: evaluateAnswers()                (12)       │   │  │
│  │ │                                                       │   │  │
│  │ │ Input: userAnswers, correctAnswers, score           │   │  │
│  │ │                                                       │   │  │
│  │ │ LLM Call: "Analyze this student's performance..."  │   │  │
│  │ │                                                       │   │  │
│  │ │ LLM Response:                                        │   │  │
│  │ │ {                                                    │   │  │
│  │ │   error_pattern: "Not applicable",                 │   │  │
│  │ │   error_analysis: "Perfect performance",            │   │  │
│  │ │   topic_breakdown: {...}                            │   │  │
│  │ │ }                                                    │   │  │
│  │ │                                                       │   │  │
│  │ │ Calculate Confidence:                               │   │  │
│  │ │ confidence = (pattern_matches / total_errors) * 100│   │  │
│  │ │ With 0 errors: confidence = 0 (not applicable)     │   │  │
│  │ │                                                       │   │  │
│  │ │ Return: {analysis, confidence: 0}                  │   │  │
│  │ └──────────────────────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │                   ▼                                         │  │
│  │ ┌──────────────────────────────────────────────────────┐   │  │
│  │ │ STAGE 2: getDetailedFeedback()        (13)          │   │  │
│  │ │                                                       │   │  │
│  │ │ Input: score, error_analysis, confidence, topic     │   │  │
│  │ │                                                       │   │  │
│  │ │ Confidence Check:                                   │   │  │
│  │ │ if (confidence < 0.5) {                            │   │  │
│  │ │   use_safe_generic_feedback = true                │   │  │
│  │ │ }                                                    │   │  │
│  │ │                                                       │   │  │
│  │ │ LLM Call (if confidence >= 0.5):                   │   │  │
│  │ │ "Provide personalized feedback for 100% score..."  │   │  │
│  │ │                                                       │   │  │
│  │ │ LLM Response:                                        │   │  │
│  │ │ "Excellent performance! You demonstrated mastery..." │   │  │
│  │ │                                                       │   │  │
│  │ │ Return: {detailed_feedback, tone}                   │   │  │
│  │ └──────────────────────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │                   ▼                                         │  │
│  │ ┌──────────────────────────────────────────────────────┐   │  │
│  │ │ STAGE 3: generateFinalReport()        (14)          │   │  │
│  │ │                                                       │   │  │
│  │ │ Input: feedback, topic_breakdown, score, topic     │   │  │
│  │ │                                                       │   │  │
│  │ │ LLM Call:                                           │   │  │
│  │ │ "Create 5-step personalized roadmap..."            │   │  │
│  │ │ IMPORTANT INSTRUCTION:                             │   │  │
│  │ │ "Use topic_breakdown data to create actionable..."  │   │  │
│  │ │                                                       │   │  │
│  │ │ LLM Response:                                        │   │  │
│  │ │ {                                                    │   │  │
│  │ │   overall_summary: "...",                          │   │  │
│  │ │   detailed_breakdown: "...",                       │   │  │
│  │ │   personalized_roadmap: {                          │   │  │
│  │ │     steps: [                                        │   │  │
│  │ │       {                                             │   │  │
│  │ │         topic: "Cloud",                            │   │  │
│  │ │         score: 100,                                │   │  │
│  │ │         step: "Continue learning...",              │   │  │
│  │ │       },                                            │   │  │
│  │ │       ... (5 total steps)                          │   │  │
│  │ │     ]                                               │   │  │
│  │ │   }                                                 │   │  │
│  │ │ }                                                    │   │  │
│  │ │                                                       │   │  │
│  │ │ Attach Metadata:                                    │   │  │
│  │ │ _metadata: {                                        │   │  │
│  │ │   error_pattern_confidence: 0,                     │   │  │
│  │ │   should_caution_in_feedback: false                │   │  │
│  │ │ }                                                    │   │  │
│  │ │                                                       │   │  │
│  │ │ Return: finalReport                                 │   │  │
│  │ └──────────────────────────────────────────────────────┘   │  │
│  │                   │                                         │  │
│  │                   ▼                                         │  │
│  │ Return to submitQuiz():                                    │  │
│  │ {                                                           │  │
│  │   overall_summary: "...",                                 │  │
│  │   detailed_breakdown: "...",                              │  │
│  │   personalized_roadmap: {...},                            │  │
│  │   score: 100,                                             │  │
│  │   correctAnswers: 5,                                      │  │
│  │   totalQuestions: 5,                                      │  │
│  │   _metadata: {error_pattern_confidence: 0, ...}          │  │
│  │ }                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                   │                                             │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    ▼
         Database: INSERT quiz_results
         Stores: score, answers, report
                    │
                    ▼
         ┌─────────────────────────────────┐
         │ Response: {                     │
         │   message: "...",              │
         │   resultId: 7,                 │
         │   report: {...}                │
         │ }                              │
         └─────────────────────────────────┘
                    │
                    ▼ (15)
         ┌─────────────────────────────────┐
         │    Frontend Results Page        │
         │                                 │
         │  Score: 100%                   │
         │  Correct: 5/5                  │
         │                                 │
         │  Overall Summary:              │
         │  "Excellent performance!..."   │
         │                                 │
         │  Personalized Roadmap:         │
         │  1. Continue learning...       │
         │  2. Explore advanced topics... │
         │  3. etc.                       │
         │                                 │
         │  [Retake Quiz] [New Topic]    │
         └─────────────────────────────────┘
```

---

## Data-Driven Confidence Calculation

```
PROBLEM: How confident is the LLM about identified error patterns?

OLD APPROACH (Unreliable):
┌──────────────────────────────────────────┐
│ LLM Prompt: "Rate your confidence 0-1"   │
│ LLM Response: 0.87                       │
│ Issue: Hallucination! Could be any value │
└──────────────────────────────────────────┘

NEW APPROACH (Observable & Verifiable):
┌──────────────────────────────────────────┐
│ Count observable facts:                  │
│                                          │
│ User got 3 questions wrong:             │
│ Q1: Chose A, Correct: B (mismatch)      │
│ Q3: Chose C, Correct: B (mismatch)      │
│ Q5: Chose D, Correct: B (mismatch)      │
│                                          │
│ LLM identified pattern:                 │
│ "Student confuses B options"            │
│                                          │
│ Pattern Matching:                       │
│ - Q1: Pattern matches? YES (chose A)    │
│ - Q3: Pattern matches? YES (chose C)    │
│ - Q5: Pattern matches? YES (chose D)    │
│                                          │
│ Calculate:                               │
│ confidence = 3 matches / 3 wrong = 1.0  │
│                                          │
│ Result: CONFIDENT (observable)          │
└──────────────────────────────────────────┘

ADVANTAGE:
✓ Confidence is a simple division: verified_matches / total_wrong
✓ Impossible to hallucinate (it's just counting)
✓ Can be audited and verified manually
✓ Makes low-confidence feedback safe
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                           │
│                                                                 │
│  1. User Registration:                                          │
│     ┌────────────────────────────────────┐                     │
│     │ Password Input: "password123"      │                     │
│     │        │                           │                     │
│     │        ▼ (bcrypt.hash)            │                     │
│     │ Hashed: $2a$10$...1500chars...   │                     │
│     │        │                           │                     │
│     │        ▼ Database Storage         │                     │
│     │ Never stored in plain text ✓       │                     │
│     └────────────────────────────────────┘                     │
│                                                                 │
│  2. Session Management:                                        │
│     ┌────────────────────────────────────┐                     │
│     │ Login Success                      │                     │
│     │        │                           │                     │
│     │        ▼ Create Session            │                     │
│     │ sessionId: "abc123..."             │                     │
│     │        │                           │                     │
│     │        ▼ Store in SQLite           │                     │
│     │ db: sessions.db                    │                     │
│     │        │                           │                     │
│     │        ▼ Send to Browser           │                     │
│     │ Cookie: {                          │                     │
│     │   secure: true (production)        │                     │
│     │   httpOnly: true (no JS access)    │                     │
│     │   sameSite: strict (CSRF protect) │                     │
│     │ }                                  │                     │
│     └────────────────────────────────────┘                     │
│                                                                 │
│  3. Rate Limiting:                                             │
│     ┌────────────────────────────────────┐                     │
│     │ /auth/register endpoint            │                     │
│     │        │                           │                     │
│     │  Rate Limit: 20/hour (dev)        │                     │
│     │  Rate Limit: 5/hour (prod)        │                     │
│     │        │                           │                     │
│     │        ▼ Attacker tries 21 times  │                     │
│     │ 429 Too Many Requests ✓            │                     │
│     │ Brute force attacks prevented     │                     │
│     └────────────────────────────────────┘                     │
│                                                                 │
│  4. Input Validation:                                          │
│     ┌────────────────────────────────────┐                     │
│     │ Express-validator middleware       │                     │
│     │        │                           │                     │
│     │ For each endpoint:                 │                     │
│     │ - Username: 3-50 chars, trimmed   │                     │
│     │ - Password: 6-128 chars            │                     │
│     │ - Escape HTML entities             │                     │
│     │        │                           │                     │
│     │  Malicious input: "<script>..."   │                     │
│     │        ▼                           │                     │
│     │  Escaped: "&lt;script&gt;..."     │                     │
│     │  Stored safely ✓                   │                     │
│     └────────────────────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

The complete application flow demonstrates:
- ✅ Full user lifecycle (register → login → quiz → logout)
- ✅ MCQ-only quiz system with no open-ended questions
- ✅ 3-stage LLM evaluation pipeline with intelligent feedback
- ✅ Data-driven confidence scoring (observable, not hallucinated)
- ✅ Secure authentication with bcrypt, sessions, and rate limiting
- ✅ Session-based access control
- ✅ Comprehensive error handling and fallbacks
- ✅ Production-ready security measures
