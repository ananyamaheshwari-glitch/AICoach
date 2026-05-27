# Frontend Services

This folder contains all API communication and business logic services for the frontend. These services act as a bridge between React components and the backend API.

## Services Overview

### `authService.js`
Handles all authentication-related API calls and operations:
- User registration
- User login
- Logout functionality
- Session status checking

**Main Methods:**
- `register(username, password)` - Register new user account
- `login(username, password)` - Authenticate user
- `logout()` - Logout current user
- `checkStatus()` - Get current session status

**Returns:** `{ success: boolean, data/message, errors }`

### `quizService.js`
Manages all quiz-related API operations:
- Fetching quiz questions
- Submitting quiz answers
- Retrieving quiz results

**Main Methods:**
- `getQuestionsByTopic(topic)` - Fetch questions for a quiz topic
- `submitQuiz(userAnswers)` - Submit quiz answers and get evaluation
- `getResult(resultId)` - Retrieve saved quiz result and feedback

**Returns:** `{ success: boolean, questions/report/resultId, message }`

### `sessionService.js`
Handles session management and monitoring:
- Session status checking
- Time remaining calculations
- Session extension
- Timeout warning logic

**Main Methods:**
- `formatRemainingTime(ms)` - Format milliseconds to readable time (e.g., "5m 30s")
- `checkSession()` - Get current session status with remaining time
- `extendSession()` - Extend current session

**Returns:** `{ isActive: boolean, remaining, formattedTime, isExpiringSoon, ... }`

## Architecture Benefits

- **Centralized API Calls**: All backend communication goes through these services
- **Error Handling**: Consistent error handling across all API operations
- **Response Normalization**: All services return consistent response format
- **Reusability**: Components can reuse services without duplicating code
- **Maintainability**: API changes are made in one place
- **Testability**: Easy to mock services for component testing

## Usage Example

```javascript
import QuizService from '../services/quizService';

// In a React component
const handleSubmit = async (answers) => {
  const result = await QuizService.submitQuiz(answers);
  if (result.success) {
    navigate(`/results/${result.resultId}`);
  } else {
    setError(result.message);
  }
};
```

## Response Format

All services follow a consistent response format:

```javascript
{
  success: boolean,
  data: any,           // Successful response data
  message: string,     // Error message if success is false
  error: any          // Detailed error information
}
```
