# CampusOps — Complete Project Guide
### IIT Madras BS Student Hostel Management Portal

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Role System & Permissions](#4-role-system--permissions)
5. [Demo Accounts](#5-demo-accounts)
6. [Database Schema](#6-database-schema)
7. [Full API Reference](#7-full-api-reference)
8. [Mobile App — All Screens](#8-mobile-app--all-screens)
9. [Web Admin Portal — All Pages](#9-web-admin-portal--all-pages)
10. [Running Locally (Development)](#10-running-locally-development)
11. [Deploying the Backend to Railway](#11-deploying-the-backend-to-railway)
12. [Deploying the Web Admin](#12-deploying-the-web-admin)
13. [Building the Mobile App (APK / EAS)](#13-building-the-mobile-app-apk--eas)
14. [Environment Variables Reference](#14-environment-variables-reference)
15. [Post-Deployment Checklist](#15-post-deployment-checklist)
16. [Features You Can Add Next](#16-features-you-can-add-next)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Project Overview

CampusOps is a full-stack hostel management system for the IIT Madras BS (Online Degree) program. It is designed to handle **15,000–20,000 concurrent students** during on-campus sessions.

| Feature | Description |
|---|---|
| Attendance Tracking | Volunteers check students in/out — tap to mark, tap again to revoke |
| Inventory Management | Track mattress, bedsheet, pillow given to each student; lock when submitted |
| Mess Card Issuance | Per-student toggle: card given / not given |
| Staff Shift Management | Staff go Active/Inactive; auto-inactive after 10 min of no heartbeat |
| Lost & Found | Any user can report; staff update status |
| Announcements | Coordinators post hostel-level announcements |
| Global Search | Search students by name, roll number, room |
| CSV Import | Bulk upload students/staff/assignments in one go |
| PDF & CSV Export | On-demand reports |
| Activity Logs | Real-time log of every staff action |
| Pending Approvals | Students register → super admin approves and assigns role |

---

## 2. Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│  ┌─────────────────────┐    ┌────────────────────────┐ │
│  │  Expo React Native  │    │  Web Admin Portal       │ │
│  │  (iOS / Android)    │    │  React + Vite + TW4     │ │
│  │  Expo SDK 55        │    │  port 5000 (dev)        │ │
│  └──────────┬──────────┘    └───────────┬────────────┘ │
└─────────────┼─────────────────────────── ┼─────────────┘
              │ JWT Bearer                 │ JWT Bearer
              │ EXPO_PUBLIC_API_URL        │ VITE_API_URL (prod)
              │                           │ /api proxy  (dev)
┌─────────────▼─────────────────────────── ▼─────────────┐
│         EXPRESS 5 API SERVER  (port 8080)                │
│  Rate limit · gzip · trust proxy · JWT auth · 20 routes │
└──────────────────────────┬──────────────────────────────┘
                           │ Drizzle ORM  pool max:20
┌──────────────────────────▼──────────────────────────────┐
│  PostgreSQL  (Replit built-in in dev · Railway in prod)  │
└──────────────────────────────────────────────────────────┘
```

### Key Package Versions

| Package | Version |
|---|---|
| Node.js | 24 |
| TypeScript | ~5.9 |
| Express | 5.x |
| Drizzle ORM | ^0.45 |
| Expo SDK | 55 |
| Expo Router | v6 |
| React | 19.1 |
| Vite | 7.x |
| Tailwind CSS | 4.x |
| @tanstack/react-query | ^5.100 |
| Zod | ^3.25 |

---

## 3. Repository Structure

```
workspace/
├── artifacts/
│   ├── api-server/               # Express REST API
│   │   └── src/
│   │       ├── app.ts            # Middleware: CORS, rate limit, compression
│   │       ├── index.ts          # Cluster entry, auto-seed
│   │       ├── autoSeed.ts       # Creates demo accounts if AUTO_SEED=true
│   │       ├── lib/auth.ts       # JWT helpers + role guards
│   │       └── routes/           # 20+ route modules (see API section)
│   │
│   ├── mobile/                   # Expo React Native app
│   │   ├── app/(tabs)/           # Bottom tab screens
│   │   ├── app/admin/            # Staff/admin screens
│   │   ├── app/auth.tsx          # Login / register
│   │   └── context/AuthContext.tsx  # JWT + API fetch helper
│   │
│   └── web-admin/                # Browser admin portal
│       └── src/
│           ├── lib/api.ts        # Fetch wrapper (uses VITE_API_URL in prod)
│           ├── context/AuthContext.tsx
│           ├── components/       # Layout, UI primitives
│           └── pages/            # 11 pages
│
├── lib/db/                       # Drizzle schema + DB connection
├── railway.json                  # Railway deployment config
├── nixpacks.toml                 # Railway build config (Node 24)
└── pnpm-workspace.yaml
```

---

## 4. Role System & Permissions

| Action | Student | Volunteer | Coordinator | Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| View hostel info, notifications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Report lost & found | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mark attendance (check-in/out) | | ✓ | ✓ | ✓ | ✓ |
| Give / track inventory | | ✓ | ✓ | ✓ | ✓ |
| Toggle mess card | | ✓ | ✓ | ✓ | ✓ |
| Go active / inactive (heartbeat) | | ✓ | ✓ | ✓ | ✓ |
| Global student search | | ✓ | ✓ | ✓ | ✓ |
| Post announcements | | | ✓ | ✓ | ✓ |
| Update lost & found status | | | | ✓ | ✓ |
| CSV export | | | | ✓ | ✓ |
| View all activity logs | | | | ✓ | ✓ |
| CSV import (students/mess/hostel/staff) | | | | | ✓ |
| PDF export | | | | | ✓ |
| Master student table | | | | | ✓ |
| Manage / approve staff accounts | | | | | ✓ |

---

## 5. Demo Accounts

All demo accounts use password `123456`.

| Email | Role |
|---|---|
| `superadmin@iitm.ac.in` | Super Admin — full access |
| `admin@iitm.ac.in` | Admin |
| `coordinator@iitm.ac.in` | Coordinator (Bhadra + 2nd hostel) |
| `volunteer@iitm.ac.in` | Volunteer (Bhadra) |
| `volunteer2@iitm.ac.in` | Volunteer (2nd hostel) |
| `student@iitm.ac.in` | Student |

---

## 6. Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `users` | All accounts — students + all staff |
| `hostels` | Hostel records |
| `checkins` | Today's check-in / check-out events |
| `student_inventory` | Mattress, bedsheet, pillow, mess card state |
| `attendance` | Legacy daily attendance records |
| `time_logs` | Staff activity log entries |
| `lost_items` | Lost & found reports |
| `announcements` | Hostel/campus announcements |
| `notifications` | Per-user notification inbox |

### Key Columns

**`users`**: id, name, email, passwordHash, role (student/volunteer/coordinator/admin/superadmin/pending), rollNumber, hostelId, roomNumber, assignedMess, assignedHostelIds (json), isActive, lastActiveAt, createdAt

**`checkins`**: id, studentId, volunteerId, hostelId, date (YYYY-MM-DD), checkInTime, checkOutTime, note

**`student_inventory`**: studentId, hostelId, mattress, bedsheet, pillow, mattressSubmitted, bedsheetSubmitted, pillowSubmitted, inventoryLocked, messCard, lockedBy, lockedAt

---

## 7. Full API Reference

**Base URL:** `/api`  
All endpoints except `/health`, `/auth/login`, `/auth/register` require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | None | Returns `{ token, user }` |
| POST | `/auth/register` | None | Register as pending user |
| GET | `/auth/me` | Any | Current user profile |
| POST | `/auth/logout` | Any | Record logout timelog |

### Students
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/students` | Volunteer+ | List (filter: hostelId, search, limit, offset) |
| GET | `/students/:id` | Any | Single student |
| POST | `/students` | Admin+ | Create student |
| PATCH | `/students/:id` | Admin+ | Update student |

### Hostels
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/hostels` | Any | All hostels |
| GET | `/hostels/:id` | Any | Detail + student count |

### Check-in / Check-out
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/checkins/:studentId` | Volunteer+ | Check student in |
| PATCH | `/checkins/:id/checkout` | Volunteer+ | Check student out |
| PATCH | `/checkins/:id/revoke-checkout` | Volunteer+ | Undo checkout |
| DELETE | `/checkins/:studentId/today` | Volunteer+ | Revoke full check-in |
| GET | `/checkins/:studentId/today` | Volunteer+ | Today's check-in + inventory |
| GET | `/checkins` | Volunteer+ | List (filter: date, hostelId) |
| GET | `/checkins/stats` | Volunteer+ | Today's counts |

### Inventory
| Method | Path | Auth | Description |
|---|---|---|---|
| PATCH | `/attendance/inventory/:studentId` | Volunteer+ | Update items (blocked if locked) |
| POST | `/attendance/inventory/:studentId/submit` | Volunteer+ | Lock inventory permanently |
| POST | `/attendance/inventory/:studentId/revoke-item` | Volunteer+ | Undo single item |
| POST | `/attendance/inventory/:studentId/revoke` | Volunteer+ | Unlock + reset all |
| PATCH | `/attendance/mess-card/:studentId` | Volunteer+ | Toggle mess card |

### Staff Status
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/staff/go-active` | Volunteer+ | Go active `{ remark }` |
| POST | `/staff/go-inactive` | Volunteer+ | Go inactive |
| POST | `/staff/heartbeat` | Volunteer+ | Keep alive (every 5 min) |
| GET | `/staff/me-status` | Volunteer+ | Own status |
| GET | `/staff/active-list` | Volunteer+ | Active in last 10 min |
| GET | `/staff/all` | Admin+ | All staff with online/offline |
| GET | `/staff/logs` | Admin+ | Activity logs |

### Lost & Found
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/lostitems` | Any | List all |
| POST | `/lostitems` | Any | Report (title, description, location) |
| PATCH | `/lostitems/:id` | Admin+ | Update status |
| DELETE | `/lostitems/:id` | Own or Admin+ | Delete |

### Announcements
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/announcements` | Any | List |
| POST | `/announcements` | Coordinator+ | Create |
| PATCH | `/announcements/:id` | Coordinator+ | Edit |
| DELETE | `/announcements/:id` | Coordinator+ | Delete |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | Any | Own inbox |
| PATCH | `/notifications/:id/read` | Any | Mark read |
| POST | `/notifications/read-all` | Any | Mark all read |

### CSV Import — Super Admin only
| Method | Path | Description |
|---|---|---|
| POST | `/import/students` | Bulk import students (multipart file) |
| POST | `/import/mess` | Bulk mess assignment |
| POST | `/import/hostel-assignment` | Bulk hostel + room assignment |
| POST | `/import/staff?purge=true\|false` | Bulk staff import. Accepts file **or** JSON `{ rows }`. Columns: Email, Name, Contact Number, Gender, Role, Password |
| GET | `/import/template/students` | Download template |
| GET | `/import/template/mess` | Download template |
| GET | `/import/template/hostel-assignment` | Download template |
| GET | `/import/template/staff` | Download template |

### CSV Export — Admin+
| Method | Path | Description |
|---|---|---|
| GET | `/export/students.csv` | All students |
| GET | `/export/attendance.csv?date=YYYY-MM-DD` | Attendance for a date |
| GET | `/export/inventory.csv` | Inventory state |
| GET | `/export/full-report.csv` | Combined report |
| GET | `/export/timelogs` | Activity logs |

### PDF Export — Super Admin
| Method | Path | Description |
|---|---|---|
| GET | `/pdf/students` | Students PDF |
| GET | `/pdf/attendance?date=YYYY-MM-DD` | Attendance PDF |
| GET | `/pdf/activity-logs` | Staff logs PDF |
| GET | `/pdf/full-report` | Full campus report PDF |

### Approvals — Super Admin
| Method | Path | Description |
|---|---|---|
| GET | `/approvals/pending` | Pending registrations |
| GET | `/approvals/count` | Count (for badge) |
| PATCH | `/approvals/:id/approve` | Approve + assign role |
| DELETE | `/approvals/:id/reject` | Reject + delete user |

### Other
| Method | Path | Description |
|---|---|---|
| GET | `/reports/summary` | Counts: students, hostels, announcements, items |
| GET | `/search?q=&limit=&offset=` | Global paginated student search |
| GET/POST | `/timelogs` | Activity log entries |

---

## 8. Mobile App — All Screens

### Bottom Tabs (all roles)

| Screen | File | Description |
|---|---|---|
| Home | `(tabs)/index.tsx` | Role-adaptive: students see hostel info; staff see shift controls + stats |
| Attendance / Lost & Found | `(tabs)/lostandfound.tsx` | Staff: toggle check-in/out per student. Students: see own status + report lost items |
| Hostel | `(tabs)/hostel.tsx` | Browse students, room assignments |
| Notifications | `(tabs)/notifications.tsx` | Inbox with mark-read |
| Profile | `(tabs)/profile.tsx` | View profile, access admin tools, logout |

### Staff & Admin Screens (from Profile tab)

| Screen | File | Min Role |
|---|---|---|
| Global Search | `admin/search.tsx` | Volunteer |
| Staff Status | `admin/staff-status.tsx` | Volunteer |
| Activity Logs | `admin/activity-logs.tsx` | Admin |
| Inventory Table | `admin/inventory-table.tsx` | Volunteer |
| Reports | `admin/reports.tsx` | Admin |
| CSV Import | `admin/csv-import.tsx` | Super Admin |
| Master Table | `admin/master-table.tsx` | Admin |
| Manage Staff | `admin/manage-admins.tsx` | Super Admin |

---

## 9. Web Admin Portal — All Pages

Access via browser at port 5000 (dev) or your deployed domain (prod).

| Page | Min Role | Features |
|---|---|---|
| Login | — | Email/password, demo quick-fill buttons |
| Dashboard | Volunteer+ | Stats cards, hostel bar chart, attendance pie, active staff, recent activity |
| Students | Volunteer+ | Searchable table, hostel/mess filters, profile modal, CSV export |
| Attendance | Volunteer+ | Date picker, hostel filter, check-out/undo/revoke per row, CSV export |
| Hostels | Volunteer+ | Card grid with capacity bar |
| Staff | Volunteer+ | Online/offline status, add staff modal |
| Lost & Found | Volunteer+ | Status filter, add item, change status |
| Master Table | Admin+ | Paginated full student list, all filters, export |
| CSV Import | Super Admin | 4-type import, drag-to-upload, purge option, result summary |
| Activity Logs | Admin+ | Live 20s refresh, type/name filter, CSV + PDF export |
| Reports | Admin+ | Charts + all CSV/PDF download buttons |
| Manage Staff | Super Admin | **Create staff with custom password**, approve/reject pending users |

---

## 10. Running Locally (Development)

### Prerequisites
- Node.js 20 or higher (24 recommended)
- pnpm 10+
- A PostgreSQL database

### Step 1 — Install dependencies
```bash
pnpm install --no-frozen-lockfile
```

### Step 2 — Set up environment variables

Create `artifacts/api-server/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/campusops
JWT_SECRET=replace-this-with-a-random-64-char-string
PORT=8080
NODE_ENV=development
AUTO_SEED=true
```

> To generate a JWT secret: `openssl rand -hex 32`

### Step 3 — Push the database schema
```bash
pnpm --filter @workspace/db run push
```

### Step 4 — Start the backend
```bash
cd artifacts/api-server
NODE_ENV=development ../../node_modules/.bin/tsx ./src/index.ts
```
→ Runs at http://localhost:8080

Verify it works:
```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

### Step 5 — Start the web admin
```bash
cd artifacts/web-admin
PORT=5000 pnpm dev
```
→ Opens at http://localhost:5000  
→ `/api` is proxied automatically to `localhost:8080` (no env var needed in dev)

### Step 6 — Start the mobile app
```bash
cd artifacts/mobile
pnpm exec expo start --tunnel
```
Scan the QR code with Expo Go on your phone.

> **Phone can't reach localhost?** Set `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8080/api` or use the Railway deployed URL.

---

## 11. Deploying the Backend to Railway

### Overview
The backend (`artifacts/api-server/`) is a Node 24 + Express 5 server. Railway builds it using `nixpacks.toml` and `railway.json` which are already configured in the repo root.

---

### Step 1 — Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Connect your GitHub account
4. Select the `accom-iitm` repository and click **Deploy Now**

---

### Step 2 — Add PostgreSQL

1. Inside your Railway project click **+ New**
2. Select **Database → Add PostgreSQL**
3. Wait ~30 seconds for it to provision
4. Click the PostgreSQL service → **Connect** tab
5. Copy the value shown as **DATABASE_URL** (starts with `postgresql://`)

---

### Step 3 — Set environment variables

Click your **API server service** (not the database) → **Variables** tab → **Add Variable**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Paste the PostgreSQL URL from Step 2 |
| `JWT_SECRET` | Run `openssl rand -hex 32` locally and paste the output |
| `PORT` | `8080` |
| `NODE_ENV` | `production` |
| `AUTO_SEED` | `true` ← creates the 6 demo accounts on first boot |

> **Important:** `JWT_SECRET` must be the same value every time the server restarts. Pick one and keep it. If it changes, all existing login tokens stop working.

---

### Step 4 — Configure the service root (if needed)

Railway may try to build from the repo root — that is correct. The `railway.json` at the project root already tells Railway:
- **Build**: `pnpm install --no-frozen-lockfile && pnpm --filter @workspace/db run push`
- **Start**: `NODE_ENV=production node_modules/.bin/tsx artifacts/api-server/src/index.ts`

No extra configuration needed in the Railway dashboard for the build.

---

### Step 5 — Force push to GitHub (if not yet done)

Replit's git history is shallow and may diverge from GitHub's. Fix it once:

```bash
# In Replit Shell — replace YOUR_TOKEN with a GitHub Personal Access Token
git push https://YOUR_TOKEN@github.com/24f2004962/accom-iitm main --force
```

**How to get a GitHub PAT:**
1. github.com → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
2. Click **Generate new token**
3. Set **Repository access** → Only select repositories → `accom-iitm`
4. Under **Permissions → Contents** → select **Read and write**
5. Click **Generate token** and copy it

After the push succeeds, Railway will automatically re-deploy.

---

### Step 6 — Verify the deployment

Once Railway shows the deployment as **Active**:

```bash
# Health check
curl https://YOUR-APP.railway.app/health
# Expected: {"status":"ok"}

# Login test
curl -X POST https://YOUR-APP.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@iitm.ac.in","password":"123456"}'
# Expected: {"token":"eyJ...","user":{...}}
```

If health returns OK but login fails → check that `AUTO_SEED=true` was set before first boot, and that `DATABASE_URL` is correct.

---

### Step 7 — Note your Railway URL

Railway shows your URL in the service panel, e.g.:  
`https://accom-iitm-production.up.railway.app`

Your API base URL is: `https://accom-iitm-production.up.railway.app/api`

---

## 12. Deploying the Web Admin

The web admin is a static React SPA. In production it needs to know where the Railway backend is via an environment variable.

### Option A — Netlify (free, recommended)

**1. Build locally and upload:**
```bash
cd artifacts/web-admin
VITE_API_URL=https://YOUR-APP.railway.app/api pnpm build
# Upload the dist/ folder to Netlify
```

**Or connect via GitHub:**
1. Push to GitHub (Step 5 above)
2. Go to [netlify.com](https://netlify.com) → New site → Import from Git
3. Select your repo
4. Set **Base directory** to `artifacts/web-admin`
5. **Build command**: `pnpm install --no-frozen-lockfile && pnpm build`
6. **Publish directory**: `artifacts/web-admin/dist`
7. **Environment variables**: Add `VITE_API_URL` = `https://YOUR-APP.railway.app/api`
8. Click **Deploy**

**Fix page refresh 404 (SPA routing):**  
Create `artifacts/web-admin/public/_redirects` with this one line:
```
/* /index.html 200
```

---

### Option B — Vercel (free)

1. Go to [vercel.com](https://vercel.com) → New Project → Import Git repo
2. Set **Root Directory** to `artifacts/web-admin`
3. Framework preset: **Vite**
4. **Environment variables**: Add `VITE_API_URL` = `https://YOUR-APP.railway.app/api`
5. Click **Deploy**

Vercel handles SPA routing automatically — no `_redirects` file needed.

---

### Option C — Railway second service (same project)

1. In your Railway project → **+ New → GitHub Repo** (same repo again)
2. Set root directory: `artifacts/web-admin`
3. Build command: `pnpm install --no-frozen-lockfile && pnpm build`
4. Start command: `pnpm preview --host 0.0.0.0 --port $PORT`
5. Environment variable: `VITE_API_URL` = `https://YOUR-API-SERVICE.railway.app/api`

---

### After deploying the web admin

Update the mobile app to use the Railway API URL:

In `artifacts/mobile/context/AuthContext.tsx` line 11:
```ts
const PROD_API = "https://YOUR-APP.railway.app/api";
```

---

## 13. Building the Mobile App (APK / EAS)

### Prerequisites
- Free [expo.dev](https://expo.dev) account
- EAS CLI: `npm install -g eas-cli`
- Login: `eas login`

### Step 1 — Point the app at your Railway backend

In `artifacts/mobile/context/AuthContext.tsx`:
```ts
const PROD_API = "https://YOUR-APP.railway.app/api";
```

### Step 2 — Create `eas.json` in `artifacts/mobile/`
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

### Step 3 — Build

**Android APK (for direct install / testing):**
```bash
cd artifacts/mobile
eas build --platform android --profile preview
```
Takes 5–10 minutes. You get a download link — share it with anyone to install.

**Android App Bundle (for Google Play):**
```bash
eas build --platform android --profile production
```

**iOS (requires Apple Developer account, $99/year):**
```bash
eas build --platform ios --profile production
```

### Step 4 — Test without building (Expo Go)
```bash
cd artifacts/mobile
pnpm exec expo start --tunnel
```
Scan QR code in Expo Go app. This is the fastest way to test on a real device.

---

## 14. Environment Variables Reference

### Backend (`artifacts/api-server/`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `JWT_SECRET` | ✓ | JWT signing secret — keep consistent, min 32 chars |
| `PORT` | — | Server port (default: 8080) |
| `NODE_ENV` | — | `development` or `production` |
| `AUTO_SEED` | — | `"true"` to auto-create 6 demo accounts on startup |

### Mobile (`artifacts/mobile/`)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | — | Override the hardcoded `PROD_API` in `AuthContext.tsx` |

### Web Admin (`artifacts/web-admin/`)

| Variable | Required in prod | Description |
|---|---|---|
| `VITE_API_URL` | ✓ | Full URL of the Railway API, e.g. `https://xyz.railway.app/api` — **not needed in dev** (Vite proxy handles it) |

---

## 15. Post-Deployment Checklist

Run through this after every fresh deployment:

- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] `POST /api/auth/login` with `superadmin@iitm.ac.in` / `123456` returns a token
- [ ] Web admin login page loads (no CORS errors in browser console)
- [ ] Web admin dashboard loads with data after login
- [ ] A student can log into the mobile app and see their hostel
- [ ] A volunteer can check in a student (attendance toggle works)
- [ ] PDF export generates a non-empty file
- [ ] CSV export downloads correctly
- [ ] "Add Staff" on Manage Staff page creates an account with the password you set

---

## 16. Features You Can Add Next

### High Impact

| Feature | Effort | Description |
|---|---|---|
| **Push Notifications** | Medium | FCM / Expo push — notify students when checked in or when announcements are posted |
| **QR Code Check-In** | Medium | Generate QR per student; volunteer scans to check in instantly |
| **Bulk SMS Alerts** | Medium | SMS to students not checked in by deadline via Twilio |
| **Shift Scheduling** | Medium | Plan which volunteers cover which hours |

### Attendance & Inventory

| Feature | Effort | Description |
|---|---|---|
| **Mess Attendance by Meal** | Low | B/L/D toggle per student — route already scaffolded at `/mess-attendance` |
| **Inventory History** | Low | Per-student log of all past check-ins and items |
| **Daily Email Summary** | Medium | Auto-email attendance report to coordinators every evening |
| **Overdue Inventory Alert** | Low | Flag students who checked out without returning items |

### Admin & Reporting

| Feature | Effort | Description |
|---|---|---|
| **Hostel CRUD** | Low | Add/edit/delete hostels from web admin (currently read-only) |
| **Student Self-Service** | Medium | Students see their own check-in status, raise complaints |
| **Analytics Dashboard** | Medium | Week-over-week trends, peak check-in times |
| **Complaint / Grievance System** | Medium | Students raise issues; coordinators respond and close |

### Mobile

| Feature | Effort | Description |
|---|---|---|
| **Biometric Login** | Low | Face ID / fingerprint via `expo-local-authentication` |
| **Offline Mode** | High | Cache student list; sync on reconnect |
| **Student Photo Upload** | Medium | Profile pictures via `expo-image-picker` + cloud storage |

---

## 17. Troubleshooting

### Backend

| Problem | Fix |
|---|---|
| `Cannot find module tsx` | Run `pnpm install --no-frozen-lockfile` from repo root |
| `DATABASE_URL not set` | Add it to Railway environment variables |
| `EADDRINUSE: port 8080` | Another process is using 8080. Kill it or change PORT |
| `Invalid JWT` after redeploy | Your `JWT_SECRET` changed — set it back to the original value |
| Health check passes but `/auth/login` returns 500 | Check Railway logs; likely `AUTO_SEED` failed due to DB not ready — trigger a redeploy |

### Web Admin — Auth Errors in Production

The most common cause: `VITE_API_URL` is not set.

- In **dev**: The Vite proxy forwards `/api` → backend automatically. No env var needed.
- In **production build**: There is no proxy. You **must** set `VITE_API_URL=https://YOUR-APP.railway.app/api` before building.

Check the browser Network tab — if requests go to the same domain as the admin site (not Railway), the env var is missing.

### Web Admin — 404 on Page Refresh

Add a `_redirects` file to `artifacts/web-admin/public/`:
```
/* /index.html 200
```

### Railway Push Rejected

```bash
git push https://YOUR_GITHUB_TOKEN@github.com/24f2004962/accom-iitm main --force
```

### Mobile — Can't Connect to Backend

1. Confirm `PROD_API` in `AuthContext.tsx` points to your Railway URL (not localhost)
2. Confirm the Railway service is running and `/health` responds
3. Try opening the Railway URL in a browser — if it loads, the backend is up

### pnpm Install Fails

```bash
pnpm install --no-frozen-lockfile
```

### Expo Tunnel Not Working

```bash
cd artifacts/mobile
pnpm exec expo start --tunnel --clear
```

---

*Last updated: May 2026 — CampusOps v1.0*
