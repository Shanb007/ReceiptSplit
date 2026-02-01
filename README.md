# ReceiptSplit

Split receipts with friends — scan, review, assign items, and export to Splitwise.

ReceiptSplit uses AI (GPT-4o) to extract line items from receipt photos, lets you assign items to group members, computes fair splits including tax and tip, and optionally exports the result to Splitwise.

## Features

- **AI Receipt Scanning** — Upload a photo and GPT-4o extracts merchant, items, prices, tax, and tip
- **Manual Entry** — Add receipts and items by hand (no scan needed)
- **Item Assignment** — Assign each line item to one or more people
- **Smart Splitting** — Tax and tip distributed proportionally or equally
- **Splitwise Export** — One-click export settled receipts as Splitwise expenses
- **Splitwise Group Import** — Import groups and members directly from Splitwise
- **BYO API Key** — Bring your own OpenAI key for unlimited scans
- **Usage Limits** — 5 free AI scans per month on the hosted version
- **Google OAuth** — Sign in with Google

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Auth:** NextAuth.js (Google OAuth)
- **AI:** OpenAI GPT-4o (vision)
- **Image Storage:** Cloudinary
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript

## Self-Hosting Guide

### Prerequisites

- Node.js 18+
- PostgreSQL database (or a free [Supabase](https://supabase.com) project)
- [Cloudinary](https://cloudinary.com) account (free tier works)
- [OpenAI](https://platform.openai.com) API key
- [Google Cloud Console](https://console.cloud.google.com) project for OAuth
- (Optional) [Splitwise](https://secure.splitwise.com/apps) app for export

### Setup

1. **Clone the repo**

```bash
git clone https://github.com/Shanb007/ReceiptSplit.git
cd ReceiptSplit
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in your values. See [Environment Variables](#environment-variables) below.

4. **Set up the database**

```bash
npx prisma db push
```

5. **Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

#### Running locally (self-hosted)

These are the only variables you need to run the app on your machine with a local Postgres database:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your local Postgres connection string, e.g. `postgresql://user:password@localhost:5432/receiptsplit` |
| `DIRECT_URL` | Set to the same value as `DATABASE_URL` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (see below) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ENCRYPTION_KEY` | Generate with `openssl rand -base64 32` |
| `SPLITWISE_CLIENT_ID` | Splitwise OAuth app client ID ([create app here](https://secure.splitwise.com/apps)) |
| `SPLITWISE_CLIENT_SECRET` | Splitwise OAuth app client secret |
| `SPLITWISE_REDIRECT_URI` | `http://localhost:3000/api/auth/splitwise/callback` |

> **Google OAuth is currently required** even for local use — it's the only auth method. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth 2.0 client and add:
> - Authorized JavaScript origin: `http://localhost:3000`
> - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

#### Deploying to production (Vercel + Supabase)

Same variables as above, with these differences:

| Variable | Change for production |
|----------|----------------------|
| `DATABASE_URL` | Use the Supabase **pooler** connection string (port 6543 with `?pgbouncer=true`) |
| `DIRECT_URL` | Use the Supabase **direct** connection string (port 5432, no pooler) — needed for migrations |
| `NEXTAUTH_URL` | Your production domain, e.g. `https://receiptsplit.vercel.app` |
| `SPLITWISE_REDIRECT_URI` | `https://yourdomain.com/api/auth/splitwise/callback` |
| Google OAuth | Add your production domain as authorized origin + redirect URI in Google Cloud Console |

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FShanb007%2FReceiptSplit&env=DATABASE_URL,DIRECT_URL,NEXTAUTH_URL,NEXTAUTH_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,OPENAI_API_KEY,CLOUDINARY_CLOUD_NAME,CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET,ENCRYPTION_KEY&envDescription=See%20.env.example%20for%20descriptions&project-name=receiptsplit)

After deploying, run `npx prisma db push` against your production database.

## How It Works

1. **Create a group** with the people you're splitting with
2. **Upload a receipt** (AI scan) or **enter manually**
3. **Review** extracted items — edit names, prices, mark low-confidence items
4. **Assign items** to group members (each item can be split among multiple people)
5. **Settle** — the app computes each person's share including tax and tip
6. **Export to Splitwise** (optional) — creates the expense in your Splitwise group

## License

MIT
