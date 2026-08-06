# TLC Massage Wellness

A booking website for **TLC Massage Wellness**, built so the owner can change
every word of it from a password-protected admin — no developer, no CMS
subscription, no code.

Every treatment on the site is offered **free of charge**. There is no payment
step anywhere in the app, and nothing it depends on costs money either: it runs
on Vercel's Hobby plan with a free Postgres database.

---

## What it does

### The public site (`/`)

A single scrolling page in the brand's green and gold:

- **Hero** — heading, sub-heading, button label and background photo, all editable
- **About us** — paragraphs, a list of highlights, and a photo
- **Our offer** — the treatment list, each with a "Book this" link
- **Our team** — therapist profiles with photos
- **Book a visit** — the request form
- **Contact** — address, opening hours, phone, email, directions link
- **Footer** — social links and a staff login link

`/book` is the same form on its own page, so "Book this" can land there with the
treatment already chosen.

### The admin (`/admin`)

Sign in with the password (default `bigdog5` — see [Environment variables](#4-environment-variables)).

| Tab | What you can do |
|---|---|
| **Bookings** | See every request. **Accept** or **decline** it in one tap, mark it done, reopen it, leave a private note, or open a pre-written reply in your own mail app. Filter by status; the tab shows a badge for anything still waiting. |
| **Treatments** | Add, edit, reorder, hide, or delete treatments. They appear on the website and in the booking form immediately. |
| **Team** | Add, edit, reorder, hide, or delete therapists. Leave everyone hidden and the whole section disappears from the site. |
| **Website** | Every heading, paragraph, label, address, opening hour and image link on the public site, grouped into eight sections. Also holds the switch that closes bookings, and the list of appointment times people can choose from. |

### How a booking flows

1. A visitor fills in the form: name, email, phone, treatment, date, time, notes.
2. It arrives in the admin as **awaiting answer**, and the Bookings tab shows a count.
3. You **accept** or **decline**. Accepted requests can later be marked **completed**.
4. "Email them" opens your normal mail app with the confirmation already written.

No email is sent by the app itself, which is why it needs no mail service, API
key, or sending domain.

---

## 1. Deploy to Vercel

### Step 1 — Push to GitHub

Push this repository to GitHub (public or private).

### Step 2 — Create the Vercel project

1. [vercel.com](https://vercel.com) → **Add New Project**
2. Import the repository
3. Framework: **Next.js** (detected automatically)
4. **Deploy**

The site will already work at this point — it renders its built-in copy — but
nothing you change in the admin will be saved until you do step 3.

### Step 3 — Add a free Postgres database

1. Vercel project → **Storage** → **Create Database** → **Postgres** (Neon, free tier)
2. Connect it to the project

Vercel injects the `POSTGRES_*` variables for you. The tables are created on the
first request, and the treatment list is seeded once — if you delete every
treatment it stays deleted.

### Step 4 — Environment variables

Project → **Settings** → **Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | Recommended | The `/admin` password. **Defaults to `bigdog5`** if unset — set your own before the site goes live. |
| `POSTGRES_URL` | Yes, for saving | Added automatically by the Storage step above. |

### Step 5 — Redeploy

**Deployments** → latest → **Redeploy**. Then open `/admin`, sign in, and make
the site yours.

---

## 2. Local development

```bash
npm install
npm run dev
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin (password `bigdog5`)

Without a database the app keeps everything in memory, so it runs and looks
right but forgets on restart — the admin shows a banner saying so. To develop
against real storage, copy the connection details from Vercel → Storage → your
database → `.env.local`.

---

## 3. Project structure

```
app/
├── layout.tsx                Fonts, metadata, root HTML
├── page.tsx                  The public site
├── globals.css               Palette and shared styles
├── icon.svg                  Favicon
├── actions.ts                Server Actions — booking, login, every admin write
├── book/page.tsx             The booking form on its own page
├── lib/
│   ├── content.ts            Every editable line of copy, and its default
│   ├── db.ts                 Postgres, with an in-memory fallback
│   └── normalize.ts          Turns pasted links and handles into safe hrefs
├── _components/
│   ├── Logo.tsx              The butterfly mark, drawn as SVG
│   ├── SiteNav.tsx           Header and mobile menu
│   ├── SiteShell.tsx         Header + footer wrapper
│   ├── BookingSection.tsx    Booking headings and closed notice
│   ├── BookingForm.tsx       The request form
│   └── Reveal.tsx            Fade-up on scroll
└── admin/
    ├── page.tsx              Auth check
    ├── LoginForm.tsx         Password form
    ├── AdminDashboard.tsx    Tabs
    ├── BookingsPanel.tsx     Accept / decline / notes
    ├── ServicesPanel.tsx     Treatment editor
    ├── TeamPanel.tsx         Team editor
    ├── ContentPanel.tsx      Website copy editor
    └── ui.ts                 Shared class strings
```

### Adding a new editable line to the site

Add a field to the right group in `app/lib/content.ts`. It appears in the admin
editor, gets a default, and is available as `content.your_key` in the page — no
other file needs to know about it.

---

## 4. Design

The palette comes from the logo and nothing else: the deep forest green of the
lettering (`#2f3b2a`), the antique gold of the butterflies (`#a89240`), and the
warm cream behind them (`#f7f3e8`). Headings are set in Cormorant Garamond and
everything else in Jost, both self-hosted at build time by `next/font`.

---

## 5. Dependencies

- `next`, `react`, `react-dom` — App Router
- `@vercel/postgres` — database client
- `tailwindcss`, `typescript`, `eslint`
