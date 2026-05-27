# Services Architecture Documentation

## Overview

The application has been reorganized to follow a **services-based architecture** pattern, which improves code organization, readability, and maintainability.

## Backend Services

Located in: `backend/services/`

### 1. authService.js
**Purpose:** Handle authentication and session management

**Key Methods:**
- `registerUser(username, password)` - Create new user account
- `loginUser(username, password)` - Authenticate user credentials
- `getSessionInfo(session, config)` - Calculate session expiration details

**Usage:**
```javascript
const result = await AuthService.registerUser('john', 'SecurePass123');
if (result.success) {
  console.log('User ID:', result.userId);
}
```

### 2. quizService.js
**Purpose:** Handle quiz operations and evaluation

**Key Methods:**
- `getQuestionsByTopic(topic)` - Fetch quiz questions
- `evaluateQuiz(allQuestions, userAnswers)` - Score the quiz
- `generateReport(questions, answers, evaluation, topic)` - Create AI feedback
- `saveResult(userId, userAnswers, report)` - Store result in database
- `getResultById(resultId, userId)` - Retrieve saved result

### 3. llmJudge.js
**Purpose:** Generate AI-powered feedback using Hugging Face API

**Generates:**
- Overall assessment of performance
- Identified strengths
- Weak areas for improvement
- Personalized learning roadmap

## Frontend Services

Located in: `frontend/src/services/`

### 1. authService.js
**Purpose:** Handle authentication API calls

**Key Methods:**
- `register(username, password)` - Call registration endpoint
- `login(username, password)` - Call login endpoint
- `logout()` - Call logout endpoint
- `checkStatus()` - Get current session status

### 2. quizService.js
**Purpose:** Handle quiz-related API calls

**Key Methods:**
- `getQuestionsByTopic(topic)` - Fetch questions for quiz
- `submitQuiz(userAnswers)` - Submit quiz and get evaluation
- `getResult(resultId)` - Retrieve saved result

### 3. sessionService.js
**Purpose:** Handle session monitoring and timeout

**Key Methods:**
- `formatRemainingTime(ms)` - Convert milliseconds to readable format
- `checkSession()` - Get current session status with warnings
- `extendSession()` - Extend current session

## Benefits of Services Architecture

1. **Separation of Concerns** - Business logic separated from HTTP handling
2. **Reusability** - Services can be used across multiple components
3. **Testability** - Easy to unit test services independently
4. **Maintainability** - Changes isolated to service files
5. **Scalability** - Easy to extend and modify
6. **Consistency** - Unified error handling and response formats

## Data Flow Examples

### User Registration
```
Component (Register.jsx)
   -> AuthService.register()
   -> API POST /api/auth/register
   -> authController.register()
   -> AuthService.registerUser()
   -> Database
```

### Quiz Submission
```
Component (Quiz.jsx)
   -> QuizService.submitQuiz()
   -> API POST /api/quizzes/submit
   -> quizController.submitQuiz()
   -> QuizService.evaluateQuiz()
   -> QuizService.generateReport()
   -> QuizService.saveResult()
   -> Database
```

### Session Monitoring
```
Hook (useSessionTimeout.js)
   -> SessionService.checkSession() [every 60s]
   -> API GET /auth/status
   -> authController.checkStatus()
   -> AuthService.getSessionInfo()
   -> Return expiration status
```

## File Organization

```
backend/
  services/
  - authService.js         (user auth logic)
  - quizService.js         (quiz evaluation)
  - llmJudge.js           (AI feedback)
  controllers/
  - authController.js      (uses authService)
  - quizController.js      (uses quizService)

frontend/src/
  services/
  - authService.js         (auth API calls)
  - quizService.js         (quiz API calls)
  - sessionService.js      (session monitoring)
  components/
  - Login, Register, Quiz, Results
  hooks/
  - useAuth, useSessionTimeout
```

## Best Practices

1. Keep services stateless
2. Use consistent response formats
3. Handle errors in services
4. Document all service methods
5. Write unit tests for services
6. Use descriptive method names

## Key Improvements

- Better code organization
- Easier to find and modify business logic
- Reduced code duplication
- Improved error handling consistency
- Better testability
- Enhanced readability and maintainability
