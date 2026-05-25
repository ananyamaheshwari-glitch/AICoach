# Architecture & Workflow Documentation

## System Overview

The AI-Powered Quiz Application is a full-stack web application that combines a React frontend, Express.js backend, and Hugging Face LLM integration to deliver personalized quiz evaluation and feedback.

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        User's Browser                          │
│                  (React Frontend - Port 5173)                  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Components: Login, Dashboard, Quiz, Results             │  │
│  │ State Mgmt: React Hooks (useAuth, useState, useEffect) │  │
│  │ HTTP Client: Axios (with credentials enabled)          │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────┬─────────────────────────────────────────────────────┘
         │ HTTPS REST API + Session Cookie (connect.sid)
         │
┌────────v─────────────────────────────────────────────────────┐
│         Backend Server (Express.js - Port 3007)               │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Middleware Stack:                                        │  │
│ │ • CORS: Whitelist http://localhost:5173                │  │
│ │ • express.json(): Parse JSON payloads                  │  │
│ │ • express-session: Cookie-based auth                  │  │
│ │ • (Future) Auth guards for protected routes            │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Route Handlers:                                          │  │
│ │ • /api/auth/* → authController.js                      │  │
│ │   - POST /login: Validate credentials, create session   │  │
│ │   - POST /logout: Destroy session                       │  │
│ │   - GET /status: Check session status                   │  │
│ │                                                         │  │
│ │ • /api/quizzes/* → quizController.js                   │  │
│ │   - GET /questions/:topic: Fetch quiz questions         │  │
│ │   - POST /submit: Trigger AI evaluation                 │  │
│ │   - GET /results/:resultId: Retrieve saved result       │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Business Logic (Services):                               │  │
│ │ • aiServices.js: 3-step LLM evaluation pipeline         │  │
│ │   - evaluateAnswers(): Initial evaluation               │  │
│ │   - getDetailedFeedback(): Conditional AI feedback      │  │
│ │   - generateFinalReport(): Synthesis & roadmap          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Data Layer (database.js):                                │  │
│ │ • SQLite connection & schema initialization             │  │
│ │ • Promise-wrapped dbRun() & dbAll()                     │  │
│ │ • Seed data: 1 test user + 5 quiz questions             │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ External Integration:                                    │  │
│ │ • Hugging Face Inference API (via OpenAI SDK)           │  │
│ │   - Base URL: https://router.huggingface.co/v1          │  │
│ │   - Model: meta-llama/Llama-3.1-8B-Instruct            │  │
│ │   - Auth: Bearer token (HUGGINGFACE_HUB_TOKEN)          │  │
│ │   - Timeout: 30 seconds per request                      │  │
│ └──────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────────────────────────────┘
           │ SQL Queries (sqlite3)
           │
┌──────────v──────────────────────────────────────────────────┐
│              SQLite Database (quiz.db)                        │
│                                                               │
│  users                 questions            quiz_results     │
│  ├─ id (PK)           ├─ id (PK)            ├─ id (PK)      │
│  ├─ username (UQ)     ├─ question_text      ├─ user_id (FK) │
│  ├─ password (hash)   ├─ option_a..d        ├─ quiz_timestamp│
│  └─ created_at        ├─ correct_option     ├─ score        │
│                       ├─ topic              ├─ raw_answers  │
│                       └─ (5 seeded records) └─ final_report │
└──────────────────────────────────────────────────────────────┘
```

---

## Component Interactions

### 1. Authentication Flow

```
User Browser              Backend                Database
     │                      │                       │
     ├─ POST /login         │                       │
     ├─ (username/pwd) ────>│                       │
     │                      ├─ Query user ────────>│
     │                      │<─ User record ───────┤
     │                      │                       │
     │                      ├─ bcrypt.compare()    │
     │                      │  (pwd vs hash)       │
     │                      │                       │
     │   ┌─ Valid ─────────>│                       │
     │   │ Create session   │                       │
     │   │ req.session.user ├─ Store in sessions.db
     │   │                  │                       │
     │<──┴─ 200 OK + Cookie │                       │
     │   (connect.sid)      │                       │
     │                      │                       │
     ├─ GET /dashboard      │                       │
     ├─ (with Cookie)  ────>│                       │
     │                      ├─ Verify session      │
     │                      │  (from sessions.db) │
     │                      │                       │
     │<─ 200 OK ────────────┤                       │
     │   (Dashboard)        │                       │
```

### 2. Quiz Submission & AI Evaluation Flow

```
User Answers              Backend                    AI Service
     │                       │                            │
     ├─ POST /submit ────────>│                            │
     │   (user_answers)       │                            │
     │                        ├─ Fetch questions ──────────│
     │                        │  from database             │
     │                        │                            │
     │                        ├─ Validate answers         │
     │                        ├─ Calculate score          │
     │                        ├─ Identify strengths/weak  │
     │                        │                            │
     │                        ├─ Call 1: Initial Eval ──> │
     │                        │<─ JSON (score, patterns)──┤
     │                        │                            │
     │                        ├─ Call 2: Detailed Feedback│
     │                        │  (if score < 50: tutor)   │
     │                        │  (if score ≥ 50: architect)
     │                        │<─ Markdown feedback ──────┤
     │                        │                            │
     │                        ├─ Call 3: Final Report ──> │
     │                        │<─ JSON (summary, roadmap)─┤
     │                        │                            │
     │                        ├─ Store result ────┐       │
     │                        │  in database      │       │
     │                        │                   │       │
     │<─ 201 Created ────────────────────────────┘       │
     │   (report + resultId)  │                            │
     │                        │                            │
```

### 3. Results Retrieval Flow

```
User Browser          Backend               Database
     │                   │                      │
     ├─ GET /results/123 │                      │
     ├─ (with Cookie)──>  │                      │
     │                   ├─ Verify user session │
     │                   ├─ Query by id+user_id─>
     │                   │<─ Result record ─────┤
     │                   │                      │
     │                   ├─ Parse final_report  │
     │                   │  (JSON string)       │
     │                   │                      │
     │<─ 200 OK + Report ─┤                      │
     │   (renders) │                      │
```

---

## Data Flow Diagrams

### Quiz Submission Pipeline (Detailed)

```
Input: { user_answers: { "1": "A", "2": "C", ... } }
       req.session.user = { id: 1, username: "testuser" }

Step 1: Validation
  ├─ Check user_answers not empty ✓
  ├─ Fetch all question records from DB
  └─ Verify all question IDs exist

Step 2: Evaluation (aiServices.evaluateAnswers)
  ├─ Calculate score: (correct_count / total) * 100
  ├─ Identify strengths: topics where all Q's correct
  ├─ Identify weak_areas: topics where any Q incorrect
  └─ Call LLM with: score, strengths, weak_areas
      └─ LLM Output: { score, strengths, weak_areas, error_pattern, key_insight }

Step 3: Detailed Feedback (aiServices.getDetailedFeedback)
  ├─ Decision: score < 50% ?
  │  ├─ YES: Call LLM as "friendly tutor" for weak_areas
  │  └─ NO: Call LLM as "senior architect" for strengths
  └─ LLM Output: Markdown-formatted feedback text

Step 4: Final Report (aiServices.generateFinalReport)
  ├─ Call LLM with initial evaluation + detailed feedback
  └─ LLM Output: { overall_summary, detailed_breakdown, personalized_roadmap }

Step 5: Persistence
  ├─ Generate full report: { ...initialEvaluation, ...finalReport }
  ├─ Store in quiz_results table:
  │  ├─ user_id: 1
  │  ├─ score: 80
  │  ├─ raw_answers: JSON.stringify(user_answers)
  │  ├─ final_report: JSON.stringify(fullReport)
  │  └─ quiz_timestamp: NOW()
  └─ Return to client: { resultId, report }
```

---

## AI Service Integration (3-Call Chain)

### Call 1: Initial Evaluation
**Purpose:** Objective assessment and pattern detection

**Prompt Structure:**
```
System Prompt:
  "You are an expert quiz evaluator. 
   Respond ONLY with JSON containing:
   - score (pre-calculated)
   - strengths (pre-calculated)
   - weak_areas (pre-calculated)
   - error_pattern (AI-generated)
   - key_insight (AI-generated)"

User Prompt:
  "Here are the quiz results:
   - Questions & answers: [detailed list]
   - Score: 80%
   - Weak areas: [topics]"

Response:
{
  "score": 80,
  "strengths": ["Cloud"],
  "weak_areas": [],
  "error_pattern": "None",
  "key_insight": "Strong understanding of cloud basics."
}
```

### Call 2A: Beginner Feedback (score < 50%)
**Purpose:** Supportive tutoring on weak concepts

**System Prompt:**
```
"You are a friendly tutor. Explain core concepts 
 for the struggling topics in simple, clear, 
 encouraging language. Use Markdown."
```

**User Prompt:**
```
"I'm struggling with: [weak_areas].
 Can you explain them?"
```

### Call 2B: Advanced Feedback (score ≥ 50%)
**Purpose:** Advanced insights for high performers

**System Prompt:**
```
"You are a senior architect. For the user's 
 strong topics, provide advanced insights, 
 real-world trade-offs, best practices."
```

**User Prompt:**
```
"I did well on: [strengths].
 Give me advanced feedback."
```

### Call 3: Final Report
**Purpose:** Synthesis and actionable roadmap

**System Prompt:**
```
"You are an AI career coach. Synthesize the 
 performance data and feedback into a structured report:
 - overall_summary: Concise paragraph
 - detailed_breakdown: Full feedback text
 - personalized_roadmap: 3-4 actionable next steps"
```

**Output JSON:**
```json
{
  "overall_summary": "...",
  "detailed_breakdown": "...",
  "personalized_roadmap": [
    "Deep dive into Cloud Networking concepts",
    "Practice real-world scenario questions",
    ...
  ]
}
```

---

## Database Schema

### users Table
```sql
CREATE TABLE users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT NOT NULL UNIQUE,
  password        TEXT NOT NULL,              -- bcryptjs hash
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Data:**
```
id=1, username='testuser', password='$2a$10$...', created_at='2026-05-25 10:00:00'
```

### questions Table
```sql
CREATE TABLE questions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text   TEXT NOT NULL,
  option_a        TEXT NOT NULL,
  option_b        TEXT NOT NULL,
  option_c        TEXT NOT NULL,
  option_d        TEXT NOT NULL,
  correct_option  TEXT NOT NULL CHECK(correct_option IN ('A','B','C','D')),
  topic           TEXT NOT NULL
);
```

**Sample Data:**
```
id=1, question_text='Which is IaaS?', option_a='...', ..., correct_option='B', topic='Cloud'
```

### quiz_results Table
```sql
CREATE TABLE quiz_results (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,
  quiz_timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  score           REAL NOT NULL,              -- 0-100
  raw_answers     TEXT NOT NULL,              -- JSON: {"1":"A","2":"C",...}
  final_report    TEXT,                       -- JSON: full report object
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Sample Data:**
```
id=1, user_id=1, quiz_timestamp='2026-05-25 10:30:00', score=80, 
raw_answers='{"1":"B","2":"B","3":"C","4":"B","5":"B"}',
final_report='{"score":80,"strengths":["Cloud"],"weak_areas":[],...}'
```

---

## Middleware Stack

### CORS Middleware
```javascript
app.use(cors({
  origin: 'http://localhost:5173',  // Allow frontend
  credentials: true                  // Allow cookies
}));
```

### Body Parser
```javascript
app.use(express.json());             // Parse JSON payloads
```

### Session Management
```javascript
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './db'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,     // 24 hours
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    httpOnly: true                    // Prevent JS access (XSS protection)
  }
}));
```

### Route Protection (Implicit)
The routes currently use `req.session.user` to verify authentication. Future improvement: add explicit middleware.

---

## Frontend Architecture

### Component Hierarchy
```
App
├── Login
│   ├── username input
│   ├── password input
│   └── login button
├── Dashboard
│   ├── welcome message
│   └── "Start Quiz" button
├── Quiz
│   ├── question display
│   ├── option buttons
│   └── submit button
└── Results
    ├── score card
    ├── key insight
    ├── strengths section
    ├── weak areas section
    └── personalized roadmap
```

### State Management
- **useAuth hook:** Manages user auth state (fetches from `/api/auth/status` on mount)
- **Component State:** useState for form inputs, loading states
- **API Calls:** Axios instance with base URL and credentials enabled

### Routing
```javascript
/login          → Login component (unauthenticated only)
/dashboard      → Dashboard component (authenticated only)
/quiz/:topic    → Quiz component (authenticated only)
/results/:id    → Results component (authenticated only)
*               → Redirect to /dashboard or /login based on auth
```

---

## Deployment Considerations

### Environment Configuration
The app reads from `.env` (backend) and uses build-time config (frontend):

**Backend .env Variables:**
```
PORT                     (default: 3007)
NODE_ENV                 (development or production)
SESSION_SECRET           (should be strong random string)
CORS_ORIGIN              (whitelist frontend URL)
HUGGINGFACE_HUB_TOKEN    (required - fails to start without it)
AI_MODEL                 (default: meta-llama/Llama-3.1-8B-Instruct)
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `SESSION_SECRET` (not fallback)
- [ ] Enable `secure: true` on cookies (requires HTTPS)
- [ ] Configure `CORS_ORIGIN` to production frontend URL
- [ ] Use environment-specific `HUGGINGFACE_HUB_TOKEN`
- [ ] Build frontend with `npm run build` and serve dist/
- [ ] Add rate limiting on auth endpoints
- [ ] Add CSRF protection middleware
- [ ] Configure request size limits
- [ ] Enable logging/monitoring
- [ ] Set up database backups for quiz.db

---

## Error Handling

### Frontend
- Try-catch in login/logout handlers
- API error responses displayed to user
- Loading states managed via component state

### Backend
- Promise-based error handling in controllers
- Global error logging (enhanced with message and details)
- Non-production environments include error.message in responses
- Production mode shows generic error messages

### LLM Service
- 30-second timeout per request
- Error classification: timeout vs. network vs. parse error
- Fallback prompts if AI response is invalid
- Console logging of original AI response for debugging

---

## Security Architecture

### Authentication & Authorization
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ Server-side session management with httpOnly cookies
- ✅ User-scoped data access (can't view others' results)
- ⚠️ **TODO:** Add explicit auth middleware to protected routes
- ⚠️ **TODO:** Add rate limiting (prevent brute-force attacks)

### Transport Security
- ✅ CORS whitelist (origin validation)
- ✅ Session cookies httpOnly (XSS protection)
- ⚠️ **TODO:** Secure flag required in production (HTTPS only)
- ⚠️ **TODO:** Add HSTS header

### Data Protection
- ✅ Environment variables for secrets (.env)
- ✅ Passwords hashed before storage
- ✅ Session data stored server-side (sessions.db)
- ⚠️ **TODO:** Add input validation for quiz submissions
- ⚠️ **TODO:** Request size limits

### API Security
- ✅ CORS configured
- ✅ JSON payloads only
- ⚠️ **TODO:** Add CSRF protection
- ⚠️ **TODO:** Request rate limiting
- ⚠️ **TODO:** SQL injection protection (currently using parameterized queries ✅)

---

## Performance Considerations

### Backend
- SQLite suitable for single-instance deployment (< 10K concurrent users)
- LLM API calls are the slowest component (~3-10 seconds per quiz)
- Consider caching LLM responses for identical questions
- Session store in SQLite (not ideal for distributed systems)

### Frontend
- React with Vite for fast builds
- Tailwind CSS purges unused styles
- No code splitting currently (bundle size ~100KB)
- Could implement lazy loading for components

### Database
- Simple queries benefit from SQLite's in-memory cache
- Current schema has no complex joins
- Consider adding indexes if quiz_results table grows large

---

## Future Architecture Improvements

1. **Distributed Sessions:** Move from SQLite to Redis for production
2. **Caching Layer:** Add Redis for LLM response caching
3. **API Gateway:** Add rate limiting and monitoring
4. **Async Processing:** Use job queue (Bull/RabbitMQ) for long-running LLM calls
5. **Multi-tenancy:** Support multiple organizations
6. **Real-time Updates:** Add WebSocket for live progress updates
7. **Analytics:** Add event tracking and dashboards

---

## Troubleshooting Guide

### Backend Won't Start
- ✓ Check HUGGINGFACE_HUB_TOKEN is set in .env
- ✓ Ensure port 3007 is not in use
- ✓ Check Node.js version (18+)

### Quiz Submission Fails
- ✓ Verify Hugging Face API token is valid
- ✓ Check internet connection to HF API
- ✓ Review backend logs for LLM errors
- ✓ Ensure all questions exist in DB

### Results Not Loading
- ✓ Check user is authenticated (session valid)
- ✓ Verify resultId exists in database
- ✓ Ensure user_id matches logged-in user

### CORS Errors
- ✓ Check CORS_ORIGIN matches frontend URL
- ✓ Verify credentials flag enabled in axios config
- ✓ Check cookie domain settings

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-25
