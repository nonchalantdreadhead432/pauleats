# FireOrder — Supabase + free hosting setup

Follow these in order. Total cost: **$0** on Supabase's free tier and any of the free static hosts below, as long as your order volume stays modest (free tier covers 500MB database + 1GB file storage + 50k monthly active users — plenty for a small business).

## 1. Create your Supabase project
1. Go to [supabase.com](https://supabase.com) → sign up → **New project**.
2. Pick a name, set a database password (save it somewhere — you won't need it day-to-day, but you'll want it if you ever need direct DB access), pick the region closest to your customers.
3. Wait ~2 minutes for it to provision.

## 2. Run the database schema
1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Paste in everything from `schema.sql` (included in this project) and click **Run**.
3. This creates the `orders` table and locks it down with Row Level Security: customers can only *submit* orders, only signed-in admins can *view/edit/delete* them.

## 3. Create the screenshots storage bucket
1. Go to **Storage** (left sidebar) → **New bucket**.
2. Name it exactly `screenshots`, toggle **Public bucket** ON, click **Create bucket**.
3. Back in **SQL Editor**, the two storage policies at the bottom of `schema.sql` should already be applied if you ran the whole file — if you ran it before creating the bucket, re-run just those two `create policy` statements now.

## 4. Create your admin login
1. Go to **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter the email and password you want to log into the dashboard with. Check "Auto Confirm User" so you don't need to click an email link.
3. That's it — this is the account you'll use on the `login.html` page.

## 5. Connect the site to your project
1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `config.js` in this project and paste them in:
   ```js
   const SUPABASE_URL = "https://your-project-ref.supabase.co";
   const SUPABASE_ANON_KEY = "your-anon-public-key";
   ```
4. Open `orders.json` and update `paymentHandles` with your real Cash App/Zelle/PayPal/Apple Pay info.

## 6. Test it locally
Because the pages now fetch real files (`config.js`, `orders.json`) and call Supabase, opening `index.html` by double-clicking it may hit browser file:// restrictions. Easiest fix — run a tiny local server from inside the project folder:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your browser. Place a test order, then log into `http://localhost:8000/login.html` with the admin account from step 4 and confirm it shows up.

## 7. Deploy for free
Pick one:

**Netlify (easiest)**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the whole project folder onto the page. Done — you get a live URL immediately.
3. Optional: claim a free `yourname.netlify.app` subdomain, or connect your own domain later (also free, you just pay for the domain itself if you don't already own one).

**Cloudflare Pages**
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → connect a GitHub repo with these files (or drag-and-drop, similar to Netlify).
2. Deploy — also free, with generous bandwidth.

**GitHub Pages**
1. Push this folder to a GitHub repo.
2. Repo → **Settings → Pages** → set source to your main branch.
3. Free, slightly more setup than the other two.

## 8. Ongoing costs to watch
Everything above is free at small scale. You'd only start paying if:
- Your Supabase project exceeds the free tier's database/storage/bandwidth limits (Supabase will email you before this happens).
- You want a custom domain (e.g. `fireorder.com`) — the domain itself typically costs $10–15/year; the hosting stays free.

## Notes on this being a "real" backend
- Orders now live in Supabase's Postgres database, not the browser — so a customer ordering from their phone shows up instantly on your laptop's dashboard (thanks to the realtime subscription in `admin.js`).
- Admin login is real Supabase Auth now (email + password checked server-side), not the client-side password hash from before — this is actually secure.
- Row Level Security policies are what keep customers from reading or editing each other's orders, and keep the orders table private from the public internet — don't remove them.
