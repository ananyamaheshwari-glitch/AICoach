# GitHub Deployment Instructions

## Overview

This guide walks you through:
1. Installing Git (if not already installed)
2. Creating a GitHub repository
3. Initializing git in your project
4. Pushing your code to GitHub
5. Configuring GitHub repository settings

---

## Step 1: Install Git

### Windows

1. Download Git from: https://git-scm.com/download/win
2. Run the installer
3. Use default settings (recommended)
4. Complete installation
5. Restart your computer

### Verify Installation

Open PowerShell and run:
```powershell
git --version
```

You should see: `git version 2.x.x`

---

## Step 2: Create GitHub Account & Repository

### Create GitHub Account (if needed)
1. Go to https://github.com/join
2. Enter email, create password
3. Verify email
4. Complete setup

### Create New Repository

1. Go to https://github.com/new
2. Fill in repository details:
   - **Repository name:** `ai-quiz-app` (or your preferred name)
   - **Description:** `AI-Powered Quiz Application with LLM-Generated Feedback`
   - **Visibility:** Public (to share URL)
   - **Initialize with:** Leave unchecked (we'll push existing code)

3. Click "Create repository"

4. You'll see the repository URL. **Copy it**, looks like:
   ```
   https://github.com/YOUR_USERNAME/ai-quiz-app.git
   ```

---

## Step 3: Initialize Git in Project

Open PowerShell and navigate to your project:

```powershell
cd C:\Users\aepuru.harika\Desktop\project
```

### Initialize repository

```powershell
git init
```

### Configure Git (one-time setup)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Replace "Your Name" and "your.email@example.com" with your GitHub account details.

### Check configuration

```powershell
git config --global user.name
git config --global user.email
```

---

## Step 4: Stage & Commit Code

### Add all files

```powershell
git add .
```

### Check what will be committed

```powershell
git status
```

You should see:
- `README.md` ✓
- `ARCHITECTURE.md` ✓
- `TEST_CASES.md` ✓
- `SECURITY_REVIEW.md` ✓
- `SETUP_GUIDE.md` ✓
- `backend/` folder ✓
- `frontend/` folder ✓
- `.gitignore` ✓

You should **NOT** see:
- `node_modules/` (ignored by .gitignore)
- `.env` files (ignored by .gitignore)
- `*.db` files (ignored by .gitignore)

### Create initial commit

```powershell
git commit -m "Initial commit: AI-Powered Quiz Application with LLM integration"
```

---

## Step 5: Connect to GitHub & Push

### Add remote repository

Replace `YOUR_GITHUB_URL` with the URL you copied in Step 2:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/ai-quiz-app.git
```

Example:
```powershell
git remote add origin https://github.com/johnsmith/ai-quiz-app.git
```

### Rename branch to main (if needed)

```powershell
git branch -M main
```

### Push to GitHub

```powershell
git push -u origin main
```

You'll be prompted for authentication:
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (see below)

### Create Personal Access Token (for authentication)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Give it a name: "Git CLI"
4. Select scopes:
   - `repo` (all)
   - `workflow`
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)
7. Use this token as your "password" when pushing

---

## Step 6: Verify on GitHub

1. Go to your repository: `https://github.com/YOUR_USERNAME/ai-quiz-app`
2. Verify all files are there:
   - ✓ README.md
   - ✓ ARCHITECTURE.md
   - ✓ TEST_CASES.md
   - ✓ SECURITY_REVIEW.md
   - ✓ SETUP_GUIDE.md
   - ✓ backend/ folder
   - ✓ frontend/ folder

3. Click on files to view them on GitHub

---

## Step 7: Configure Repository Settings (Optional)

### Add Repository Description

1. Go to your repository
2. Click "Settings" (top right)
3. Under "Repository details":
   - Add **Description:** "AI-Powered Quiz Application with LLM-Generated Feedback"
   - Add **Website:** (optional, if deployed)
   - Add **Topics:** `ai`, `quiz`, `react`, `nodejs`, `llm`

### Enable Issues (for bug tracking)

1. Go to **Settings** → **Features**
2. Check "Issues"
3. Click "Save"

### Enable Discussions (for community)

1. Go to **Settings** → **Features**
2. Check "Discussions"

### Add License

1. Go to **Settings** → **Add license**
2. Choose license (ISC recommended for this project)
3. Click "Review and submit"

---

## Step 8: Create README.md on GitHub (Optional)

GitHub automatically displays README.md on your repository homepage. Ours is already comprehensive, so just verify it shows up correctly.

---

## Sharing Your Repository

### Public URL

Your public repository URL is:
```
https://github.com/YOUR_USERNAME/ai-quiz-app
```

Replace `YOUR_USERNAME` with your GitHub username.

### Share this with:
- Tracker sheet/project management tool
- Team members
- Documentation systems
- Portfolio/resume

---

## Common Git Commands (Going Forward)

### After making code changes

```powershell
# See what changed
git status

# Add changes
git add .

# Commit with message
git commit -m "Describe what you changed"

# Push to GitHub
git push
```

### View commit history

```powershell
git log
```

### Create a new branch (for features)

```powershell
git checkout -b feature/add-more-topics
# Make changes...
git add .
git commit -m "Add more quiz topics"
git push -u origin feature/add-more-topics
```

### Pull latest changes (if working with others)

```powershell
git pull
```

---

## Troubleshooting GitHub Setup

### Error: "fatal: not a git repository"

Solution: Run `git init` in your project directory first

### Error: "Permission denied (publickey)"

Solution: Set up SSH key instead of HTTPS:

```powershell
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"

# Add to SSH agent
ssh-add ~/.ssh/id_rsa

# Add public key to GitHub
# Copy content of ~/.ssh/id_rsa.pub
# Go to https://github.com/settings/ssh/new
# Paste and save
```

### Error: "remote: Permission to USER/REPO denied"

Solution: 
- Check your authentication (token validity)
- Verify you have push permissions
- Try creating a new Personal Access Token

### Changes not showing on GitHub

Solution: Verify push was successful:

```powershell
git log
git remote -v
git push -u origin main
```

---

## Next Steps

1. **Deploy the application** (see SECURITY_REVIEW.md for deployment checklist)
2. **Set up GitHub Actions** for CI/CD (optional)
3. **Add collaborators** if working with a team
4. **Track issues** using GitHub Issues
5. **Create releases** for version management

---

## Example GitHub Repository Structure

Your repository will look like:

```
ai-quiz-app/
├── README.md                    (displayed on GitHub)
├── ARCHITECTURE.md
├── TEST_CASES.md
├── SECURITY_REVIEW.md
├── SETUP_GUIDE.md
├── GITHUB_DEPLOYMENT.md         (this file)
├── .gitignore
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── db/
│   ├── config.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
└── [other files...]
```

---

## Verification Checklist

- [ ] Git installed on computer
- [ ] GitHub account created
- [ ] Repository created on GitHub
- [ ] Local repository initialized (`git init`)
- [ ] Git user configured (`git config --global`)
- [ ] All files added (`git add .`)
- [ ] Initial commit created (`git commit`)
- [ ] Remote added (`git remote add origin`)
- [ ] Code pushed to GitHub (`git push`)
- [ ] Repository visible on GitHub.com
- [ ] All files showing on GitHub
- [ ] README.md displaying correctly

---

## Example: Complete Push Sequence

Here's what your complete terminal session might look like:

```powershell
PS C:\Users\aepuru.harika\Desktop\project> git init
Initialized empty Git repository in C:\Users\aepuru.harika\Desktop\project\.git/

PS C:\Users\aepuru.harika\Desktop\project> git config --global user.name "John Smith"

PS C:\Users\aepuru.harika\Desktop\project> git config --global user.email "john@example.com"

PS C:\Users\aepuru.harika\Desktop\project> git add .

PS C:\Users\aepuru.harika\Desktop\project> git status
On branch master
Changes to be committed:
  new file: README.md
  new file: ARCHITECTURE.md
  ... (all files)

PS C:\Users\aepuru.harika\Desktop\project> git commit -m "Initial commit: AI-Powered Quiz Application"
[master (root-commit) abc123] Initial commit: AI-Powered Quiz Application
 15 files changed, 5000 insertions(+)

PS C:\Users\aepuru.harika\Desktop\project> git remote add origin https://github.com/johnsmith/ai-quiz-app.git

PS C:\Users\aepuru.harika\Desktop\project> git branch -M main

PS C:\Users\aepuru.harika\Desktop\project> git push -u origin main
Enumerating objects: 45, done.
Counting objects: 100% (45/45), done.
Delta compression using up to 8 threads
Compressing objects: 100% (40/40), done.
Writing objects: 100% (45/45), 250 KiB | 2.5 MiB/s, done.
Sending data to server, done.
To https://github.com/johnsmith/ai-quiz-app.git
 * [new branch] main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.

PS C:\Users\aepuru.harika\Desktop\project> # ✅ Success! Now check https://github.com/johnsmith/ai-quiz-app
```

---

**GitHub Deployment Guide Version:** 1.0  
**Last Updated:** 2026-05-25
