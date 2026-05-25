# Test Cases Documentation

## Test Strategy

This document outlines comprehensive test cases for the AI-Powered Quiz Application, covering unit tests, integration tests, and end-to-end (E2E) scenarios.

**Test Scope:** Authentication, Quiz Submission, AI Evaluation, Results Retrieval, Data Persistence

---

## 1. Authentication Tests

### Test Case 1.1: Successful Login
**ID:** `AUTH-001`  
**Objective:** Verify user can log in with valid credentials  
**Precondition:** User "testuser" exists with password "password123"  
**Steps:**
1. Navigate to login page
2. Enter username: `testuser`
3. Enter password: `password123`
4. Click "Login" button

**Expected Result:**
- Status code: 200 OK
- Response contains user object: `{ id: 1, username: "testuser" }`
- Session cookie `connect.sid` is set (httpOnly)
- User redirected to `/dashboard`
- Welcome message displays: "Welcome, testuser!"

**Actual Result:** ✓ PASS

---

### Test Case 1.2: Login with Invalid Password
**ID:** `AUTH-002`  
**Objective:** Verify login fails with wrong password  
**Precondition:** User "testuser" exists  
**Steps:**
1. Navigate to login page
2. Enter username: `testuser`
3. Enter password: `wrongpassword`
4. Click "Login" button

**Expected Result:**
- Status code: 401 Unauthorized
- Response message: `"Invalid credentials."`
- No session cookie set
- User remains on login page
- Error message displays to user

**Actual Result:** ✓ PASS

---

### Test Case 1.3: Login with Non-existent Username
**ID:** `AUTH-003`  
**Objective:** Verify login fails with non-existent user  
**Steps:**
1. Navigate to login page
2. Enter username: `nonexistentuser`
3. Enter password: `password123`
4. Click "Login" button

**Expected Result:**
- Status code: 401 Unauthorized
- Response message: `"Invalid credentials."`
- No session created
- Error message displays

**Actual Result:** ✓ PASS

---

### Test Case 1.4: Login with Missing Username
**ID:** `AUTH-004`  
**Objective:** Verify login fails without username  
**Steps:**
1. Navigate to login page
2. Leave username empty
3. Enter password: `password123`
4. Click "Login" button

**Expected Result:**
- Status code: 400 Bad Request
- Response message: `"Username and password are required."`

**Actual Result:** ✓ PASS

---

### Test Case 1.5: Login with Missing Password
**ID:** `AUTH-005`  
**Objective:** Verify login fails without password  
**Steps:**
1. Navigate to login page
2. Enter username: `testuser`
3. Leave password empty
4. Click "Login" button

**Expected Result:**
- Status code: 400 Bad Request
- Response message: `"Username and password are required."`

**Actual Result:** ✓ PASS

---

### Test Case 1.6: Successful Logout
**ID:** `AUTH-006`  
**Objective:** Verify user session is destroyed on logout  
**Precondition:** User is logged in  
**Steps:**
1. Click "Logout" button
2. Verify redirect to login page
3. Attempt to access `/dashboard` directly

**Expected Result:**
- Status code: 200 (logout endpoint)
- Session cookie is cleared
- Redirect to `/login`
- Accessing protected routes redirects to login

**Actual Result:** ✓ PASS

---

### Test Case 1.7: Check Auth Status When Logged In
**ID:** `AUTH-007`  
**Objective:** Verify session status endpoint works for authenticated user  
**Precondition:** User is logged in  
**Steps:**
1. Call `GET /api/auth/status` with session cookie

**Expected Result:**
- Status code: 200 OK
- Response: `{ "user": { "id": 1, "username": "testuser" } }`

**Actual Result:** ✓ PASS

---

### Test Case 1.8: Check Auth Status When Not Logged In
**ID:** `AUTH-008`  
**Objective:** Verify session status endpoint returns 401 for unauthenticated user  
**Steps:**
1. Call `GET /api/auth/status` without session cookie

**Expected Result:**
- Status code: 401 Unauthorized
- Response: `{ "user": null }`

**Actual Result:** ✓ PASS

---

### Test Case 1.9: Session Persistence After Page Refresh
**ID:** `AUTH-009`  
**Objective:** Verify session persists after page refresh  
**Precondition:** User is logged in  
**Steps:**
1. User logged in, on dashboard
2. Refresh the page
3. Verify user is still logged in

**Expected Result:**
- Session cookie is sent with refresh request
- Backend validates session
- User remains authenticated
- No re-login required

**Actual Result:** ✓ PASS

---

### Test Case 1.10: Session Timeout (24 hours)
**ID:** `AUTH-010`  
**Objective:** Verify session expires after 24 hours  
**Precondition:** User is logged in  
**Steps:**
1. Create session
2. Wait 24+ hours (simulated in testing)
3. Attempt to access protected resource

**Expected Result:**
- Session expires
- Request returns 401 Unauthorized
- User redirected to login

**Actual Result:** ⚠️ MANUAL - Use time travel in testing

---

## 2. Quiz Retrieval Tests

### Test Case 2.1: Fetch Questions by Topic - Valid Topic
**ID:** `QUIZ-001`  
**Objective:** Verify quiz questions are retrieved correctly  
**Precondition:** User is authenticated; "Cloud" topic has 5 seeded questions  
**Steps:**
1. Call `GET /api/quizzes/questions/cloud`

**Expected Result:**
- Status code: 200 OK
- Response is array with 5 question objects
- Each object contains: id, question_text, option_a, option_b, option_c, option_d, topic
- No correct_option in response (should be hidden from frontend)

**Sample Response:**
```json
[
  {
    "id": 1,
    "question_text": "Which of the following is an example of IaaS?",
    "option_a": "Google App Engine",
    "option_b": "Amazon EC2",
    "option_c": "Salesforce",
    "option_d": "Microsoft Office 365",
    "topic": "Cloud"
  },
  ...
]
```

**Actual Result:** ✓ PASS

---

### Test Case 2.2: Fetch Questions by Topic - Invalid Topic
**ID:** `QUIZ-002`  
**Objective:** Verify proper error when topic doesn't exist  
**Precondition:** User is authenticated  
**Steps:**
1. Call `GET /api/quizzes/questions/nonexistent`

**Expected Result:**
- Status code: 404 Not Found
- Response message: `"No questions found for this topic."`

**Actual Result:** ✓ PASS

---

### Test Case 2.3: Fetch Questions - Case Insensitive
**ID:** `QUIZ-003`  
**Objective:** Verify topic matching is case-insensitive  
**Precondition:** User is authenticated  
**Steps:**
1. Call `GET /api/quizzes/questions/CLOUD`
2. Call `GET /api/quizzes/questions/Cloud`
3. Call `GET /api/quizzes/questions/cloud`

**Expected Result:**
- All three requests return the same 5 questions
- Case-insensitive matching works

**Actual Result:** ✓ PASS

---

### Test Case 2.4: Fetch Questions Without Authentication
**ID:** `QUIZ-004`  
**Objective:** Verify unauthenticated users cannot fetch questions  
**Steps:**
1. Call `GET /api/quizzes/questions/cloud` without session cookie

**Expected Result:**
- Status code: 401 Unauthorized (if auth middleware is added)
- Or returns questions (current implementation doesn't enforce auth)

**Actual Result:** ⚠️ CURRENTLY NO AUTH ENFORCEMENT - Should add middleware

---

## 3. Quiz Submission & AI Evaluation Tests

### Test Case 3.1: Submit Quiz with All Correct Answers
**ID:** `EVAL-001`  
**Objective:** Verify high score quiz evaluation  
**Precondition:** User is authenticated; knows all correct answers  
**Steps:**
1. Call `POST /api/quizzes/submit` with all correct answers
```json
{
  "user_answers": {
    "1": "B",
    "2": "B",
    "3": "C",
    "4": "B",
    "5": "B"
  }
}
```

**Expected Result:**
- Status code: 201 Created
- Response contains:
  - resultId (integer)
  - report object with:
    - score: 100
    - strengths: ["Cloud"]
    - weak_areas: []
    - error_pattern: "None"
    - key_insight: (AI-generated)
    - overall_summary: (AI-generated)
    - detailed_breakdown: (AI-generated, positive tone)
    - personalized_roadmap: [3-4 advanced next steps]

**Actual Result:** ✓ PASS

---

### Test Case 3.2: Submit Quiz with All Wrong Answers
**ID:** `EVAL-002`  
**Objective:** Verify low score quiz evaluation and tutoring feedback  
**Precondition:** User is authenticated  
**Steps:**
1. Call `POST /api/quizzes/submit` with all wrong answers
```json
{
  "user_answers": {
    "1": "A",
    "2": "A",
    "3": "A",
    "4": "A",
    "5": "A"
  }
}
```

**Expected Result:**
- Status code: 201 Created
- Response contains:
  - resultId
  - score: 0
  - weak_areas: ["Cloud"]
  - strengths: []
  - detailed_breakdown: (AI-generated tutor tone, encouraging)
  - personalized_roadmap: [3-4 foundational learning steps]

**Actual Result:** ✓ PASS

---

### Test Case 3.3: Submit Quiz with Mixed Answers (60% correct)
**ID:** `EVAL-003`  
**Objective:** Verify medium score quiz evaluation  
**Precondition:** User is authenticated  
**Steps:**
1. Call `POST /api/quizzes/submit` with 3 correct, 2 wrong answers
```json
{
  "user_answers": {
    "1": "B",
    "2": "C",
    "3": "C",
    "4": "C",
    "5": "B"
  }
}
```

**Expected Result:**
- Status code: 201 Created
- score: 60
- Triggers Call 2A (tutor feedback, score < 50%) - Actually 60% > 50%, so architect feedback
- report includes both strengths and weak_areas

**Actual Result:** ✓ PASS

---

### Test Case 3.4: Submit Quiz with Empty Answers
**ID:** `EVAL-004`  
**Objective:** Verify validation rejects empty submissions  
**Precondition:** User is authenticated  
**Steps:**
1. Call `POST /api/quizzes/submit` with empty user_answers
```json
{
  "user_answers": {}
}
```

**Expected Result:**
- Status code: 400 Bad Request
- Response message: `"No answers provided."`

**Actual Result:** ✓ PASS

---

### Test Case 3.5: Submit Quiz with Partial Answers
**ID:** `EVAL-005`  
**Objective:** Verify system handles incomplete quiz submission  
**Precondition:** User is authenticated; 5 questions exist  
**Steps:**
1. Call `POST /api/quizzes/submit` with only 3 answers
```json
{
  "user_answers": {
    "1": "B",
    "2": "B",
    "3": "C"
  }
}
```

**Expected Result:**
- Status code: ??? (depends on design decision)
- Option 1: 400 Bad Request (require all answers)
- Option 2: 201 OK with partial score (questions not answered = wrong)

**Current Behavior:** Option 2 - calculates score based on provided answers

**Actual Result:** ⚠️ AMBIGUOUS - Consider adding validation for all questions

---

### Test Case 3.6: Submit Quiz with Invalid Question IDs
**ID:** `EVAL-006`  
**Objective:** Verify error handling for non-existent questions  
**Precondition:** User is authenticated  
**Steps:**
1. Call `POST /api/quizzes/submit` with invalid question IDs
```json
{
  "user_answers": {
    "999": "A",
    "1000": "B"
  }
}
```

**Expected Result:**
- Status code: 404 Not Found
- Response message: `"One or more questions not found."`

**Actual Result:** ✓ PASS

---

### Test Case 3.7: Submit Quiz Without Authentication
**ID:** `EVAL-007`  
**Objective:** Verify unauthenticated submission fails  
**Steps:**
1. Call `POST /api/quizzes/submit` without session cookie

**Expected Result:**
- Status code: 401 Unauthorized or 500 (auth not enforced)

**Actual Result:** ⚠️ SHOULD RETURN 401 - Add auth middleware

---

### Test Case 3.8: AI Service Timeout Handling
**ID:** `EVAL-008`  
**Objective:** Verify graceful handling of AI service timeout  
**Precondition:** HF API unreachable or slow (simulate)  
**Steps:**
1. Disable network to HF API
2. Submit quiz

**Expected Result:**
- Status code: 500 Internal Server Error
- Response message indicates AI service failure
- User sees friendly error message
- Request timeout after 30 seconds

**Actual Result:** ✓ PASS (with 30s timeout configured)

---

### Test Case 3.9: Invalid AI Response JSON
**ID:** `EVAL-009`  
**Objective:** Verify handling of malformed AI responses  
**Precondition:** AI service returns non-JSON or incomplete JSON  
**Steps:**
1. Mock AI service to return invalid JSON
2. Submit quiz

**Expected Result:**
- Status code: 500 Internal Server Error
- Error message: `"AI returned an invalid JSON format."`
- Original response logged for debugging

**Actual Result:** ✓ PASS

---

### Test Case 3.10: LLM Call 2 - Low Score (< 50%) Triggers Tutoring
**ID:** `EVAL-010`  
**Objective:** Verify LLM Call 2A executes for low scores  
**Steps:**
1. Submit quiz with < 50% correct answers
2. Verify Call 2 uses "friendly tutor" prompt
3. Check feedback tone is encouraging

**Expected Result:**
- Detailed feedback contains beginner-friendly explanations
- Simple language, non-technical
- Encouragement and support evident

**Actual Result:** ✓ PASS

---

### Test Case 3.11: LLM Call 2 - High Score (≥ 50%) Triggers Advanced Feedback
**ID:** `EVAL-011`  
**Objective:** Verify LLM Call 2B executes for high scores  
**Steps:**
1. Submit quiz with ≥ 50% correct answers
2. Verify Call 2 uses "senior architect" prompt
3. Check feedback includes advanced insights

**Expected Result:**
- Detailed feedback contains advanced concepts
- References real-world scenarios
- Discusses trade-offs and best practices

**Actual Result:** ✓ PASS

---

## 4. Results Retrieval Tests

### Test Case 4.1: Retrieve Result by Valid ID (Owner)
**ID:** `RESULTS-001`  
**Objective:** Verify user can retrieve their own result  
**Precondition:** User is authenticated; result exists with user_id=1  
**Steps:**
1. Call `GET /api/quizzes/results/1` with session cookie

**Expected Result:**
- Status code: 200 OK
- Response contains full report object:
  - score
  - strengths
  - weak_areas
  - error_pattern
  - key_insight
  - overall_summary
  - detailed_breakdown
  - personalized_roadmap

**Actual Result:** ✓ PASS

---

### Test Case 4.2: Attempt Retrieve Result of Another User
**ID:** `RESULTS-002`  
**Objective:** Verify user cannot access other users' results  
**Precondition:** User 1 is authenticated; result ID 2 belongs to user 2  
**Steps:**
1. User 1 calls `GET /api/quizzes/results/2`

**Expected Result:**
- Status code: 404 Not Found
- Response message: `"Result not found or you do not have permission to view it."`

**Actual Result:** ✓ PASS

---

### Test Case 4.3: Retrieve Non-existent Result
**ID:** `RESULTS-003`  
**Objective:** Verify 404 for missing result  
**Precondition:** User is authenticated  
**Steps:**
1. Call `GET /api/quizzes/results/999`

**Expected Result:**
- Status code: 404 Not Found
- Response message: `"Result not found or you do not have permission to view it."`

**Actual Result:** ✓ PASS

---

### Test Case 4.4: Retrieve Result Without Authentication
**ID:** `RESULTS-004`  
**Objective:** Verify unauthenticated access fails  
**Steps:**
1. Call `GET /api/quizzes/results/1` without session cookie

**Expected Result:**
- Status code: 401 Unauthorized or 500 (depends on middleware)

**Actual Result:** ⚠️ SHOULD RETURN 401 - Add auth middleware

---

### Test Case 4.5: Result Contains Valid JSON Report
**ID:** `RESULTS-005`  
**Objective:** Verify report data structure is consistent  
**Precondition:** Result exists  
**Steps:**
1. Retrieve result
2. Validate JSON structure
3. Check all required fields present

**Expected Result:**
- final_report is valid JSON
- Contains keys: overall_summary, detailed_breakdown, personalized_roadmap
- personalized_roadmap is array of strings
- No null/undefined fields

**Actual Result:** ✓ PASS

---

## 5. Data Persistence Tests

### Test Case 5.1: Quiz Result Stored in Database
**ID:** `DB-001`  
**Objective:** Verify result is persisted correctly  
**Precondition:** Quiz submitted successfully  
**Steps:**
1. Submit quiz
2. Query quiz_results table directly
3. Verify record exists with correct data

**Expected Result:**
- New row created in quiz_results table
- user_id: 1
- score: matches calculated score
- raw_answers: valid JSON with user's answers
- final_report: valid JSON with full report
- quiz_timestamp: recent timestamp

**Actual Result:** ✓ PASS

---

### Test Case 5.2: Multiple Results Per User
**ID:** `DB-002`  
**Objective:** Verify user can have multiple quiz attempts  
**Precondition:** User is authenticated  
**Steps:**
1. User submits quiz
2. User submits quiz again (different answers)
3. Query results for user_id=1

**Expected Result:**
- Two distinct rows in quiz_results
- Both belong to user_id=1
- Different resultIds
- Different quiz_timestamps
- Each has its own report

**Actual Result:** ✓ PASS

---

### Test Case 5.3: Data Isolation Between Users
**ID:** `DB-003`  
**Objective:** Verify one user's data doesn't leak to another  
**Steps:**
1. User A submits quiz (resultId=1)
2. User B submits quiz (resultId=2)
3. User A attempts to retrieve resultId=2

**Expected Result:**
- User A cannot see User B's result
- 404 error returned
- Data remains isolated

**Actual Result:** ✓ PASS

---

### Test Case 5.4: Database Constraints
**ID:** `DB-004`  
**Objective:** Verify database schema constraints work  
**Steps:**
1. Attempt to insert quiz_result with null user_id
2. Attempt to insert question with invalid correct_option

**Expected Result:**
- Constraint violations rejected by database
- Appropriate error returned

**Actual Result:** ✓ PASS

---

## 6. End-to-End (E2E) Tests

### Test Case 6.1: Complete User Journey
**ID:** `E2E-001`  
**Objective:** Full workflow from login to results  
**Steps:**
1. Navigate to app
2. Log in as testuser
3. See welcome message
4. Click "Start Quiz"
5. Answer all 5 questions
6. Submit quiz
7. View results report
8. Refresh page (data persists)
9. Log out
10. Verify cannot access dashboard

**Expected Result:**
- All steps succeed
- Session maintained throughout
- Results persist across refresh
- Logout clears session

**Actual Result:** ✓ PASS

---

### Test Case 6.2: Error Recovery
**ID:** `E2E-002`  
**Objective:** User can recover from errors gracefully  
**Steps:**
1. Log in
2. Start quiz
3. Submit without answering (error)
4. Answer all questions
5. Submit successfully

**Expected Result:**
- Error message shown
- User can retry
- Eventually succeeds
- No data loss

**Actual Result:** ✓ PASS

---

## 7. Security Tests

### Test Case 7.1: Password Hashing
**ID:** `SEC-001`  
**Objective:** Verify passwords are hashed, not plaintext  
**Steps:**
1. Create user
2. Query users table
3. Check password field value

**Expected Result:**
- Password is bcryptjs hash (starts with $2a$, $2b$, etc.)
- Original password not visible
- Hash changes on each registration

**Actual Result:** ✓ PASS

---

### Test Case 7.2: Session Cookie Security
**ID:** `SEC-002`  
**Objective:** Verify httpOnly and secure flags  
**Steps:**
1. Log in
2. Inspect Set-Cookie header
3. Check browser dev tools > Application > Cookies

**Expected Result:**
- Cookie name: connect.sid
- HttpOnly: true (prevents JS access)
- Secure: true in production (HTTPS only)
- SameSite: Lax (CSRF protection)

**Actual Result:** ✓ (httpOnly true, secure flag conditional on NODE_ENV)

---

### Test Case 7.3: Session Cookie Not Accessible via JavaScript
**ID:** `SEC-003`  
**Objective:** Verify XSS cannot steal session cookie  
**Steps:**
1. Open browser console
2. Attempt: `document.cookie`

**Expected Result:**
- Session cookie NOT listed
- Only non-httpOnly cookies visible
- httpOnly cookies are server-only

**Actual Result:** ✓ PASS

---

### Test Case 7.4: CORS Prevents Cross-Origin Requests
**ID:** `SEC-004`  
**Objective:** Verify unauthorized origins rejected  
**Steps:**
1. From domain `evil.com`, attempt API call to `localhost:3007`

**Expected Result:**
- Browser blocks request (CORS preflight fails)
- No response from server
- Or server returns 403

**Actual Result:** ✓ PASS

---

### Test Case 7.5: SQL Injection Prevention
**ID:** `SEC-005`  
**Objective:** Verify SQL injection attempts blocked  
**Steps:**
1. Try login with username: `testuser' OR '1'='1`
2. Try question fetch with topic: `Cloud'; DROP TABLE users;--`

**Expected Result:**
- Queries use parameterized statements
- Malicious input treated as literal string
- No table drops, no unauthorized access

**Actual Result:** ✓ PASS

---

## Test Execution Summary

| Category | Total | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Authentication | 10 | 9 | 1 | AUTH-010 requires manual time simulation |
| Quiz Retrieval | 4 | 3 | 1 | QUIZ-004 needs auth middleware |
| Submission & Eval | 11 | 10 | 1 | EVAL-007 needs auth middleware |
| Results | 5 | 4 | 1 | RESULTS-004 needs auth middleware |
| Data Persistence | 4 | 4 | 0 | All passed ✓ |
| E2E | 2 | 2 | 0 | All passed ✓ |
| Security | 5 | 5 | 0 | All passed ✓ |
| **TOTAL** | **41** | **37** | **4** | **90% Pass Rate** |

---

## Recommended Test Improvements

### High Priority
1. **Add explicit auth middleware** to protected routes (fixes 3 failed tests)
2. **Add input validation** for quiz submissions (partial answers)
3. **Test with real HF API** during staging
4. **Add rate limiting tests** for brute-force prevention

### Medium Priority
1. Test with multiple concurrent users
2. Test database recovery after corruption
3. Test with different LLM models
4. Test UI responsiveness on mobile browsers

### Low Priority
1. Performance/load testing (< 100 concurrent users)
2. Browser compatibility testing
3. Accessibility (WCAG) testing

---

**Test Document Version:** 1.0  
**Last Updated:** 2026-05-25  
**Next Review:** After implementing security improvements
