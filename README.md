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
- **Local Mode** — Self-host with minimal config: just a database and an OpenAI key

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** NextAuth.js (Google OAuth in cloud mode, auto-login in local mode)
- **AI:** OpenAI GPT-4o (vision)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript

## How It Works

1. **Create a group** with the people you're splitting with
2. **Upload a receipt** (AI scan) or **enter manually**
3. **Review** extracted items — edit names, prices, mark low-confidence items
4. **Assign items** to group members (each item can be split among multiple people)
5. **Settle** — the app computes each person's share including tax and tip
6. **Export to Splitwise** (optional) — creates the expense in your Splitwise group

---

## Self-Hosting (Local Mode)

The easiest way to run ReceiptSplit. No Google OAuth, no Cloudinary, no encryption keys, no scan limits. Single-user setup.

### Prerequisites

- Node.js 18+
- PostgreSQL database
- [OpenAI](https://platform.openai.com) API key
- (Optional) [Splitwise](https://secure.splitwise.com/apps) app for export

### Setup

1. **Clone and install**

```bash
git clone https://github.com/Shanb007/ReceiptSplit.git
cd ReceiptSplit
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
NEXT_PUBLIC_MODE="local"
DATABASE_URL="postgresql://user:password@localhost:5432/receiptsplit"
DIRECT_URL="postgresql://user:password@localhost:5432/receiptsplit"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
OPENAI_API_KEY="sk-..."
```

Optionally add Splitwise credentials for the export feature:

```env
SPLITWISE_CLIENT_ID="your-splitwise-client-id"
SPLITWISE_CLIENT_SECRET="your-splitwise-client-secret"
SPLITWISE_REDIRECT_URI="http://localhost:3000/api/auth/splitwise/callback"
```

3. **Set up the database**

```bash
npx prisma db push
```

4. **Run**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — click "Get Started" and you'll be signed in automatically.

### What's different in local mode?

- **No Google login** — a single local user is created automatically
- **No Cloudinary** — receipt images are sent directly to OpenAI as base64 (never stored)
- **No scan limits** — unlimited AI scans using your own OpenAI key
- **No BYO key management** — your key comes from `.env`, not the settings page

---

## Cloud Deployment (Multi-User)

For hosting ReceiptSplit as a multi-user service (e.g. on Vercel). Includes Google OAuth, Cloudinary image storage, BYO API key support, and 3 free lifetime scans per user.

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Supabase](https://supabase.com) free tier works)
- [OpenAI](https://platform.openai.com) API key
- [Google Cloud Console](https://console.cloud.google.com) project for OAuth
- [Cloudinary](https://cloudinary.com) account (free tier works)
- (Optional) [Splitwise](https://secure.splitwise.com/apps) app for export

### Environment Variables

Do **not** set `NEXT_PUBLIC_MODE` (or set it to anything other than `"local"`).

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string. For Supabase, use the pooler string (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Direct PostgreSQL connection (no pooler). For Supabase, use port 5432. For local Postgres, same as `DATABASE_URL` |
| `NEXTAUTH_URL` | Your production domain, e.g. `https://receiptsplit.vercel.app` |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OPENAI_API_KEY` | OpenAI API key (used for free-tier scans) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ENCRYPTION_KEY` | For encrypting user BYO API keys — `openssl rand -base64 32` |
| `SPLITWISE_CLIENT_ID` | Splitwise OAuth app client ID (optional) |
| `SPLITWISE_CLIENT_SECRET` | Splitwise OAuth app client secret (optional) |
| `SPLITWISE_REDIRECT_URI` | `https://yourdomain.com/api/auth/splitwise/callback` (optional) |

> **Google OAuth:** In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth 2.0 client. Add your domain as an authorized JavaScript origin and `<domain>/api/auth/callback/google` as an authorized redirect URI.


After deploying, run `npx prisma db push` against your production database.

## License

MIT
