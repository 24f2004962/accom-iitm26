# CampusOps — Railway Deployment Guide

## What Gets Deployed

**One Railway service** handles everything:
- The **Express API** (all `/api/*` routes)
- The **Web Admin Portal** (served as static files from the same domain)

The **mobile app** (Expo) is NOT deployed to Railway — it runs on users' phones via Expo Go or an EAS-built APK/IPA, and talks to the Railway API.

---

## Step 1 — Push your code to GitHub

Make sure your latest code is pushed to GitHub. Railway deploys from a GitHub repo.

---

## Step 2 — Create the Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select your repository
4. Railway will detect `nixpacks.toml` automatically — no framework selection needed

---

## Step 3 — Add a PostgreSQL Database

In your Railway project:

1. Click **New** → **Database** → **PostgreSQL**
2. Railway creates a Postgres instance and gives it a `DATABASE_URL`
3. Click on the **Postgres** service → **Variables** tab
4. Copy the `DATABASE_URL` value

---

## Step 4 — Set Environment Variables

Click on your **API service** → **Variables** tab and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Paste from the Postgres service (see Step 3) |
| `JWT_SECRET` | Any long random string (e.g. 64 hex chars) |
| `NODE_ENV` | `production` |
| `AUTO_SEED` | `true` (creates demo accounts on first boot) |
| `PORT` | `8080` |

> To generate a strong JWT_SECRET, run this in your terminal:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Step 5 — Deploy

Railway auto-deploys when you push to your GitHub branch. The build does:
1. Installs all pnpm dependencies
2. Pushes the database schema (creates all tables)
3. Builds the Web Admin Portal (Vite)
4. Starts the Express server (serves API + Web Admin)

Watch the build logs in Railway — it takes ~2–3 minutes on first deploy.

---

## Step 6 — Get Your Railway URL

Once deployed, Railway gives you a URL like:
```
https://campusops-production.up.railway.app
```

- **Web Admin Portal**: `https://your-app.up.railway.app/` (the root URL)
- **API**: `https://your-app.up.railway.app/api`
- **Health check**: `https://your-app.up.railway.app/api/health`

---

## Step 7 — Link the Mobile App

Update `artifacts/mobile/app.config.js` — set `EXPO_PUBLIC_API_URL` to your Railway API URL:

```
EXPO_PUBLIC_API_URL=https://your-app.up.railway.app/api
```

Either:
- **Option A (Replit secret)**: Add `EXPO_PUBLIC_API_URL` in Replit Secrets — Expo picks it up automatically
- **Option B (hardcode)**: Edit `app.config.js` line 3 and replace the URL directly

After updating, restart the Expo workflow so the mobile app uses the new URL.

---

## Demo Accounts (after AUTO_SEED)

All accounts use password `123456`:

| Email | Role |
|---|---|
| `superadmin@iitm.ac.in` | Super Admin |
| `admin@iitm.ac.in` | Admin |
| `coordinator@iitm.ac.in` | Coordinator |
| `volunteer@iitm.ac.in` | Volunteer |
| `student@iitm.ac.in` | Student |

---

## Re-deploying After Code Changes

Just push to GitHub — Railway auto-redeploys. No manual steps needed.

---

## Removing Unused Railway Services

If Railway created extra services (mobile, mockup-sandbox) automatically from the monorepo:
1. Click on the unwanted service in Railway
2. Go to **Settings** → scroll to the bottom → **Delete Service**

Keep only the **API service** and **PostgreSQL** database.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails with "relation does not exist" | Check `DATABASE_URL` is set correctly |
| Web Admin shows blank page | Check build logs — Vite build may have failed |
| Mobile can't connect | Verify `EXPO_PUBLIC_API_URL` ends with `/api` and has no trailing slash |
| Login fails | Set `AUTO_SEED=true` and redeploy to create demo accounts |
