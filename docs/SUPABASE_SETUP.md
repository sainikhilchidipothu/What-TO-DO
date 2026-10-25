# Cross-device sync with Supabase

The app is offline-first and works with no setup. Adding Supabase turns on
**accounts + cross-device sync**: sign in with an email magic link on any
device and your goals, tasks, classes, and journal stay in step. Without the
env vars below, none of this activates and the app behaves exactly as before.

The free tier is more than enough for a personal app.

---

## 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Pick a strong database password (you won't need it for this app) and a
   region close to you.

## 2. Grab your API keys

In the dashboard: **Project Settings → API**. Copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

The anon key is meant to be shipped in frontend code — it can only do what the
Row-Level Security policies below permit.

## 3. Create the table + security policies

Open **SQL Editor** in the dashboard, paste this, and run it:

```sql
-- One row per user holding their entire app state as JSON.
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row-Level Security: each user may only read/write their own row.
alter table public.user_state enable row level security;

create policy "read own state"
  on public.user_state for select
  using (auth.uid() = user_id);

create policy "insert own state"
  on public.user_state for insert
  with check (auth.uid() = user_id);

create policy "update own state"
  on public.user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Let signed-in users reach the table through the API.
grant select, insert, update on public.user_state to authenticated;
```

> RLS is what makes the public anon key safe: even though anyone can call the
> API, a request can only ever touch the row whose `user_id` matches the
> signed-in user.

## 4. Turn on email sign-in

The app supports **email + password** (sign in / create account / forgot
password) and **email magic links**.

**Authentication → Providers → Email**: make sure **Email** is enabled.

- **Confirm email ON:** new accounts get a confirmation email and can sign in
  only after clicking it.
- **Confirm email OFF:** new accounts are signed in right away.

**Adding users yourself:** in **Authentication → Users → Add user → Create new
user**, enter an email and password and tick **Auto Confirm User**. Without
that tick, the login fails with "email not confirmed".

**Authentication → URL Configuration**:

- Set **Site URL** to your live app (`https://what-to-do-nu.vercel.app`). If it
  is left at the default `http://localhost:3000`, every email link sends people
  to a dead localhost page.
- Add your app's URLs to **Redirect URLs** so email links return to the app:

- `http://localhost:5173` (local dev)
- `https://what-to-do-nu.vercel.app` (and any custom domain)

The app sends the link with `emailRedirectTo` set to the current origin, so it
returns the user to whichever URL they started from.

> The default Supabase email sender is rate-limited and fine for personal use.
> For higher volume, configure your own SMTP under **Authentication → Emails**.

## 5. Wire up the keys

### Local development

```bash
cp .env.example .env.local
# edit .env.local and paste your Project URL + anon key
npm run dev
```

`.env.local` is gitignored — your keys never get committed.

### Vercel (production)

**Project → Settings → Environment Variables**, add both:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Redeploy so the build picks them up. (Vite inlines `VITE_`-prefixed vars at
build time, so a rebuild is required after changing them.)

---

## How sync behaves

- **Signing up:** the create-account form asks for a name, which is stored on
  the Supabase user as `full_name` metadata (no extra table needed). That name
  appears in the header's account menu on every device. Users can change it
  under **Profile & account**. Accounts without a name pick up the one already
  on the device, or get asked for one once.
- **New device:** the welcome setup offers **Already have an account? Sign in**,
  so returning users pull their data instead of starting over. Setup is skipped
  when the account already has data.
- **Signed out:** everything stays in `localStorage` on that device, as today.
- **First sign-in on a fresh device:** your cloud data loads in.
- **First sign-in on a device that already has local data** *and* the account
  already has cloud data: you're asked once whether to **combine both**, **use
  the account copy**, or **use this device** — nothing is overwritten silently.
- **Ongoing:** local edits push up (debounced ~1.5s); returning focus to a tab
  pulls down anything changed on another device.
- **Offline:** edits save locally and sync the next time you're online. The
  account button shows an amber dot while sync can't reach the server.
