# ⚡ QuizzPulse — Live Interactive Quiz Web Application

QuizzPulse is a real-time full-stack quiz platform featuring dual Admin and Student roles, JWT authentication, server-synchronized countdown timers, Socket.io real-time updates, automated leaderboard ranking, and CSV results export.

---

## 🚀 Key Features

### 👑 Admin Features
- **Secure Authentication**: JWT-based login and registration with Admin role.
- **Quiz Creator Wizard**: Create tests with custom title, description, total test duration, per-question duration override, and interactive question builder (single and multi-correct MCQ choices, custom marks).
- **Auto Join Code & Shareable Link**: Instant 6-character code (e.g., `AB12CD`) and shareable link `http://localhost:5173/join/AB12CD`.
- **Live Control Room Dashboard**:
  - Real-time list of joined students in the waiting room.
  - Live submission progress counter.
  - "Start Live Quiz" button broadcasting server-wide synchronized start timestamps.
  - "End Quiz Early" override.
- **Results & Analytics**:
  - Recharts performance distribution graph.
  - Auto-ranked leaderboard (Score desc, Tie-breaker by Time Taken asc).
  - One-click **CSV Report Export**.

### 🎓 Student Features
- **Registration & Login**: Student role with persistent sessions.
- **Easy Room Entry**: Enter 6-character code or join via direct URL link.
- **Live Waiting Lobby**: Waiting indicator showing connected classmates until host starts the test.
- **Anti-Tampering Timed Test Engine**:
  - Server-synchronized countdown clock (unaffected by local device clock changes).
  - Question palette navigation (view answered vs unanswered).
  - Single & multi-select MCQ inputs.
  - Auto-submission on time expiry.
- **Instant Results & Review**:
  - Celebratory confetti explosion.
  - Comprehensive question-by-question correctness audit.
  - Real-time live leaderboard ranking.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Socket.io Client, Recharts, Canvas Confetti.
- **Backend**: Node.js, Express, Socket.io Server, JWT, bcryptjs, Mongoose, json2csv.
- **Database**: MongoDB (with automatic fallback to `mongodb-memory-server` if no local MongoDB service is running).

---

## 💻 How to Run Locally

### 1. Start Backend Server
```bash
cd backend
npm start
```
*Backend runs on `http://localhost:5000` with MongoDB / MongoMemoryServer.*

### 2. Start Frontend App
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Testing the Live Quiz Flow

1. Open `http://localhost:5173` and click **Get Started** -> Register as an **Admin Host**.
2. Click **Create New Quiz** and build a quiz with 2-3 questions.
3. Click **Save & Launch Quiz**, then open **Live Monitor**. Copy the generated 6-character join code.
4. Open an **Incognito Browser Window**, go to `http://localhost:5173`, and register/login as a **Student**.
5. Click **Join Quiz**, enter the join code, and enter the waiting room. Notice the student appears immediately on the Admin's Live Monitor!
6. Click **START LIVE QUIZ NOW** on the Admin screen. Both screens sync in real time and the countdown clock starts ticking!
7. Complete the quiz as a student, submit, and watch the live leaderboard update on both Admin and Student screens!

---

## 🌐 Production Deployment

- **Backend Service**: Deployed on Render (`https://quize-mona.onrender.com`)
- **Frontend Client**: Prepared for Vercel / Render Static Deployment with SPA rewrite configuration (`vercel.json`)
