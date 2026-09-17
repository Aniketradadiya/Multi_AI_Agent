# 🤖 AI Career Coach — Multi-Agent Career Intelligence System

An AI-powered **Career Intelligence and Placement Readiness Platform** that uses multiple specialized AI agents to help students analyze their resumes, prepare for interviews, improve coding skills, build personalized learning roadmaps, analyze GitHub projects, and continuously track their placement readiness.

The system is designed as a **multi-agent AI platform** rather than a simple chatbot. Each agent specializes in a specific career-related task, while a central AI orchestration and memory layer provides personalized recommendations based on the user's previous activities and performance.

---

## 📌 Project Overview

Students often use different platforms for resumes, coding practice, interview preparation, learning roadmaps, GitHub analysis, and job searching.

This project combines these activities into one intelligent platform.

The system continuously collects user career data such as:

* Skills
* Resume performance
* Coding performance
* Mock interview performance
* Projects
* GitHub activity
* Learning progress
* Weak topics

The AI then uses this information to generate personalized recommendations and calculate a **Placement Readiness Score**.

---

# 🎯 Main Objective

The main objective of the project is to develop an AI-powered career assistant that can:

1. Analyze a student's resume.
2. Conduct AI-powered mock interviews.
3. Generate personalized learning roadmaps.
4. Provide coding questions and evaluate solutions.
5. Match users with suitable job opportunities.
6. Analyze GitHub profiles and repositories.
7. Analyze academic/personal projects.
8. Remember user skills and weaknesses.
9. Track career preparation progress.
10. Calculate an overall Placement Readiness Score.

---

# 🧠 Multi-Agent AI Architecture

Instead of using a single AI assistant, the platform uses multiple specialized agents.

```text
                         USER
                          │
                          ▼
                 ┌─────────────────┐
                 │ React Frontend  │
                 │  TypeScript     │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Node + Express  │
                 │  TypeScript     │
                 └────────┬────────┘
                          │
                    AI Orchestrator
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
 Resume Agent       Interview Agent   Roadmap Agent
        │                 │                 │
        ▼                 ▼                 ▼
 ATS Analysis       Mock Interview     Learning Plan

        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
 Coding Agent       GitHub Agent      Project Agent
        │                 │                 │
        ▼                 ▼                 ▼
Code Evaluation     GitHub Analysis   Project Analysis

                          │
                          ▼
                    Memory Agent
                          │
                          ▼
                     ChromaDB
                          │
                          ▼
                     Gemini API
```

---

# 🤖 AI Agents

## 1. Resume Agent

The Resume Agent analyzes uploaded resumes and provides:

* ATS score
* Resume strengths
* Resume weaknesses
* Missing skills
* Improvement suggestions
* Recommended job roles

### Workflow

```text
Resume Upload
      ↓
Text Extraction
      ↓
Gemini AI
      ↓
Resume Analysis
      ↓
ATS Score
      ↓
Suggestions
      ↓
MongoDB
```

---

## 2. Interview Agent

The Interview Agent conducts AI-powered mock interviews.

Users can select:

* Target role
* Difficulty
* Interview type
* Number of questions

Example:

```text
Role: MERN Developer
Difficulty: Intermediate
Type: Technical
```

The AI generates questions and evaluates user answers.

### Evaluation

```text
Technical Accuracy
Communication
Answer Quality
Confidence
Weak Topics
Overall Score
```

Interview history is stored for future personalization.

---

## 3. Roadmap Agent

The Roadmap Agent generates a personalized learning plan based on:

* Target role
* Current skill level
* Existing skills
* Weak topics
* Available study time
* Learning progress

Example:

```text
Target Role:
MERN Developer

Level:
Beginner

Study Time:
3 hours/day
```

The AI can generate a roadmap such as:

```text
Week 1 → JavaScript Fundamentals
Week 2 → Advanced JavaScript
Week 3 → React
Week 4 → Node.js
Week 5 → Express.js
Week 6 → MongoDB
Week 7 → Full-Stack Project
Week 8 → Interview Preparation
```

The roadmap can be dynamically adjusted according to user performance.

---

## 4. Coding Agent

The Coding Agent provides programming practice.

Users can select:

```text
Language
Topic
Difficulty
```

Example:

```text
Language: Java
Topic: Arrays
Difficulty: Easy
```

The system provides a coding problem and evaluates the submitted solution.

It can analyze:

* Correctness
* Time complexity
* Space complexity
* Code quality
* Possible improvements

It also tracks:

* Problems solved
* Accuracy
* Weak topics
* Coding streak
* Performance

---

## 5. Job Match Agent

The Job Match Agent recommends jobs based on the user's:

* Skills
* Target role
* Experience level
* Projects
* Missing skills

Example:

```text
Junior MERN Developer

Match Score: 87%

Matched Skills:
✓ JavaScript
✓ React
✓ Node.js
✓ MongoDB

Missing Skills:
✗ Docker
✗ AWS
```

For the initial version, a controlled/mock job dataset can be used.

---

## 6. GitHub Analysis Agent

The GitHub Agent analyzes a user's GitHub profile and repositories.

### Input

```text
GitHub Username
```

### Analysis

```text
GitHub API
     ↓
Repositories
     ↓
Languages
     ↓
README
     ↓
Repository Information
     ↓
Gemini AI
     ↓
Career Analysis
```

The system can identify:

* Repository quality
* Technology usage
* Documentation quality
* Missing skills
* Project improvement opportunities
* Recommended projects

---

## 7. Project Analyzer Agent

Users can provide a project GitHub repository or project files.

The Project Agent analyzes:

* Project architecture
* Technologies
* Features
* APIs
* Database
* Authentication
* Security
* Code structure

It can also generate:

* Project explanation
* Improvement suggestions
* Interview questions
* Documentation

Example interview questions:

```text
1. Why did you use MongoDB?
2. How does JWT authentication work?
3. Why did you choose this architecture?
4. How would you scale this application?
5. How is the database designed?
```

---

# 🧠 AI Memory System

One of the major features of the project is **AI Memory**.

The system stores useful career-related information about the user.

```text
User Skills
Weak Topics
Previous Interviews
Coding Performance
Learning Progress
Resume Analysis
Projects
GitHub Analysis
```

Example:

```text
User Weakness:

JavaScript Closures
```

Later, when the user asks for a learning plan, the AI can consider that weakness.

```text
User Memory
     ↓
Weak Topics
     ↓
AI
     ↓
Personalized Roadmap
```

---

# 🗄️ Vector Memory

The project can use **ChromaDB** or **Pinecone** for vector-based memory.

```text
User Information
      ↓
Text / Documents
      ↓
Embeddings
      ↓
Vector Database
      ↓
Relevant Memory Retrieval
      ↓
Gemini
      ↓
Personalized Response
```

For development, ChromaDB can be used first.

---

# 📊 Personalized Dashboard

After login, the user gets a personalized dashboard.

The dashboard contains:

* Placement Readiness Score
* Resume Score
* Skill Progress
* Weekly Goals
* Completed Interviews
* Coding Progress
* Learning Streak
* Recommended Next Steps

Example:

```text
┌─────────────────────────────────────┐
│        PLACEMENT READINESS          │
│                                     │
│               74%                   │
│                                     │
│ Resume       78%                    │
│ Skills       72%                    │
│ Projects     85%                    │
│ Coding       65%                    │
│ Interview    70%                    │
│                                     │
│ Biggest Weakness: Coding            │
│                                     │
│ Recommended: Arrays + Strings       │
└─────────────────────────────────────┘
```

---

# 🎯 Placement Readiness Score

The system calculates an overall career readiness score.

Example formula:

```text
Placement Score =

25% Resume
20% Skills
20% Projects
20% Coding
15% Interviews
```

Example:

```text
Resume       = 78
Skills       = 72
Projects     = 85
Coding       = 65
Interview    = 70
```

The system generates an overall score.

The score is not static. It changes as the user improves.

```text
Coding Practice
      ↓
Coding Score ↑
      ↓
Placement Score ↑
```

---

# 🎤 Voice Mock Interview

The advanced version includes voice-based interviews.

Workflow:

```text
AI Question
     ↓
Text-to-Speech
     ↓
User Hears Question
     ↓
User Speaks Answer
     ↓
Speech-to-Text
     ↓
AI Evaluation
     ↓
Performance Analysis
```

The system can analyze:

* Answer quality
* Confidence
* Communication
* Filler words
* Technical accuracy

---

# 🖥️ Technology Stack

## Frontend

The frontend **must be created using TypeScript**.

```text
React.js
TypeScript
Tailwind CSS
React Router
Axios
Recharts
```

---

## Backend

The backend **must be created using TypeScript**.

```text
Node.js
Express.js
TypeScript
JWT
bcrypt
Multer
```

---

## Database

```text
PostgreSQL
```

---

## AI

```text
Google Gemini API
```

---

## Vector Database

```text
ChromaDB
```

or

```text
Pinecone
```

---

## External APIs

```text
GitHub API
```

A job API/data source can be added later.

---

## Deployment

```text
Frontend → Vercel

Backend → Render

Database → MongoDB Atlas
```

---

# 📁 Project Structure

The project contains separate frontend and backend applications.

```text
AI-Career-Coach/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── context/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── gemini.ts
│   │   │   └── environment.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── resume.controller.ts
│   │   │   ├── interview.controller.ts
│   │   │   ├── roadmap.controller.ts
│   │   │   ├── coding.controller.ts
│   │   │   ├── github.controller.ts
│   │   │   ├── project.controller.ts
│   │   │   └── job.controller.ts
│   │   │
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Resume.ts
│   │   │   ├── Interview.ts
│   │   │   ├── Roadmap.ts
│   │   │   ├── Coding.ts
│   │   │   ├── Project.ts
│   │   │   └── UserProgress.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── resume.routes.ts
│   │   │   ├── interview.routes.ts
│   │   │   ├── roadmap.routes.ts
│   │   │   ├── coding.routes.ts
│   │   │   ├── github.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   └── job.routes.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── upload.middleware.ts
│   │   │
│   │   ├── services/
│   │   │   ├── gemini.service.ts
│   │   │   ├── resume.service.ts
│   │   │   ├── interview.service.ts
│   │   │   ├── roadmap.service.ts
│   │   │   ├── github.service.ts
│   │   │   └── memory.service.ts
│   │   │
│   │   ├── types/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── uploads/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── README.md
└── .gitignore
```

---

# 🛠️ Project Setup

## Step 1 — Create Root Folder

```bash
mkdir AI-Career-Coach
cd AI-Career-Coach
```

---

# Step 2 — Create Frontend

Use Vite with React + TypeScript.

```bash
npm create vite@latest frontend
```

Select:

```text
Framework: React
Variant: TypeScript
```

Then:

```bash
cd frontend
npm install
```

Install required packages:

```bash
npm install react-router-dom axios recharts
```

Install Tailwind CSS using the current Tailwind CSS + Vite setup.

---

# Step 3 — Create Backend

From the root directory:

```bash
cd ..
mkdir backend
cd backend
npm init -y
```

Install backend dependencies:

```bash
npm install express pg cors dotenv bcryptjs jsonwebtoken multer
```

Install Gemini SDK:

```bash
npm install @google/generative-ai
```

Install development dependencies:

```bash
npm install -D typescript ts-node ts-node-dev @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/multer
```

Initialize TypeScript:

```bash
npx tsc --init
```

---

# ⚙️ Backend TypeScript Configuration

The backend should use TypeScript.

Example `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

---

# 📦 Backend Scripts

Add scripts to `backend/package.json`:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

Run backend:

```bash
npm run dev
```

---

# 🔐 Environment Variables

Create:

```text
backend/.env
```

Example:

```env
PORT=5000

DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_career_coach

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

GITHUB_TOKEN=your_github_token

CHROMA_URL=your_chroma_url
```

Never commit `.env` to GitHub.

---

# 🔑 Authentication

Authentication will use:

```text
JWT
+
bcrypt
```

### Register

```text
User
 ↓
Register
 ↓
Hash Password
 ↓
MongoDB
```

### Login

```text
Email + Password
       ↓
bcrypt verification
       ↓
JWT Token
       ↓
Authenticated User
       ↓
Dashboard
```

---

# 🌐 API Structure

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

## Resume

```http
POST /api/resume/analyze
GET /api/resume/latest
```

## Interview

```http
POST /api/interview/start
POST /api/interview/answer
GET /api/interview/history
```

## Roadmap

```http
POST /api/roadmap/generate
GET /api/roadmap/current
PUT /api/roadmap/update
```

## Coding

```http
POST /api/coding/question
POST /api/coding/evaluate
GET /api/coding/progress
```

## GitHub

```http
POST /api/github/analyze
```

## Projects

```http
POST /api/projects/analyze
```

## Jobs

```http
GET /api/jobs/recommendations
```

## Placement

```http
GET /api/placement/score
```

---

# 🗃️ Database Models

## User

```typescript
{
  name: string;
  email: string;
  password: string;
  targetRole: string;
  experienceLevel: string;
  skills: string[];
  studyTime: number;
}
```

## Resume

```typescript
{
  userId: string;
  fileUrl: string;
  extractedText: string;
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}
```

## Interview

```typescript
{
  userId: string;
  role: string;
  questions: object[];
  answers: object[];
  score: number;
  weaknesses: string[];
}
```

## Roadmap

```typescript
{
  userId: string;
  targetRole: string;
  duration: number;
  skills: string[];
  tasks: object[];
  progress: number;
}
```

## Coding

```typescript
{
  userId: string;
  language: string;
  topic: string;
  difficulty: string;
  question: string;
  solution: string;
  score: number;
}
```

---

# 🧩 Frontend Pages

```text
/login
/register

/dashboard

/resume
/interview
/voice-interview
/roadmap
/coding
/jobs
/github
/projects
/progress
/profile
```

---

# 🎨 Dashboard Navigation

```text
🏠 Dashboard

📄 Resume Analyzer

🎤 Mock Interview

🗺️ AI Roadmap

💻 Coding Practice

💼 Job Match

🐙 GitHub Analyzer

📦 Project Analyzer

📊 Progress

🎯 Placement Score

⚙️ Profile
```

---

# 🔄 Complete User Workflow

```text
                    REGISTER
                       │
                       ▼
                  USER PROFILE
                       │
                       ▼
                    DASHBOARD
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
     RESUME        INTERVIEW         CODING
       │               │                │
       ▼               ▼                ▼
    ATS SCORE      AI SCORE        CODE SCORE
       │               │                │
       └───────────────┼────────────────┘
                       │
                       ▼
                    SKILLS
                       │
                       ▼
                 AI MEMORY
                       │
                       ▼
                PERSONALIZED
                   ROADMAP
                       │
                       ▼
                GITHUB ANALYSIS
                       │
                       ▼
                PROJECT ANALYSIS
                       │
                       ▼
              PLACEMENT READINESS
                    SCORE
                       │
                       ▼
             RECOMMENDED NEXT STEP
```

---

# 📅 Development Roadmap

## Phase 1 — Foundation

```text
Day 1
Project setup

Day 2
React + TypeScript

Day 3
Node + Express + TypeScript

Day 4
MongoDB

Day 5
JWT Authentication
```

## Phase 2 — Dashboard

```text
Day 6
Dashboard UI

Day 7
User Profile

Day 8
Progress Tracking
```

## Phase 3 — Resume Agent

```text
Day 9
Resume Upload

Day 10
Text Extraction

Day 11
Gemini Integration

Day 12
ATS Scoring

Day 13
Resume Dashboard
```

## Phase 4 — Interview Agent

```text
Day 14
Interview UI

Day 15
Question Generation

Day 16
Answer Evaluation

Day 17
Interview History

Day 18
Performance Analysis
```

## Phase 5 — Roadmap Agent

```text
Day 19
Skill Assessment

Day 20
Roadmap Generation

Day 21
Progress Tracking
```

## Phase 6 — Coding Agent

```text
Day 22
Question Generation

Day 23
Code Evaluation

Day 24
Coding Progress
```

## Phase 7 — GitHub Agent

```text
Day 25
GitHub API

Day 26
Repository Analysis

Day 27
AI Recommendations
```

## Phase 8 — Project Analyzer

```text
Day 28
Project Upload / GitHub Link

Day 29
Project Analysis

Day 30
Interview Question Generation
```

## Phase 9 — AI Memory

```text
Day 31
User Memory

Day 32
ChromaDB

Day 33
Memory Retrieval

Day 34
Personalized AI Responses
```

## Phase 10 — Placement Score

```text
Day 35
Scoring Algorithm

Day 36
Dashboard Integration
```

## Phase 11 — Voice Interview

```text
Day 37
Speech Recognition

Day 38
Text-to-Speech

Day 39
Voice Interview
```

## Phase 12 — Deployment

```text
Day 40
Frontend Deployment

Day 41
Backend Deployment

Day 42
PostgreSQL

Day 43
Environment Configuration

Day 44
Testing

Day 45
Final Documentation
```

---

# 🔥 Project Differentiation

The project should not be presented simply as:

> "An AI chatbot for career advice."

Instead, the system is designed as a **continuous career improvement platform**.

The main concept is:

```text
Resume
   ↓
Skills
   ↓
GitHub
   ↓
Projects
   ↓
Coding
   ↓
Interview
   ↓
Performance
   ↓
AI Memory
   ↓
Personalized Roadmap
   ↓
Placement Score
   ↓
Next Recommended Action
   ↓
Continuous Improvement
```

This creates a continuous feedback loop.

---

# ⭐ Key Features

* 🤖 Multi-Agent AI Architecture
* 📄 AI Resume Analyzer
* 🎤 AI Mock Interview
* 🎙️ Voice Mock Interview
* 🗺️ Personalized AI Roadmap
* 💻 AI Coding Coach
* 💼 Job Match System
* 🐙 GitHub Profile Analyzer
* 📦 Project Analyzer
* 🧠 AI Memory
* 📊 Personalized Dashboard
* 🔥 Learning Streak
* 📈 Skill Progress Tracking
* 🎯 Placement Readiness Score
* 🔐 JWT Authentication
* 🗄️ MongoDB Database
* 🧠 Vector Database Memory
* ☁️ Cloud Deployment

---

# 🔒 Security

The system should implement:

* JWT authentication
* Password hashing with bcrypt
* Protected API routes
* Environment variables
* Input validation
* File upload restrictions
* API authentication
* Secure database access

Never expose:

```text
GEMINI_API_KEY
JWT_SECRET
DATABASE_URL
GITHUB_TOKEN
```

in the frontend or GitHub repository.

---

# 🧪 Testing

Test the following:

### Authentication

```text
✓ Register
✓ Login
✓ Invalid password
✓ Protected routes
✓ Logout
```

### Resume

```text
✓ Upload resume
✓ Analyze resume
✓ Generate ATS score
✓ Save results
```

### Interview

```text
✓ Start interview
✓ Generate question
✓ Submit answer
✓ Evaluate answer
✓ Save history
```

### Roadmap

```text
✓ Generate roadmap
✓ Update progress
✓ Detect weak skills
```

### Coding

```text
✓ Generate question
✓ Submit solution
✓ Evaluate solution
✓ Save score
```

### GitHub

```text
✓ GitHub username
✓ Repository retrieval
✓ Repository analysis
```

---

# 🚀 Running the Project

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Backend

Open another terminal:

```bash
cd backend
npm install
npm run dev
```

Backend:

```text
http://localhost:5000
```

---

# 🌍 Deployment

## Frontend

Deploy the React + TypeScript frontend to:

```text
Vercel
```

## Backend

Deploy the Node.js + Express + TypeScript backend to:

```text
Render
```

## Database

Use:

```text
PostgreSQL
```

## Vector Database

Use:

```text
ChromaDB
```

or:

```text
Pinecone
```

---

# 📌 Future Enhancements

Possible future improvements:

* Real-time job recommendations
* LinkedIn integration
* More programming languages
* Advanced code execution
* AI-generated project ideas
* AI-generated resume rewriting
* Email job alerts
* Company-specific interview preparation
* Behavioral interview analysis
* Advanced voice sentiment analysis
* More advanced agent orchestration
* Mobile application
* Placement prediction using historical data

---

# 👨‍💻 Development Philosophy

Build the application incrementally.

### MVP

```text
Authentication
       ↓
Dashboard
       ↓
Resume Agent
       ↓
Interview Agent
       ↓
Roadmap Agent
       ↓
Coding Agent
       ↓
Placement Score
```

### Advanced Version

```text
MVP
 ↓
GitHub Agent
 ↓
Project Analyzer
 ↓
AI Memory
 ↓
ChromaDB
 ↓
Voice Interview
 ↓
Job Match
 ↓
Deployment
```

This approach ensures that a working application is available before implementing the more complex AI components.

---

# 📜 License

This project is developed for educational and final-year academic purposes.

---

# 👨‍🎓 Project Type

**Final Year B.Tech Information Technology Project**

### Project Category

```text
Artificial Intelligence
Multi-Agent Systems
Generative AI
Web Development
Career Intelligence
```

### Core Technologies

```text
React + TypeScript
Node.js + Express + TypeScript
MongoDB
Gemini API
ChromaDB / Pinecone
JWT
Tailwind CSS
GitHub API
Vercel
Render
```

---
