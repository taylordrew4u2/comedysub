# Pins & Needles — Edinburgh Fringe Submissions

A Next.js 15 App Router project for comedians to submit to **Pins & Needles**, the tattoo-fuelled comedy showcase at Edinburgh Fringe.

Built entirely on **free tiers**: Vercel Hobby plan + Vercel Postgres (free tier). No paid services required.

---

## Features

- **Public submission page** (`/`) with two paths:
  - **Submit via LINE** — interactive message generator + Add on LINE button (recommended for video)
  - **Submit directly** — web form that saves to Vercel Postgres, returns a reference ID
- **Admin dashboard** (`/admin`) — password-protected, no external auth service
  - Table of all submissions with search/filter
  - Clickable video links
  - Status dropdown per row (new / reviewed / contacted / booked / declined)
  - Editable admin notes with save
  - Summary counts by status
  - Logout

---

## 1. SQL — CREATE TABLE Statement

Run this once in your Vercel Postgres console (or it auto-creates on first request):

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id            SERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  location      TEXT        NOT NULL,
  bio           TEXT        NOT NULL,
  instagram     TEXT,
  has_tattoos   BOOLEAN     NOT NULL DEFAULT FALSE,
  availability  TEXT        NOT NULL,
  experience    TEXT        NOT NULL,
  video_url     TEXT,
  source        TEXT        NOT NULL DEFAULT 'web',
  status        TEXT        NOT NULL DEFAULT 'new',
  admin_notes   TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. Deploy to Vercel (Free Tier — Step by Step)

### Step 1 — Push to GitHub
Push this repository to GitHub (public or private, both work on Hobby plan).

### Step 2 — Create a Vercel project
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** (it will fail the first time — that's fine, we need the DB next)

### Step 3 — Add free Vercel Postgres
1. In your Vercel project dashboard → **Storage** tab
2. Click **Create Database** → choose **Postgres** (Neon) — free tier
3. Name it anything (e.g. `comedysub-db`)
4. Click **Create & Continue** → select your project → **Connect**
5. Vercel automatically adds these environment variables to your project:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`

### Step 4 — Add ADMIN_PASSWORD
1. In your Vercel project → **Settings** → **Environment Variables**
2. Add: `ADMIN_PASSWORD` = your chosen password (keep it strong)
3. Set it for **Production**, **Preview**, and **Development** environments

### Step 5 — Redeploy
1. Go to **Deployments** → click the latest deployment → **Redeploy**
2. Your app is now live!

### Step 6 — Verify the database table
The `submissions` table is created automatically on the first web form submission or first admin page visit. Alternatively, run the SQL above in:
- **Vercel Dashboard → Storage → your database → Query**

---

## 3. Update the LINE ID and QR Code

### Update the LINE ID
Open `app/_components/LineForm.tsx` and find this block near the top of the file:

```typescript
// ── UPDATE THIS LINE ID ──────────────────────────────────────────────
// Replace 'pinsandneedlescomedy' with your actual LINE Official Account ID
// (the part after @ in your LINE OA profile URL).
const LINE_ID = 'pinsandneedlescomedy';
// ────────────────────────────────────────────────────────────────────
```

Replace `pinsandneedlescomedy` with your real LINE OA ID. For example, if your LINE OA URL is `line.me/R/ti/p/@mycomedy`, use `mycomedy`.

### Add a QR Code (optional)
Place your LINE QR code image in `/public/line-qr.png`, then add it to the right-side panel in `LineForm.tsx`:

```tsx
import Image from 'next/image';
// Below the LINE button:
<Image src="/line-qr.png" alt="Scan to add on LINE" width={120} height={120} className="mx-auto mt-3" />
```

---

## 4. Packages

Only one extra package beyond the Next.js scaffold:

```bash
npm install @vercel/postgres
```

Full dependency list:
- `next` — Next.js 16 (App Router)
- `react` + `react-dom` — React 19.2
- `@vercel/postgres` — Vercel Postgres client (free tier)
- `typescript` — TypeScript
- `tailwindcss` — Tailwind CSS v4
- `eslint` + `eslint-config-next` — linting

---

## Local Development

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

## Project Structure

```
app/
├── layout.tsx                  Root layout
├── page.tsx                    Public submission page
├── globals.css                 Global styles (dark theme)
├── actions.ts                  Server Actions (submit, login, update)
├── lib/
│   └── db.ts                   Vercel Postgres helpers + types
├── _components/
│   ├── LineForm.tsx             Interactive LINE message generator (client)
│   └── WebForm.tsx             Direct web submission form (client)
└── admin/
    ├── page.tsx                Admin page (server — auth check)
    ├── LoginForm.tsx            Admin login form (client)
    └── AdminDashboard.tsx       Admin dashboard table (client)
```
