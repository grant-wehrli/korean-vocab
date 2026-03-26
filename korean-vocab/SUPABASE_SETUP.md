# Supabase Database Setup

This guide walks you through creating a Supabase project and wiring it up to the Korean Vocab Trainer.

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New project**.
3. Fill in:
   - **Name** — e.g. `korean-vocab`
   - **Database password** — save this somewhere safe
   - **Region** — pick the one closest to you
4. Click **Create new project** and wait ~1 minute for it to provision.

---

## Step 2 — Copy your API credentials

1. In the Supabase dashboard, go to **Project Settings → API**.
2. Copy two values:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key** — the long JWT string under "Project API keys"

---

## Step 3 — Create your `.env.local` file

In the `korean-vocab/` project directory (same folder as `package.json`), create a file called `.env.local`:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the placeholders with the values you copied in Step 2.

> **Note:** `.env.local` is already in `.gitignore` — your credentials will not be committed.

---

## Step 4 — Run the database migration

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) and paste its entire contents into the editor.
4. Click **Run** (or press `Ctrl+Enter`).

You should see a success message. This creates three tables:

| Table | Purpose |
|---|---|
| `cards` | One SM-2 flashcard per user per Korean word |
| `custom_sets` | User-imported JSON vocabulary sets |
| `user_preferences` | Default quiz mode, study streak |

Each table has **Row Level Security (RLS)** enabled — users can only read and write their own data.

---

## Step 5 — Enable authentication providers

### Email / Password (required)

1. Go to **Authentication → Providers** in the Supabase dashboard.
2. Make sure **Email** is enabled (it is by default).
3. Optionally disable **Confirm email** during development so you can sign up without checking your inbox.

### Google OAuth (optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project, and enable the **OAuth consent screen**.
2. Under **Credentials**, create an **OAuth 2.0 Client ID** (Web application).
3. Add your Supabase callback URL as an **Authorized redirect URI**:
   ```
   https://xxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
4. Copy the **Client ID** and **Client Secret**.
5. Back in Supabase, go to **Authentication → Providers → Google** and paste them in.

---

## Step 6 — Start the dev server

```bash
# from the repo root
./dev.sh
```

Then open [http://localhost:5173/korean-vocab/](http://localhost:5173/korean-vocab/).

---

## Verification checklist

- [ ] Sign up with a new email — no errors in the browser console
- [ ] Study a few cards, then sign out and sign back in — cards reappear
- [ ] Open Supabase **Table Editor → cards** — rows are visible for your user
- [ ] Guest mode still works (study without signing in)

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `syncCard error: relation "cards" does not exist` | Re-run the SQL migration in Step 4 |
| Sign-in succeeds but cards don't load | Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly in `.env.local` and restart the dev server |
| Google sign-in returns a redirect error | Double-check the Authorized redirect URI in Google Console matches your Supabase project URL exactly |
| Cards save locally but not to Supabase | Open DevTools → Network and look for failed `upsert` calls; usually an RLS misconfiguration — re-run the migration |
