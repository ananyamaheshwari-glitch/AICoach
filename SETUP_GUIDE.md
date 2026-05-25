# Project Setup Guide

## Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (for version control) - [Download](https://git-scm.com/)
- **Hugging Face Account** (free) - [Create Account](https://huggingface.co/join)

---

## Step 1: Get Hugging Face API Token

1. Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click "New token"
3. Give it a name: "AI Quiz App"
4. Select "Read" access level
5. Click "Create token"
6. Copy the token (you'll need it in Step 3)

---

## Step 2: Clone or Download the Repository

### Option A: Clone with Git
```bash
git clone <your-github-url> ai-quiz-app
cd ai-quiz-app
```

### Option B: Download ZIP
1. Download the project ZIP file
2. Extract to a directory
3. Open terminal/PowerShell and `cd` to the directory

---

## Step 3: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Configure .env File

Edit `backend/.env` and add your Hugging Face token:

```env
PORT=3007
NODE_ENV=development
SESSION_SECRET=your-random-secret-key-here-use-something-secure-and-random
CORS_ORIGIN=http://localhost:5173
HUGGINGFACE_HUB_TOKEN=hf_paste_your_token_here
AI_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

**Important:**
- Replace `hf_paste_your_token_here` with your actual Hugging Face token
- `SESSION_SECRET` should be a random string (at least 32 characters)
- Keep `.env` file private (it's in .gitignore)

### Start Backend Server

```bash
# Option 1: Development mode (with auto-reload)
npm run dev

# Option 2: Production mode
npm start
```

You should see:
```
Connected to the SQLite database.
Seeding database with questions...
Creating default user...
Server is running on http://localhost:3007
```

---

## Step 4: Frontend Setup

Open a **new terminal/PowerShell window** and:

```bash
# Navigate to frontend folder (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

You should see:
```
VITE v5.2.0  ready in XX ms

➜  Local:   http://localhost:5173/
```

---

## Step 5: Access the Application

Open your browser and go to:

```
http://localhost:5173
```

You should see the login page.

### Default Test Credentials

- **Username:** `testuser`
- **Password:** `password123`

---

## Verifying Setup

### Backend Checks

1. **Is backend running?**
   ```bash
   curl http://localhost:3007
   # Should return: "AI Quiz Backend is running!"
   ```

2. **Can you authenticate?**
   ```bash
   curl -X POST http://localhost:3007/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"password123"}'
   ```

3. **Can you fetch questions?**
   ```bash
   curl http://localhost:3007/api/quizzes/questions/cloud
   ```

### Frontend Checks

1. Open http://localhost:5173
2. Log in with testuser / password123
3. Click "Start Quiz"
4. See 5 quiz questions
5. Answer all and submit
6. View the AI-generated report

---

## Troubleshooting

### Backend Won't Start

**Error: "FATAL ERROR: HUGGINGFACE_HUB_TOKEN is not set"**
- ✓ Check `.env` file exists in `backend/` folder
- ✓ Ensure `HUGGINGFACE_HUB_TOKEN=hf_...` is set
- ✓ Restart backend after changing .env

**Error: "Port 3007 is already in use"**
- ✓ Change PORT in .env file
- Or kill process using port: `netstat -ano | findstr :3007`

**Error: "npm not found"**
- ✓ Install Node.js from https://nodejs.org/
- ✓ Restart your terminal after installation

---

### Frontend Won't Start

**Error: "Port 5173 already in use"**
- ✓ In frontend/vite.config.js, change port:
```javascript
server: {
  port: 5174  // Use different port
}
```

**Error: "Cannot find module axios"**
- ✓ Run `npm install` in frontend folder
- ✓ Delete `node_modules` folder and reinstall: `rm -r node_modules && npm install`

**Blank page or build errors**
- ✓ Clear browser cache (Ctrl+Shift+Delete)
- ✓ Check browser console for errors (F12 → Console)

---

### Quiz Submission Fails

**Error: "An error occurred processing your quiz"**
- ✓ Check backend logs for detailed error
- ✓ Verify Hugging Face token is valid: https://huggingface.co/settings/tokens
- ✓ Check internet connection to HF API
- ✓ Verify no firewall blocking HF API calls

**Error: "Network error: The request timed out"**
- ✓ HF API is slow or unavailable
- ✓ Try again in a few moments
- ✓ Check Hugging Face status: https://status.huggingface.co/

---

### Results Page Blank

**Error: "Result not found"**
- ✓ Make sure you're logged in as the user who submitted the quiz
- ✓ Check browser console for API errors (F12 → Network tab)
- ✓ Verify backend is running

---

### CORS Errors

**Error: "Access to XMLHttpRequest blocked by CORS policy"**
- ✓ Verify `CORS_ORIGIN` in backend .env matches frontend URL
- ✓ Default: `CORS_ORIGIN=http://localhost:5173`
- ✓ Restart backend after changing .env

---

## Next Steps

1. **Read Documentation:**
   - `README.md` - Project overview and API docs
   - `ARCHITECTURE.md` - System design and data flows
   - `TEST_CASES.md` - Testing guide
   - `SECURITY_REVIEW.md` - Security assessment

2. **Customize the App:**
   - Add more quiz questions (edit `backend/db/database.js`)
   - Add more quiz topics
   - Customize UI (edit `frontend/src/`)

3. **Deploy to Production:**
   - See deployment checklist in `SECURITY_REVIEW.md`
   - Use Railway, Vercel, or your preferred platform
   - Enable HTTPS and security headers

4. **Run Tests:**
   - Follow test cases in `TEST_CASES.md`
   - Set up automated testing (Jest, Cypress)

---

## Additional Commands

### Backend

```bash
# Run in development mode with auto-reload
npm run dev

# Start production server
npm start

# Check backend status
curl http://localhost:3007

# View database (SQLite CLI)
sqlite3 quiz.db
```

### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| PORT | 3007 | No | Backend server port |
| NODE_ENV | development | No | Set to "production" for deploy |
| SESSION_SECRET | (fallback) | Yes | Sign session cookies (use strong random) |
| CORS_ORIGIN | http://localhost:5173 | No | Allow requests from frontend URL |
| HUGGINGFACE_HUB_TOKEN | - | **YES** | Your HF API token (get from settings) |
| AI_MODEL | meta-llama/Llama-3.1-8B-Instruct | No | LLM model to use |

---

## File Structure

```
project/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── db/
│   ├── middleware/
│   ├── config.js
│   ├── server.js
│   ├── package.json
│   ├── .env          (⚠️ Don't commit)
│   ├── .env.example  (✓ Safe to commit)
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
│
├── README.md          (Quick start)
├── ARCHITECTURE.md    (System design)
├── TEST_CASES.md      (Test guide)
├── SECURITY_REVIEW.md (Security assessment)
├── SETUP_GUIDE.md     (This file)
└── .gitignore
```

---

## Getting Help

### Error? Check:
1. This `SETUP_GUIDE.md` troubleshooting section
2. Backend console logs (terminal where you ran `npm run dev`)
3. Frontend browser console (F12 → Console tab)
4. Network tab (F12 → Network) to see API calls

### Still stuck?
1. Verify prerequisites installed (Node.js, git)
2. Delete `node_modules` and reinstall: `npm install`
3. Check that ports 3007 and 5173 are available
4. Verify Hugging Face token is valid and has "Read" permission

---

## First Time Tips

- **Slow first quiz submission?** Normal! LLM API takes 5-15 seconds.
- **Want to add more questions?** Edit `backend/db/database.js` seedQuestions array
- **Want to change port?** Edit `backend/.env` (PORT=) or `backend/config.js`
- **Logs too verbose?** Disable in `backend/server.js` console.log statements

---

**Setup Version:** 1.0  
**Last Updated:** 2026-05-25
