# 🏋️ GymPro — Gym Management System v2

A complete, modern gym management system. **No database setup needed** — data is saved automatically to a local JSON file.

---

## ✅ HOW TO RUN (3 Simple Steps)

### STEP 1 — Install Node.js (if not already installed)
- Download from: **https://nodejs.org** (click the LTS version)
- Run the installer, click Next → Next → Finish
- Restart VS Code after installing

---

### STEP 2 — Open in VS Code
1. Open **Visual Studio Code**
2. Go to `File` → `Open Folder`
3. Select the **`gym-management-system`** folder
4. Click **Open**

---

### STEP 3 — Start the App (choose one method)

#### Method A: Double-click START.bat (Windows — Easiest!)
- In your file explorer, double-click **`START.bat`**
- A terminal window opens and starts the server

#### Method B: VS Code Terminal
1. Press **Ctrl + ` ** (backtick) to open the terminal
2. Type these commands:
```bash
cd backend
npm install
node server.js
```

#### Method C: VS Code Task (Ctrl+Shift+B)
- Press **Ctrl+Shift+B** in VS Code
- Select **"🏋️ Start GymPro"**

---

### STEP 4 — Open the App
Once you see this in the terminal:
```
╔══════════════════════════════════════════════╗
║       🏋️  GYMPRO MANAGEMENT SYSTEM v2       ║
╚══════════════════════════════════════════════╝
```
Open your browser and go to: **http://localhost:3000**

---

## 🔑 Test Login Accounts

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| 👑 Admin   | admin@gympro.com   | admin123    |
| 💪 Trainer | trainer@gympro.com | trainer123  |
| 🏃 Member  | member@gympro.com  | member123   |

---

## 📁 Project Structure

```
gym-management-system/
├── START.bat              ← Double-click to run (Windows)
├── START.sh               ← Run on Mac/Linux
├── README.md
├── .vscode/
│   ├── tasks.json         ← Ctrl+Shift+B to launch
│   └── launch.json        ← F5 to debug
├── backend/
│   ├── server.js          ← Main server (all routes)
│   ├── package.json
│   ├── .env               ← Config (port, JWT secret)
│   └── data/
│       └── db.json        ← 💾 Auto-created data file
└── frontend/
    └── public/
        └── index.html     ← Complete single-page app
```

---

## 💾 Data Persistence

All data is saved automatically to `backend/data/db.json`.
- Members you add → saved ✅
- Payments recorded → saved ✅
- Sessions booked → saved ✅
- **Data survives server restarts!**

---

## 🔐 Forgot Password Flow

1. Click **"Forgot password?"** on the login page
2. Enter your email and click "Send Reset Token"
3. Look at the **server terminal** — a reset token appears:
   ```
   🔑 PASSWORD RESET TOKEN for user@email.com: ABC123XY
   ```
4. Enter that token + your new password in the reset form
5. Log in with your new password

---

## 🤖 3D Virtual Trainer

- Click **"3D Trainer"** in the sidebar
- Choose an exercise (Squat, Push-Up, Curl, Lunge, Plank, Jumping Jacks)
- Click **▶ Start** to begin the animated session
- Adjust speed with the slider
- Track reps, sets, and calories burned

---

## 👑 Admin Features

- **Dashboard** — Live stats, revenue chart, recent activity
- **Members** — Add, edit, remove members; filter by status
- **Trainers** — Add/remove personal trainers
- **Sessions** — Book and manage training sessions
- **Attendance** — Manual check-in/check-out
- **Payments** — Record and track revenue
- **Plans** — View membership tiers
- **Equipment** — Inventory management

---

## 🔧 Troubleshooting

**"npm is not recognized"**
→ Install Node.js from https://nodejs.org (LTS version), then restart VS Code

**"Port 3000 already in use"**
→ Open `backend/.env` and change `PORT=3000` to `PORT=3001`, then restart

**"Cannot find module 'express'"**
→ Run `cd backend && npm install` in the terminal first

**"Login not working"**
→ Make sure the server terminal shows "Server running". Check http://localhost:3000/health

**Data not saving?**
→ Check that `backend/data/db.json` exists. The server creates it automatically on first run.

---

## 🚀 Dev Mode (auto-restart on file changes)

```bash
cd backend
npm install
npx nodemon server.js
```

Or press **Ctrl+Shift+B** → **"🔄 Dev Mode (auto-restart)"**
