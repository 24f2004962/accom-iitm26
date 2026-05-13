# CampusOps — Full Deployment Guide

## What gets deployed

| Service | URL | Purpose |
|---|---|---|
| **Web Backend + Admin** | `https://accom-iitm26.onrender.com` | Express API + React Admin Portal |
| **Mobile App (Expo Go)** | EAS build / Expo Go | Student + Staff app for Android/iOS |

Both point to the same backend. The mobile app reads `extra.apiUrl` from `app.json`.

---

## Part 1 — Backend + Web Admin on Render.com

### Why it was broken
The build command was missing `pnpm --filter @workspace/web-admin run build`, so
`artifacts/web-admin/dist/` was never created. The server started in production mode
looking for that dist folder → ENOENT crash.

**This is now fixed** via `render.yaml`. Redeploy and it will work.

### Step-by-step Render.com deployment

#### 1. Connect your GitHub repo
1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repository
3. Render will detect `render.yaml` automatically — select **"Use render.yaml"**

#### 2. Set environment variables on Render
In your Render service → **Environment** tab, add:

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Your Postgres URL | Create a Render Postgres DB (free tier ok for testing) |
| `JWT_SECRET` | `f6abfd33b3d2b80c0f5f95a966c729a4a4475f307bd087b3a77911a4c4924327` | Or generate your own |
| `NODE_ENV` | `production` | Required for serving web admin |
| `SEED_REAL_DATA` | `true` | Loads 3075 students + 52 dept members on first boot |
| `PORT` | `8080` | Must match render.yaml |

> After first boot with real data loaded, change `SEED_REAL_DATA` to `false` to skip re-seeding on every restart.

#### 3. Set up a Render PostgreSQL database
1. Render Dashboard → **New → PostgreSQL** (free tier)
2. Copy the **Internal Database URL** (not external — internal is faster and free)
3. Paste it as `DATABASE_URL` in your Web Service environment

#### 4. Deploy
Render auto-deploys when you push to GitHub. First deploy takes ~3–5 minutes.

Build steps that happen automatically:
```
pnpm install
pnpm build (api-server)
pnpm build (web-admin Vite)
pnpm db:push (creates all tables)
node artifacts/api-server/dist/index.cjs
```

#### 5. Verify it works
- Health check: `https://accom-iitm26.onrender.com/api/health` → `{"status":"ok"}`
- Web Admin: `https://accom-iitm26.onrender.com/` → Login page
- Login with `superadmin@iitm.ac.in` / `123456`

---

### Preventing cold-start lag (Render free tier)

Render free tier sleeps after 15 minutes of inactivity → 30–60 second cold start delay.

**Option A — Upgrade to Render Starter ($7/month)**
No cold starts. Recommended for production use.

**Option B — Keep-alive ping (free)**
Use [cron-job.org](https://cron-job.org) (free):
1. Sign up → **Create cronjob**
2. URL: `https://accom-iitm26.onrender.com/api/health`
3. Schedule: every **14 minutes**
4. This keeps the service warm 24/7 at no cost.

**Option C — UptimeRobot (free)**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor → HTTP(s) → URL: `https://accom-iitm26.onrender.com/api/health`
3. Interval: **5 minutes**

---

## Part 2 — Mobile App (Expo)

### How the app connects to the backend
`artifacts/mobile/app.config.js` sets `extra.apiUrl` to:
```
EXPO_PUBLIC_API_URL env var  →  or  →  https://accom-iitm26.onrender.com/api
```

The app always talks to the deployed Render backend. Make sure Render is working first.

### Option A — Expo Go (Quick testing, no build needed)

1. Install **Expo Go** on your Android or iOS device from the app store
2. In Replit, start the **"Expo Go (Tunnel)"** workflow
3. Scan the QR code shown in the terminal with your phone
4. The app loads and connects to `https://accom-iitm26.onrender.com/api`

> **Auth error in Expo Go?** It means the Render backend is down/returning errors.
> Fix the Render deployment first, then Expo Go will work automatically.

### Option B — EAS Build (Production APK / IPA)

This creates a real installable app (`.apk` for Android, `.ipa` for iOS).

#### Prerequisites
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login
```

> Your EAS project is already configured: `projectId: 0533180b-87ac-4b76-82a8-c48de7d426c7`

#### Build Android APK (install on any Android phone)
```bash
cd artifacts/mobile

# Build a preview APK (internal distribution, no Google Play needed)
EXPO_PUBLIC_API_URL=https://accom-iitm26.onrender.com/api \
  eas build --platform android --profile preview
```

EAS builds in the cloud (~10–15 minutes). You get a download link when done.

#### Build iOS (requires Apple Developer account, $99/year)
```bash
cd artifacts/mobile
EXPO_PUBLIC_API_URL=https://accom-iitm26.onrender.com/api \
  eas build --platform ios --profile preview
```

#### Production build (for Google Play / App Store)
```bash
cd artifacts/mobile
EXPO_PUBLIC_API_URL=https://accom-iitm26.onrender.com/api \
  eas build --platform all --profile production
```

### Option C — Direct APK download (fastest for testing)

After your EAS build completes:
1. Go to [expo.dev](https://expo.dev) → your project
2. Click the latest build → **Download**
3. Install the `.apk` on Android (enable "Install from unknown sources")

---

## Real Data Summary

After deployment with `SEED_REAL_DATA=true`:

| Table | Count |
|---|---|
| Hostels | 13 real IITM hostels |
| Students | 3,075 real students |
| Dept members | 52 (volunteers, admins, superadmins) |

### Demo login credentials (all password: `123456`)
| Email | Role |
|---|---|
| `superadmin@iitm.ac.in` | Super Admin (full access) |
| `admin@iitm.ac.in` | Admin |
| `coordinator@iitm.ac.in` | Coordinator |
| `volunteer@iitm.ac.in` | Volunteer |
| `student@iitm.ac.in` | Student |

### Real user logins
- **Department members**: email = as in data file, password = email prefix (e.g. `21f3003255`)
- **Students**: email = `{rollnumber}@ds.study.iitm.ac.in`, password = roll number lowercase

---

## Performance Checklist

| Item | Status |
|---|---|
| GZIP compression | ✅ Enabled |
| Rate limiting | ✅ 5000 req/15min general, 500 auth |
| DB connection pooling | ✅ max 10 connections |
| Static file serving | ✅ Express serves web-admin dist |
| Health check endpoint | ✅ `/api/health` |
| Keep-alive ping | Set up cron-job.org (see above) |

---

## Render.com URL Structure

```
https://accom-iitm26.onrender.com/          → Web Admin Portal (login page)
https://accom-iitm26.onrender.com/api       → REST API root
https://accom-iitm26.onrender.com/api/health → Health check (always returns 200)
https://accom-iitm26.onrender.com/api/auth/login → POST login
```

---

## Troubleshooting

### "ENOENT: no such file or directory ... web-admin/dist/index.html"
Build command wasn't building the web admin. Fixed in `render.yaml` — redeploy.

### "No data / empty tables"
Set `SEED_REAL_DATA=true` in Render env vars and redeploy. Change back to `false` after first boot.

### Expo Go auth error
1. Check `https://accom-iitm26.onrender.com/api/health` — is it returning `{"status":"ok"}`?
2. If it returns an HTML error page → Render backend is broken (redeploy)
3. If health check passes but login fails → Wrong credentials or database is empty

### App is slow / timing out
1. Render free tier cold start — set up keep-alive ping (see above)
2. Check Render logs for database connection errors
3. Make sure DATABASE_URL is the **Internal** Render Postgres URL (not External)
