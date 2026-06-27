# Pins & Needles — Edinburgh Fringe Submissions

A Next.js submission platform for comedians applying to **Pins & Needles**, the tattoo-fuelled comedy showcase at Edinburgh Fringe.

Built entirely on **free tiers**: Vercel Hobby plan + Vercel Postgres (Neon). No paid services required.

---

## Features

- **Public submission page** (`/`) — comedians submit their name and a video link
- **Admin dashboard** (`/admin`) — password-protected, no external auth service
  - Table of all submissions with search
  - Clickable video links
  - Status dropdown per row (new / reviewed / contacted / booked / declined)
  - Editable admin notes
  - Summary counts by status
  - Logout

---

## 1. Deploy to Vercel

### Step 1 — Push to GitHub
Push this repo to GitHub (public or private).

### Step 2 — Create a Vercel project
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** (first deploy may fail until the DB is connected — that's fine)

### Step 3 — Add free Vercel Postgres
1. Vercel project dashboard → **Storage** tab
2. **Create Database** → **Postgres** (Neon) — free tier
3. Name it anything (e.g. `comedysub-db`) → **Create & Continue** → connect to your project
4. Vercel automatically injects the required `POSTGRES_*` env vars

### Step 4 — Add ADMIN_PASSWORD
1. Vercel project → **Settings** → **Environment Variables**
2. Add: `ADMIN_PASSWORD` = your chosen password
3. Apply to Production, Preview, and Development

### Step 5 — Redeploy
Go to **Deployments** → latest deployment → **Redeploy**. Done.

The `submissions` table is created automatically on the first request (`CREATE TABLE IF NOT EXISTS`).

---

## 2. Local Development

```bash
npm install

# Copy env vars from Vercel Dashboard → Storage → your DB → .env.local tab
# Then add your admin password:
echo "ADMIN_PASSWORD=yourpassword" >> .env.local

npm run dev
```

- Public page: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin

---

## 3. Project Structure

```
app/
├── layout.tsx              Root layout
├── page.tsx                Public submission page
├── globals.css             Global styles (dark theme)
├── actions.ts              Server Actions (submit, login, update)
├── lib/
│   └── db.ts               Vercel Postgres helpers + types
├── _components/
│   └── WebForm.tsx         Comedian submission form (client)
└── admin/
    ├── page.tsx            Admin page (server — auth check)
    ├── LoginForm.tsx       Admin login form (client)
    └── AdminDashboard.tsx  Admin dashboard (client)
```

---

## 4. Dependencies

```bash
npm install @vercel/postgres
```

- `next` — Next.js App Router
- `react` + `react-dom`
- `@vercel/postgres` — Vercel Postgres client
- `typescript`, `tailwindcss`, `eslint`
