# Backend Services

This folder contains all business logic and service layer code that handles operations for the application.

## Services Overview

### `authService.js`
Handles all authentication-related operations:
- User registration with password hashing
- User login with credential validation
- Session information management
- Session timeout calculation and warning checks

**Main Methods:**
- `registerUser(username, password)` - Register new user
- `loginUser(username, password)` - Authenticate user
- `getSessionInfo(session, config)` - Get current session details

### `quizService.js`
Manages all quiz-related operations:
- Fetching questions by topic
- Evaluating quiz answers
- Generating AI-powered feedback reports
- Storing quiz results

**Main Methods:**
- `getQuestionsByTopic(topic)` - Retrieve questions for a quiz topic
- `evaluateQuiz(questions, answers)` - Calculate quiz score and track answers
- `generateReport(questions, answers, evaluation, topic)` - Generate AI feedback
- `saveResult(userId, answers, report)` - Store quiz result in database
- `getResultById(resultId, userId)` - Retrieve saved quiz result

### `llmJudge.js`
Generates AI-powered feedback and analysis using the Hugging Face API:
- Analyzes user performance
- Identifies strengths and weak areas
- Creates personalized learning roadmaps
- Provides detailed feedback on quiz responses

## Architecture Benefits

- **Separation of Concerns**: Business logic is separated from HTTP controllers
- **Reusability**: Services can be used across multiple controllers if needed
- **Testability**: Easy to unit test service methods independently
- **Maintainability**: Logic changes are isolated to service files
- **Scalability**: Easier to refactor and extend functionality

## Usage Example

```javascript
const AuthService = require('../services/authService');

// In a controller
const result = await AuthService.loginUser(username, password);
if (result.success) {
  req.session.user = result.user;
  res.json(result);
}
```
