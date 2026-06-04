# 🎯 NowWhy

**Real-time visitor intent monitoring for founders and web apps — Not analytics. Awareness.**

[![GitHub stars](https://img.shields.io/github/stars/edd1080/nowwhy?style=flat-square&color=blue)](https://github.com/edd1080/nowwhy/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Made with TypeScript](https://img.shields.io/badge/made%20with-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Built with Next.js](https://img.shields.io/badge/built%20with-Next.js-black?style=flat-square)](https://nextjs.org/)

> **NowWhy is open source.** Join us in building the future of real-time user awareness.

---

## What is NowWhy?

NowWhy is a lightweight, real-time monitoring platform that answers one question: **What are your visitors trying to do right now?**

Unlike traditional analytics dashboards that show you aggregated data hours or days later, NowWhy delivers **instant awareness** of visitor intent as it happens. No dashboards to check. No alerts to miss. Just clarity.

### Core Features

- 🔴 **Live Visitor Feed** - Watch visitor behavior in real-time
- 🧠 **Intent Classification** - AI-powered rules engine that labels what visitors are likely trying to do
- ⚡ **Instant Alerts** - Slack notifications when critical visitor patterns emerge
- 📊 **Smart Summaries** - "Since you last checked" continuity that respects your attention
- 🪶 **Lightweight Tracker** - Only 1.7KB gzipped; negligible performance impact
- 🛡️ **Privacy-First** - Anonymized data, no IP storage, full control over retention

---

## Why NowWhy Matters

### The Problem It Solves

Founders and product teams are drowning in analytics but starving for **actionable real-time awareness**. The gap between a visitor's action and a founder's awareness creates missed opportunities:

- A VIP prospect abandons your signup form → You never see it until tomorrow's report
- A user repeatedly visits pricing but won't convert → You don't know their friction point
- Traffic spikes happen → You notice it 6 hours later
- A critical issue blocks visitors → No one notices until support gets involved

### Why It's Important for the Ecosystem

1. **Democratizes Real-Time Intelligence** - Previously only available through expensive enterprise platforms. NowWhy makes it accessible to bootstrapped founders and early-stage startups.

2. **Restores Human-Centric Product Work** - In an age of metrics-obsession, NowWhy puts **observational clarity** back at the center of product discovery.

3. **Bridges the Analytics-CRM Gap** - Connects visitor behavior data with founder awareness, enabling reactive support and product decisions.

4. **Privacy-Respecting Alternative** - Built with data minimalism first: we store what matters, discard what doesn't, and never track individuals.

5. **Open Source Foundation** - By open-sourcing this, we enable:
   - Custom integrations (Slack, Discord, email, webhooks)
   - Self-hosted deployments for privacy-conscious teams
   - Community-driven feature development
   - Transparency about how visitor data is handled

---

## Quick Start

### Prerequisites

- **Node.js 18+**
- **Supabase account** (free tier works)
- **Anthropic API key** (for AI-powered intent classification)

### Installation

```bash
# Clone the repository
git clone https://github.com/edd1080/nowwhy.git
cd nowwhy

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Fill in your credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - ANTHROPIC_API_KEY
```

### Running Locally

```bash
# Start development server
npm run dev

# Open http://localhost:3000
# Sign in with your email (magic link)

# Install tracker on a test site
# Add this to your HTML <head>:
# <script src="https://localhost:3000/tracker.js"></script>
```

### Deployment

```bash
# Deploy to Vercel
npm run build
vercel deploy

# Or use Docker
docker build -t nowwhy .
docker run -p 3000:3000 nowwhy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full production setup.

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 + React 18 + TypeScript |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Magic Links) |
| **Realtime** | Server-Sent Events (SSE) |
| **AI** | Claude 3 Haiku (Anthropic) |
| **Styling** | Tailwind CSS |
| **Tracking** | <5KB Custom JS |

### Project Structure

```
nowwhy/
├── src/
│   ├── app/
│   │   ├── (auth)/login/                  # Magic link authentication
│   │   ├── (dashboard)/
│   │   │   ├── live/                      # Main live visitor feed
│   │   │   ├── projects/                  # Project/site management
│   │   │   └── settings/                  # Alert configuration
│   │   └── api/v1/
│   │       ├── collect/                   # Event ingestion endpoint
│   │       ├── stream/                    # SSE realtime stream
│   │       ├── summary/                   # Session summaries
│   │       └── since-last-check/          # Continuity tracking
│   ├── components/
│   │   ├── visitor-card.tsx               # Individual visitor display
│   │   ├── visitor-feed.tsx               # Main visitor feed
│   │   ├── session-summary.tsx            # Rolling summary panel
│   │   └── ...
│   ├── lib/
│   │   ├── rules-engine.ts                # Intent classification logic
│   │   ├── ai-classifier.ts               # Claude API integration
│   │   ├── session-manager.ts             # Session state management
│   │   ├── alert-service.ts               # Slack alert delivery
│   │   └── copy-templates.ts              # UX copy (constitution)
│   └── ...
├── public/
│   └── tracker.js                         # Client-side tracking script
├── supabase/
│   └── migrations/                        # PostgreSQL schema + RLS
└── package.json
```

---

## Database Schema

NowWhy uses a 7-table PostgreSQL schema with Row-Level Security (RLS):

- **projects** - Customer websites/applications
- **visitors** - Anonymized visitor sessions
- **sessions** - Browsing sessions with duration tracking
- **events** - Individual pageviews and interactions
- **insights** - AI-derived intent labels (cached)
- **alert_configs** - User alert preferences and destinations
- **user_visits** - "Since you last checked" tracking

All tables include Row-Level Security policies to ensure multi-tenancy isolation.

---

## Key Features Explained

### 1. Intent Classification

NowWhy automatically labels visitor behavior using a combination of rules-based logic and AI:

**Confidence Levels:**

| Level | Type | Examples |
|-------|------|----------|
| 1 | Observed | "Viewing...", "Spent 34s on..." |
| 2 | Pattern | "Repeated visits to..." |
| 3 | Likely Intent | "Likely evaluating..." |
| 4 | Actionable | "Often seen before conversions..." |

**7 Intent Labels:**
- Evaluating
- Troubleshooting
- Pricing Review
- Comparison Shopping
- Returning User
- High Engagement
- Support Seeking

**5 Friction Types:**
- Form Abandonment
- Page Bounces
- Slow Engagement
- Price Sensitivity
- Feature Gaps

### 2. Realtime Streaming

The `/api/v1/stream` endpoint uses Server-Sent Events (SSE) to push visitor updates to the dashboard in real-time without requiring WebSocket infrastructure.

```javascript
// Real-time visitor updates
const eventSource = new EventSource('/api/v1/stream?project_id=xyz');
eventSource.onmessage = (e) => {
  const visitor = JSON.parse(e.data);
  // Update UI with latest visitor
};
```

### 3. Slack Alerts

Configure alert rules in settings. Slack notifications support:

- **Instant Mode** - Alert immediately when a visitor matches your rules
- **Batched Mode** - Collect alerts and send daily/weekly digests
- **Custom Thresholds** - Set your own triggers (e.g., "3+ visits to pricing in 1 hour")

```
🎯 Visitor Intent Alert
Prospect ID: v_1234567
Action: Returned 5 times to /pricing
Time: Just now
Link: https://nowwhy.vercel.app/live?visitor=v_1234567
```

### 4. Lightweight Tracker

The tracker script is only **1.7KB gzipped** and uses a "send on idle" pattern to avoid blocking page load:

```html
<!-- Add once to your site's <head> -->
<script src="https://nowwhy.vercel.app/tracker.js"></script>
<script>
  window.NowWhy?.track({ projectId: 'your-project-id' });
</script>
```

---

## Implementation Status

### ✅ Completed

- Next.js 14 + TypeScript + Tailwind setup
- Supabase client (browser + server)
- Database schema with RLS
- Magic link authentication
- Event ingestion endpoint (`/api/v1/collect`)
- Tracker script (<5KB)
- Rules engine with 7 intent labels
- Claude API integration
- SSE realtime streaming
- Dashboard UI components
- Slack alerts (instant + batched)

### 🚀 Coming Soon

- Production deployment to Vercel
- Redis for multi-instance support
- Traffic spike detection algorithm
- Returning VIP alerts
- Team/permissions support
- Additional integrations (Discord, email, webhooks)

---

## Design Philosophy

### UX Copy Constitution

All copy in NowWhy follows these principles:

1. **Observational** - Describe what appears to be happening, not what we know
2. **Calm Under Ambiguity** - Embrace uncertainty rather than overstating confidence
3. **Founder-to-Founder** - Quiet, experienced tone; no hype
4. **Minimal But Meaningful** - Every word earns its place

**Forbidden Language:**
- ❌ Absolute claims ("will convert")
- ❌ Psychological inference ("confused", "frustrated")
- ❌ Surveillance framing ("tracking", "watching")
- ❌ Performance pressure ("you should", "act now")

### Data Retention & Privacy

- **Default retention:** 60 days (configurable)
- **No IP logging** - GeoIP resolved at ingestion, then discarded
- **Anonymized visitors** - No PII stored
- **GDPR compliant** - Easy data deletion
- **Row-Level Security** - Multi-tenant isolation enforced at database level

---

## Contributing

NowWhy is open source and welcomes contributions! Here's how to get started:

### Development

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/nowwhy.git
cd nowwhy

# Create a feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run dev
npm run test

# Submit a pull request
```

### Contribution Ideas

- 🎨 UI/UX improvements
- 🔧 Additional integrations (Discord, email, webhooks)
- 📊 New intent classification rules
- 🚀 Performance optimizations
- 📚 Documentation improvements
- 🐛 Bug fixes

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Self-Hosted

See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker, Kubernetes, and other deployment options.

---

## Roadmap

- [ ] Multi-user teams with role-based access
- [ ] Custom intent labels
- [ ] Historical heat maps
- [ ] Webhook support
- [ ] Discord/email integrations
- [ ] Advanced traffic analytics
- [ ] A/B testing integration
- [ ] Mobile app

---

## Frequently Asked Questions

**Q: How is NowWhy different from Google Analytics?**  
A: Google Analytics shows aggregated historical data. NowWhy shows what's happening *right now* with actionable visitor intent.

**Q: Is my visitor data safe?**  
A: Yes. We anonymize data, store no IPs, and use Row-Level Security for multi-tenant isolation. You can self-host for complete control.

**Q: What's the cost?**  
A: Free to start with generous rate limits. Premium tier coming for advanced features and higher volume.

**Q: Can I self-host?**  
A: Yes! NowWhy is open source. See [DEPLOYMENT.md](DEPLOYMENT.md) for self-hosting instructions.

**Q: Does the tracker slow down my site?**  
A: No. It's only 1.7KB gzipped and uses non-blocking async sends.

---

## Community

- 💬 **Discussions** - [GitHub Discussions](https://github.com/edd1080/nowwhy/discussions)
- 🐛 **Issues** - [Report bugs or request features](https://github.com/edd1080/nowwhy/issues)
- 🌟 **Star** - Show your support with a GitHub star ⭐
- 📧 **Email** - Say hello at [hello@nowwhy.app](mailto:hello@nowwhy.app)

---

## License

NowWhy is open source under the MIT License. See [LICENSE](LICENSE) for details.

---

## Made With ❤️

Built by [Edd](https://github.com/edd1080) for founders who want to know what their visitors are doing, right now.

**Learn more:** https://nowwhy.vercel.app

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Real-time events via [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- Styling by [Tailwind CSS](https://tailwindcss.com/)

