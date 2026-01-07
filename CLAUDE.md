# NowWhy - Project Documentation

## Project Overview

**NowWhy** is a real-time visitor intent monitoring platform for founders. It's not analytics - it's awareness.

**Core Promise**: "Know what your visitors are trying to do right now, without dashboards."

---

## Implementation Status

### Completed Tasks

| Task | Status | Notes |
|------|--------|-------|
| Initialize Next.js 14 + TypeScript + Tailwind | ✅ Done | Using App Router |
| Set up Supabase client (browser + server) | ✅ Done | With SSR support |
| Create database schema (SQL migrations) | ✅ Done | 7 tables with RLS |
| Set up Supabase Auth with magic links | ✅ Done | Login page + callback |
| Build event ingestion endpoint | ✅ Done | `/api/v1/collect` with rate limiting |
| Create tracker script (<5KB) | ✅ Done | 4KB min, 1.7KB gzip |
| Implement rules engine | ✅ Done | 7 intent labels, 5 friction types |
| Add Claude API integration | ✅ Done | With rate limiting |
| Build SSE realtime stream | ✅ Done | `/api/v1/stream` |
| Create dashboard UI components | ✅ Done | Visitor cards, summary, etc. |
| Implement Slack alerts | ✅ Done | Instant + batched modes |

### Pending / Future Tasks

| Task | Priority | Notes |
|------|----------|-------|
| Deploy to Vercel/production | High | Need Supabase project first |
| Add Redis for production | Medium | Currently using in-memory |
| Traffic spike detection | Low | Algorithm needed |
| Returning VIP alerts | Low | Need VIP tracking logic |
| Team/permissions support | Post-MVP | |
| Additional integrations | Post-MVP | Email, Discord, etc. |

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + React |
| Backend | Next.js API Routes |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (magic links) |
| Realtime | SSE + polling |
| AI | Claude API (Haiku) |
| Styling | Tailwind CSS |

### Key Files

```
/Volumes/SSD/NowWhy/
├── src/
│   ├── app/
│   │   ├── (auth)/login/           # Magic link login
│   │   ├── (dashboard)/
│   │   │   ├── live/               # Main live feed
│   │   │   ├── projects/           # Project management
│   │   │   └── settings/           # Alert configuration
│   │   └── api/v1/
│   │       ├── collect/            # Event ingestion
│   │       ├── stream/             # SSE endpoint
│   │       ├── summary/            # Session summary
│   │       └── since-last-check/   # Continuity feature
│   ├── components/
│   │   ├── visitor-card.tsx        # Individual visitor display
│   │   ├── visitor-feed.tsx        # Main feed component
│   │   ├── session-summary.tsx     # Rolling summary panel
│   │   └── ...
│   └── lib/
│       ├── rules-engine.ts         # Intent classification
│       ├── ai-classifier.ts        # Claude API integration
│       ├── copy-templates.ts       # UX copy (constitution)
│       ├── session-manager.ts      # Session state
│       └── alert-service.ts        # Slack alerts
├── public/
│   └── tracker.js                  # Client tracking script
├── supabase/
│   └── migrations/                 # Database schema
└── tracker/
    └── src/index.ts                # Tracker source
```

### Database Schema

- **projects**: Customer sites
- **visitors**: Anonymized visitor records
- **sessions**: Browsing sessions
- **events**: Pageviews and engagement
- **insights**: AI/rules-derived labels
- **alert_configs**: Alert settings
- **user_visits**: "Since you last checked" tracking

---

## Design Decisions

### Locked Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data retention | 60 days | Balance history vs cost |
| Realtime transport | SSE | Simpler than WebSocket |
| GeoIP timing | At ingestion | Store city/country, no IP |
| Alert delivery | Configurable | User chooses instant/batched |
| Auth method | Magic links | No passwords |

### UX Copy Constitution

All copy follows these pillars:
1. **Observational** - describe what appears to be happening
2. **Calm under ambiguity** - embrace uncertainty
3. **Founder-to-founder** - quiet, experienced tone
4. **Minimal but meaningful** - every word earns its place

**Forbidden language:**
- Absolute claims ("will convert")
- Psychological inference ("confused", "frustrated")
- Surveillance framing ("tracking", "watching")
- Performance pressure ("you should", "act now")

### Confidence Calibration

| Level | Type | Examples |
|-------|------|----------|
| 1 | Observed | "Viewing...", "Spent 34s on..." |
| 2 | Pattern | "Repeated visits to..." |
| 3 | Likely intent | "Likely evaluating..." |
| 4 | Actionable | "Often seen before signups..." |

---

## Testing Guide

### Prerequisites

1. Node.js 18+
2. Supabase account (free tier works)
3. Anthropic API key (for AI features)

### Local Setup

```bash
# 1. Install dependencies
cd /Volumes/SSD/NowWhy
npm install

# 2. Create .env.local from example
cp .env.local.example .env.local

# 3. Configure environment variables (see below)

# 4. Run development server
npm run dev
```

### Environment Variables

```env
# Supabase (get from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Claude API (get from Anthropic console)
ANTHROPIC_API_KEY=sk-ant-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Setup

1. Create new Supabase project
2. Go to SQL Editor
3. Run contents of `supabase/migrations/00001_initial_schema.sql`
4. Enable Email auth in Authentication settings

### Testing Checklist

See TESTING.md for full testing guide.

---

## Session Notes

### Session 1 (Initial Build)

**Date**: 2026-01-05

**What was done:**
- Full MVP implementation from scratch
- Created 40+ files
- Implemented all 11 core tasks
- Build passes successfully

**Key decisions made:**
- Using Supabase instead of raw Postgres/Prisma
- SSE instead of WebSocket for simplicity
- In-memory rate limiting (would use Redis in production)
- Strict: false in tsconfig for faster development

**Issues encountered:**
- npm naming restrictions (capital letters in directory)
- ESLint version conflict (fixed by using v8)
- Supabase generic types causing issues (removed generics)

---

### Session 2 (Testing & Fixes)

**Date**: 2026-01-05

**What was done:**
- Set up Supabase project and ran migrations
- Configured auth and tested magic link flow
- Fixed critical bugs discovered during testing:
  1. **Setup page missing** - Created `/projects/[id]/setup` page showing tracking script
  2. **FK relationship error** - Session manager was using nested Supabase joins that failed (no FK from events to sessions). Fixed by fetching events separately
  3. **Tracker endpoint** - Added `data-endpoint` attribute for localhost testing
- Created test pages (`/test.html`, `/test-pricing.html`, etc.) for proper testing

**Issues fixed:**
- `PGRST200` error: "Could not find relationship between sessions and events" - Fixed by changing session-manager.ts to use separate queries instead of nested joins
- Project creation redirected to /live without showing script - Now redirects to /projects/[id]/setup
- Test page navigation not updating "Viewing" label - Was using query params instead of different paths

**Remaining tests:**
- Slack alert integration
- Intent classification accuracy
- Friction detection
- "Since you last checked" feature

**Next steps:**
- Test Slack alerts
- Deploy to Vercel
- Test with real traffic

---

### Session 3 (Classification & UX Fixes)

**Date**: 2026-01-06

**Issues fixed:**
1. **Intent classification not running** - `processSession()` was never called from collect endpoint. Added call after events are processed.
2. **Returning badge not showing** - Session upsert was overwriting `is_returning=false` on updates. Changed to only set on insert.
3. **Test pages not matching rules** - Paths like `/test-pricing.html` didn't match patterns `/pricing`. Renamed to `/pricing.html`, `/signup.html`, etc.
4. **processSession FK error** - Same nested join issue. Fixed by fetching events separately.
5. **Duplicate visitor cards stacking** - Multiple sessions per visitor were showing. Added deduplication to show only most recent session per visitor.
6. **Ended sessions still visible** - Added filter to hide sessions with no activity for 5+ minutes.

**Working features confirmed:**
- Intent classification (HIGH_INTENT, SIGNUP_ATTEMPT, etc.)
- Returning visitor badge
- Friction detection
- Real-time SSE updates

**Slack alerts tested and working:**
- HIGH_INTENT alerts trigger when visitor goes pricing → signup
- FRICTION_DETECTED alerts trigger on pricing loops
- Messages follow UX copy constitution

**Next steps:**
- UI polish with frontend skill
- Deploy to Vercel
- Test with real traffic

---

## Links & Resources

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Anthropic Console](https://console.anthropic.com)
- [Vercel](https://vercel.com)
- [Next.js Docs](https://nextjs.org/docs)

---

*Last updated: 2026-01-05*
