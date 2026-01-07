# NowWhy - Complete Testing Guide

## Quick Start

```bash
cd /Volumes/SSD/NowWhy
npm run dev
```

Then open: http://localhost:3000

---

## Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it "nowwhy" (or anything)
4. Set a database password (save it!)
5. Choose a region close to you
6. Wait for project to be created (~2 minutes)

### Step 2: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy contents of `supabase/migrations/00001_initial_schema.sql`
4. Paste and click "Run"
5. Should see "Success. No rows returned"

### Step 3: Get API Keys

In Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy these values:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY

### Step 4: Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: For AI features
ANTHROPIC_API_KEY=sk-ant-api03-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Enable Email Auth in Supabase

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Go to **Authentication** → **URL Configuration**
4. Set Site URL to: `http://localhost:3000`
5. Add to Redirect URLs: `http://localhost:3000/auth/callback`

### Step 6: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Testing Checklist

### 1. Authentication Flow

- [ ] Go to http://localhost:3000
- [ ] Click "Get Started"
- [ ] Enter your email
- [ ] Click "Send magic link"
- [ ] Check email (might be in spam, or check Supabase logs)
- [ ] Click the magic link
- [ ] Should redirect to /live (or /projects/new if no projects)

**For faster testing without email:**
1. In Supabase dashboard → Authentication → Users
2. Click "Add User" → "Create New User"
3. Enter email and password
4. Disable "Auto Confirm User"
5. Use this user to test

### 2. Project Creation

- [ ] Go to /projects/new
- [ ] Enter project name: "Test Site"
- [ ] Enter domain: "localhost"
- [ ] Click "Create Project"
- [ ] Should redirect to /live
- [ ] Copy the tracking script shown

### 3. Tracker Script Testing

Create a test HTML file anywhere:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <!-- Add the tracking script from your project -->
  <script
    defer
    src="http://localhost:3000/tracker.js"
    data-project="YOUR_PROJECT_KEY"
    data-endpoint="http://localhost:3000/api/v1/collect"
  ></script>
</head>
<body>
  <h1>Test Page</h1>
  <a href="pricing.html">Pricing</a>
  <a href="signup.html">Sign Up</a>
</body>
</html>
```

Create additional test pages:
- `pricing.html` - For testing pricing intent
- `signup.html` - For testing signup intent
- `blog.html` - For testing content discovery

Open the test file in a browser and navigate around.

### 4. Live Dashboard

- [ ] Go to http://localhost:3000/live
- [ ] Should see "Waiting for activity" initially
- [ ] Open your test HTML file in another browser/tab
- [ ] Navigate around the test site
- [ ] Within 5 seconds, should see visitor cards appear
- [ ] Check that location shows (might be "Unknown" locally)
- [ ] Check that intent labels appear
- [ ] Check that page path updates as you navigate

### 5. Session Summary

- [ ] Look at right panel on /live
- [ ] Should show "Last 10 minutes" summary
- [ ] Should list top pages
- [ ] Should show intent distribution

### 6. Intent Classification

Test these scenarios:

**Pricing Evaluation:**
- Visit pricing page
- Stay for 30+ seconds
- Should show "Viewing pricing" intent

**High Intent:**
- Visit pricing page
- Then visit signup page
- Should show "High intent" label

**Content Discovery:**
- Visit multiple blog/docs pages
- Should show "Reading content" intent

**Friction Detection:**
- Visit pricing page
- Go to features
- Go back to pricing
- Should trigger "pricing loop" friction

### 7. Slack Alerts (Optional)

1. Create a Slack incoming webhook:
   - Go to https://api.slack.com/apps
   - Create new app → From scratch
   - Add "Incoming Webhooks" feature
   - Create a webhook for a channel
   - Copy the webhook URL

2. Configure in NowWhy:
   - Go to /settings
   - Paste webhook URL
   - Enable alerts
   - Choose instant or batched

3. Test:
   - Trigger a high intent session
   - Check Slack for alert

### 8. Projects Management

- [ ] Go to /projects
- [ ] See your project listed
- [ ] See tracking script displayed
- [ ] Click "View Live" - should go to /live

### 9. Settings Page

- [ ] Go to /settings
- [ ] See Slack webhook field
- [ ] See alert type toggles
- [ ] Toggle between instant/batched
- [ ] Save settings
- [ ] Refresh - settings should persist

---

## Testing the Tracker Script Directly

You can test event ingestion with curl:

```bash
curl -X POST http://localhost:3000/api/v1/collect \
  -H "Content-Type: application/json" \
  -d '{
    "v": 1,
    "project_key": "YOUR_PROJECT_PUBLIC_KEY",
    "sent_at": 1704470400000,
    "events": [{
      "type": "pageview",
      "ts": 1704470400000,
      "project_key": "YOUR_PROJECT_PUBLIC_KEY",
      "visitor_id": "test-visitor-123",
      "session_id": "test-session-456",
      "url_path": "/pricing",
      "device": "desktop",
      "tz_offset_min": 0,
      "lang": "en-US",
      "dnt": false
    }]
  }'
```

Should return: `{"ok":true}`

---

## Common Issues

### "Invalid project key"
- Check that you're using the correct `public_key` from your project
- Check Supabase → Table Editor → projects → public_key column

### Magic link email not arriving
- Check spam folder
- Check Supabase → Authentication → Logs
- For local testing, use Supabase's built-in user creation

### Visitor cards not appearing
- Check browser console for errors
- Check Network tab for /api/v1/collect requests
- Verify tracker script is loaded
- Check that project_key matches

### SSE stream disconnecting
- Check Network tab for /api/v1/stream
- Should show "EventStream" type
- Check console for errors

### TypeScript errors
- Run `npx tsc --noEmit` to check
- Most errors are non-blocking for development

---

## Database Inspection

Check data in Supabase:

1. **Table Editor** - View all tables
2. Useful tables to check:
   - `projects` - Your projects
   - `visitors` - Tracked visitors
   - `sessions` - Active sessions
   - `events` - Pageviews
   - `insights` - AI/rules classifications

---

## API Endpoints Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/collect` | POST | Public (project_key) | Event ingestion |
| `/api/v1/stream` | GET | Session | SSE visitor stream |
| `/api/v1/summary` | GET | Session | Session summary |
| `/api/v1/since-last-check` | GET | Session | Continuity data |
| `/auth/callback` | GET | - | Auth callback |

---

## Next Steps After Testing

1. **Deploy to Vercel**
   ```bash
   npx vercel
   ```

2. **Update environment variables in Vercel**

3. **Update Supabase redirect URLs** to production domain

4. **Add tracking script to your real site**

---

*Happy testing!*
