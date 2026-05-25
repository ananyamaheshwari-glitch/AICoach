# AI-Powered Quiz Application

A full-stack web application that administers quizzes and provides users with personalized, AI-generated feedback on their performance. The system evaluates user answers, identifies strengths and weaknesses, and generates a detailed learning roadmap using Large Language Models (LLMs).

## 🎯 Features

- **User Authentication**: Secure cookie-based session management with bcryptjs password hashing
- **Interactive Quiz**: Multiple-choice questions with real-time evaluation
- **AI-Powered Feedback**: Three-step LLM evaluation pipeline for comprehensive analysis
- **Personalized Reports**: Customized learning roadmaps based on performance
- **Secure Data Access**: User-scoped result retrieval with session validation
- **Responsive UI**: Modern React + Tailwind CSS interface

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   React Frontend (Vite + Tailwind)  │
│   (Port 5173)                        │
└──────────────┬──────────────────────┘
               │ HTTPS API Calls
               │ (with Session Cookies)
┌──────────────v──────────────────────────────────┐
│        Express.js Backend (Port 3007)            │
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐  │
│  │  API Controllers (Auth, Quiz)              │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  AI Service Module (3-Call LLM Chain)      │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  Database Module (SQLite)                  │  │
│  └────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────┘
               │ SQL Queries
               │
┌──────────────v──────────────────┐
│  SQLite Database (quiz.db)       │
│  • users                         │
│  • questions                     │
│  • quiz_results                  │
└─────────────────────────────────┘

External Service:
┌───────────────────────────────────┐
│  Hugging Face Inference API       │
│  (LLM: Llama 3.1 8B Instruct)    │
└───────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A Hugging Face API token (free at [huggingface.co](https://huggingface.co))

### Installation

#### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd project
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file with your Hugging Face token
cp .env.example .env
# Edit .env and add your HUGGINGFACE_HUB_TOKEN

# Start the backend server (development mode with auto-reload)
npm run dev
# Server runs on http://localhost:3007
```

**Backend .env Configuration:**
```
PORT=3007
NODE_ENV=development
SESSION_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:5173
HUGGINGFACE_HUB_TOKEN=hf_your_token_here
AI_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
# Frontend runs on http://localhost:5173
```

#### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

**Default Test Credentials:**
- Username: `testuser`
- Password: `password123`

### Running in Production

**Backend:**
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
# Or serve the dist/ folder with your web server
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticates a user and creates a session.

**Request Body:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "message": "Login successful.",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

**Response (Failure - 401):**
```json
{
  "message": "Invalid credentials."
}
```

#### POST `/api/auth/logout`
Destroys the current user session.

**Response (200):**
```json
{
  "message": "Logout successful."
}
```

#### GET `/api/auth/status`
Checks if the user has an active session. Used by the frontend on initial load.

**Response (Authenticated - 200):**
```json
{
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

**Response (Not Authenticated - 401):**
```json
{
  "user": null
}
```

### Quiz Endpoints

#### GET `/api/quizzes/questions/:topic`
Fetches all multiple-choice questions for a given topic.

**Example:** `GET /api/quizzes/questions/cloud`

**Response (200):**
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

#### POST `/api/quizzes/submit`
Submits user answers for evaluation, triggers the AI workflow, and stores the result.

**Request Body:**
```json
{
  "user_answers": {
    "1": "A",
    "2": "C",
    "3": "B",
    "4": "A",
    "5": "B"
  }
}
```

**Response (201):**
```json
{
  "message": "Quiz submitted and evaluated successfully.",
  "resultId": 123,
  "report": {
    "score": 80,
    "strengths": ["Cloud"],
    "weak_areas": [],
    "error_pattern": "None",
    "key_insight": "Strong understanding of cloud concepts.",
    "overall_summary": "...",
    "detailed_breakdown": "...",
    "personalized_roadmap": [...]
  }
}
```

#### GET `/api/quizzes/results/:resultId`
Retrieves a previously completed quiz result for the logged-in user.

**Example:** `GET /api/quizzes/results/123`

**Response (200):**
```json
{
  "report": {
    "score": 80,
    "strengths": ["Cloud"],
    "weak_areas": [],
    "error_pattern": "None",
    "key_insight": "Strong understanding of cloud concepts.",
    "overall_summary": "...",
    "detailed_breakdown": "...",
    "personalized_roadmap": [...]
  }
}
```

**Response (404):**
```json
{
  "message": "Result not found or you do not have permission to view it."
}
```

## 🤖 AI Evaluation Workflow (3-Call System)

The backend uses a three-step, chained-prompting strategy with the Hugging Face LLM:

### Step 1: Initial Evaluation (`evaluateAnswers`)
- **Input:** User's answers, question data
- **AI Task:** Analyze answer patterns, calculate score, identify strengths/weak areas
- **Output:** JSON with score, strengths, weak_areas, error_pattern, key_insight

### Step 2: Detailed Feedback (`getDetailedFeedback`)
- **Input:** Score and initial evaluation
- **Logic:**
  - **If score < 50%:** Act as friendly tutor, explain weak area concepts simply
  - **If score ≥ 50%:** Act as senior architect, provide advanced insights
- **Output:** Markdown-formatted detailed feedback text

### Step 3: Final Report (`generateFinalReport`)
- **Input:** Initial evaluation + detailed feedback
- **AI Task:** Act as career coach, synthesize all data
- **Output:** JSON with overall_summary and personalized_roadmap (3-4 actionable next steps)

## 🗄️ Database Schema

### users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL (hashed with bcryptjs),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### questions
```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
  topic TEXT NOT NULL
);
```

### quiz_results
```sql
CREATE TABLE quiz_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quiz_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  score REAL NOT NULL,
  raw_answers TEXT NOT NULL (JSON string),
  final_report TEXT (JSON string),
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔒 Security Features

- **Authentication:** Secure cookie-based session management with express-session
- **Password Hashing:** bcryptjs with 10 salt rounds
- **Session Security:** httpOnly cookies prevent XSS attacks; secure flag for HTTPS in production
- **Data Access Control:** Users can only access their own quiz results
- **Environment Variables:** Sensitive config stored in .env, not hardcoded
- **Input Validation:** Basic validation on auth endpoints and quiz submissions
- **CORS Configuration:** Whitelist specific origins

## 📁 Project Structure

```
project/
├── backend/
│   ├── controllers/
│   │   ├── authController.js      # Login, logout, status
│   │   └── quizController.js      # Quiz submission & results
│   ├── services/
│   │   └── aiServices.js          # 3-step AI evaluation pipeline
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── quizRoutes.js
│   ├── db/
│   │   └── database.js            # SQLite schema & seed data
│   ├── middleware/
│   ├── config.js                  # Environment configuration
│   ├── server.js                  # Express app setup
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx          # Login form
│   │   │   ├── Dashboard.jsx      # User dashboard
│   │   │   ├── Quiz.jsx           # Quiz interface
│   │   │   └── Results.jsx        # Results display
│   │   ├── hooks/
│   │   │   └── useAuth.js         # Auth state hook
│   │   ├── api/
│   │   │   └── axiosConfig.js     # API client
│   │   ├── App.jsx                # Main app & routing
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🧪 Manual Testing Guide

### Test Scenario 1: Login & Logout

1. Navigate to `http://localhost:5173`
2. Log in with `testuser` / `password123`
3. Verify welcome message displays
4. Click "Logout" and verify redirect to login page
5. Try accessing `/dashboard` directly—should redirect to login

### Test Scenario 2: Take a Quiz

1. Log in and click "Start Quiz"
2. Verify all 5 questions display with options
3. Leave one answer blank and try submitting—should show error
4. Answer all questions and submit
5. Verify redirect to results page with report

### Test Scenario 3: View Results

1. On results page, verify all report sections display:
   - Score (0-100)
   - Key Insight
   - Strengths
   - Weak Areas
   - Detailed Breakdown (AI-generated)
   - Personalized Roadmap
2. Refresh page—report should reload from API
3. Verify user cannot access others' results by URL manipulation

### Test Scenario 4: Invalid Credentials

1. Try logging in with wrong password
2. Verify "Invalid credentials" error message appears
3. Try logging in with non-existent username
4. Verify same error message

## 🚨 Known Limitations

- **Single Quiz Topic:** Currently supports only "Cloud Computing" quiz
- **No Admin Interface:** Questions managed via database seeding script
- **No Quiz History:** Users cannot view past quiz attempts
- **Basic State Management:** Uses React hooks only (no Context API or Redux)
- **No Loading Skeletons:** Missing UI loaders on Quiz/Results pages
- **Minimal Error Handling:** Could benefit from global error middleware

## 🔮 Future Enhancements

- [ ] Dynamic topic selection with multiple quizzes
- [ ] Admin panel for managing questions and topics
- [ ] Quiz history page showing all past attempts
- [ ] Loading skeleton UI during data fetching
- [ ] Global error handling middleware
- [ ] Rate limiting on authentication endpoints
- [ ] CSRF protection
- [ ] User profile and progress tracking
- [ ] Mobile app (React Native)

## 📦 Dependencies

### Backend
- **express** - Web framework
- **express-session** - Session management
- **bcryptjs** - Password hashing
- **sqlite3** - Database
- **connect-sqlite3** - Session store
- **dotenv** - Environment variables
- **cors** - CORS middleware
- **@huggingface/inference** - HF LLM integration
- **openai** - OpenAI SDK (used for HF API)

### Frontend
- **react** - UI library
- **react-router-dom** - Routing
- **axios** - HTTP client
- **tailwindcss** - Styling
- **vite** - Build tool

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📧 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Happy learning! 🎓**
