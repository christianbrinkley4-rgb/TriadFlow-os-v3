# TriadFlow Launch Playbook — $15/day FB Ads, Life & Health Leads

This is the operator runbook for launching the TriadFlow lead funnel on Facebook Ads with a $15/day budget. It assumes the codebase is deployed and the Zapier webhook is live.

## TL;DR — what's already wired

| Asset | Status | Identifier |
|---|---|---|
| 3-step quote funnel (`/medicare`) | ✅ Live in code | Build size: ~10 kB |
| Zapier webhook (lead delivery) | ✅ Inherited | `https://hooks.zapier.com/hooks/catch/27406693/uv9ep9b/` |
| FB Pixel | ✅ Loaded site-wide | `183351282` |
| GA4 | ✅ Loaded site-wide | `G-DSLPLQ3TSQ` |
| FB `Lead` event | ✅ Fires on form submit | conversion-optimization-ready |
| Calendly fallback | ✅ Shown on success | `wchappell37/retirement-consultation` |
| GitHub Pages deploy workflow | ✅ Exists | `.github/workflows/deploy-pages.yml` |

## ⚠️ Blockers — what Will needs to provide before launch

1. **Facebook Business Manager access** — pixel ID `183351282` must be claimed in a BM that Will owns or has admin access to. (Required for ad creation against this pixel.)
2. **Facebook Ad Account** with payment method attached.
3. **Facebook Page** for the ads to be sponsored by. (Need page name + URL.)
4. **Zapier "Catch Hook" Zap** — confirm the existing Zap at hook `27406693/uv9ep9b/` is still active and routes to Will. If not, create a new Zap (see § Zapier setup).
5. **Will's email + phone** for the Zap's notification step.
6. **GitHub remote** — repo is not currently a git repository on disk. Will (or whoever owns the deploy) needs to `git init`, add a GitHub remote, and push so the GH Pages workflow can run. This codebase has no remote configured. See § Deploy.
7. **Domain (optional but recommended)** — `https://username.github.io/TriadFlow-os/` works, but a custom domain like `quote.willchappell.com` reduces ad-disapproval risk and bumps trust.
8. **Insurance license disclosure** — FB requires insurance advertisers to identify themselves. Will's NC producer license number should be visible in the footer (and possibly the ad creative).

## Architecture — why FB Native Lead Form is the primary capture

For a $15/day budget, friction is the enemy:

| Path | Median CPL (life/health, NC) | Lead quality |
|---|---|---|
| FB Native Lead Form (pre-filled) | $8–$25 | Lower intent, higher volume |
| Website quiz (3-step) | $25–$50 | Higher intent, lower volume |

**The plan: run both, A/B split 70/30 native vs. website.** Native gets 70% of spend (volume engine), website gets 30% (intent filter + brand). After 7 days at $15/day = $105 spent, we'll have enough data to rebalance.

## §1. Facebook Native Lead Form — JSON spec

When creating the Lead Form in Ads Manager → Lead Center, configure these fields. This is the exact spec to drop into the form builder.

```json
{
  "name": "TriadFlow Q&A — Life/Health Quote v1",
  "locale": "EN_US",
  "privacy_policy": {
    "url": "https://YOUR-DOMAIN/privacy",
    "link_text": "Will Chappell Privacy Notice"
  },
  "intro": {
    "headline": "Get your free Triad coverage quote",
    "description": "Three quick questions. Will Chappell, a licensed local agent in the Piedmont Triad, will follow up within one business day. No spam, no obligation."
  },
  "questions": [
    {
      "type": "CUSTOM",
      "key": "coverage_type",
      "label": "What coverage are you looking for?",
      "options": [
        {"value": "life",    "label": "Life insurance for my family"},
        {"value": "health",  "label": "Health / medical (under 65)"},
        {"value": "medicare","label": "Medicare supplement (65 or older)"},
        {"value": "unsure",  "label": "Not sure — help me choose"}
      ]
    },
    {
      "type": "CUSTOM",
      "key": "age_band",
      "label": "Which age group fits you?",
      "options": [
        {"value": "under_40","label": "Under 40"},
        {"value": "40_54",   "label": "40 to 54"},
        {"value": "55_64",   "label": "55 to 64"},
        {"value": "65_plus", "label": "65 or older"}
      ]
    },
    { "type": "FULL_NAME" },
    { "type": "EMAIL" },
    { "type": "PHONE" },
    { "type": "ZIP" }
  ],
  "thank_you_page": {
    "title": "You're on Will's list",
    "body": "Will Chappell will reach out within one business day. If you'd like to lock in a time now, tap below to pick a 15-minute slot.",
    "button_text": "Book a 15-min call",
    "button_url": "https://calendly.com/wchappell37/retirement-consultation"
  },
  "tracking_parameters": [
    { "key": "utm_source",   "value": "facebook" },
    { "key": "utm_medium",   "value": "paid_social" },
    { "key": "utm_campaign", "value": "triadflow_q1_lifehealth" }
  ]
}
```

### Routing FB Native leads to Will (Zapier setup)

1. Open Zapier → **Create Zap**.
2. **Trigger:** *Facebook Lead Ads → New Lead*. Connect Will's FB Page and select the form above.
3. **Action 1:** *Email by Zapier* → To: Will's email. Subject: `New TriadFlow lead: {{full_name}} — {{coverage_type}}`. Body: include all fields.
4. **Action 2:** *SMS by Zapier* (or Twilio if Will has it) → To: Will's mobile. Body: `New TF lead: {{full_name}}, {{phone}}, {{coverage_type}}, {{zip}}`.
5. **Action 3 (optional):** *Google Sheets → Append row* for a backup ledger.
6. **Action 4 (optional but recommended):** *Calendly → Send Invitee Invite* with the Calendly URL above pre-filled with the lead's email.

The same Zap can be cloned to handle the website webhook (next section) — just change the trigger to *Webhooks by Zapier → Catch Hook* with the existing URL.

## §2. Website webhook (Zapier Catch Hook)

The site POSTs this JSON shape to `NEXT_PUBLIC_LEAD_WEBHOOK_URL`:

```json
{
  "source": "triadflow-web",
  "submittedAt": "2026-05-12T18:32:11.000Z",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "(336) 555-0123",
  "zip": "27401",
  "coverageType": "Life — family protection",
  "ageBand": "40–54",
  "pageUrl": "https://YOUR-DOMAIN/medicare?step=3&utm_source=facebook&utm_campaign=triadflow_q1_lifehealth",
  "referrer": "https://www.facebook.com/",
  "utm": {
    "source": "facebook",
    "medium": "paid_social",
    "campaign": "triadflow_q1_lifehealth",
    "term": null,
    "content": "creative_a_family"
  }
}
```

**Zapier Catch Hook setup:**
1. New Zap → Trigger: *Webhooks by Zapier → Catch Hook*.
2. Copy the unique webhook URL Zapier gives you.
3. Set it as `NEXT_PUBLIC_LEAD_WEBHOOK_URL` in `.env.local` (or in GitHub Pages env), or use the inherited default if the legacy Zap is still active.
4. Add the same email / SMS actions as in §1.
5. **Test fire:** Submit a real form once and confirm Zapier "received" the sample.

### Alternative: Make.com (formerly Integromat)
Make's "Custom Webhook" trigger works identically. Free plan = 1,000 ops/mo, more than enough for $15/day traffic. Replace the URL in `.env.local` and remap the scenario to send email + SMS.

## §3. Facebook Ad Campaign — exact config

### Campaign-level
- **Objective:** Leads
- **Buying type:** Auction
- **Campaign budget optimization:** OFF (we control at ad-set level for low spend)
- **Special ad categories:** Insurance is NOT formally restricted on Meta, but consider toggling **"Credit, Employment, Housing, or Social Issues"** as **None**. Insurance is allowed but require disclosure (license # in copy).

### Ad set #1 — Native Lead Form (70% of spend, $10.50/day)
| Field | Value |
|---|---|
| Conversion location | Instant forms |
| Performance goal | Maximize number of leads |
| Daily budget | $10.50 |
| Schedule | Run continuously, start tomorrow 6 AM ET |
| Location | **United States → North Carolina → ZIPs within 25 mi of:** 27401 (Greensboro), 27101 (Winston-Salem), 27260 (High Point) |
| Age | 30–65 |
| Gender | All |
| Detailed targeting (broad — Meta likes this for $15/day) | Leave EMPTY. Just rely on geo + age. With small budget, narrow interests starves the algo. |
| Languages | English (US) |
| Placements | Advantage+ placements (let Meta optimize) |

### Ad set #2 — Website Conversion (30% of spend, $4.50/day)
Identical targeting as #1, except:
| Field | Value |
|---|---|
| Conversion location | Website |
| Performance goal | Maximize number of conversions |
| Pixel | `183351282` |
| Conversion event | **Lead** (the fbq event the site fires on submit) |
| Daily budget | $4.50 |

⚠️ Caveat: Meta's algorithm needs ~50 weekly conversions to leave "learning." At ~$0.65/lead optimistic, we'd hit that around week 2. Until then, expect choppy CPLs.

### Ad creative — 3 variants to test

**Variant A — "Family protection" (image: Will + family-park scene, or generic stock)**
- Primary text:
  ```
  Greensboro, Winston-Salem, High Point friends — if something happened
  tomorrow, would your family be OK? Will Chappell, a licensed local
  agent right here in the Piedmont Triad, will compare life insurance
  quotes from top-rated carriers in 3 quick questions. Free. No pressure.
  ```
- Headline: `Free Life Insurance Quote — Piedmont Triad`
- Description: `Three questions. Quotes in your inbox. Licensed local agent.`
- CTA button: `Get Quote`

**Variant B — "Health gap" (image: clipboard / clinic visual, or Will at desk)**
- Primary text:
  ```
  Between jobs? Self-employed? Aging onto a different plan? Health
  coverage in NC doesn't have to be confusing. Will Chappell, a
  licensed local agent in the Triad, walks you through real options
  from top-rated carriers — in plain English. Three questions to start.
  ```
- Headline: `Free Health Coverage Quote — NC`
- Description: `Plain-English options from a local licensed agent.`
- CTA button: `Get Quote`

**Variant C — "Medicare 65+" (image: Will's portrait, warm tone)**
- Primary text:
  ```
  Turning 65 soon, or already on Medicare and wondering if your plan
  still fits? Will Chappell, a Piedmont Triad neighbor and licensed
  agent, will compare supplement and Advantage plans for you. Three
  questions, free quote, no obligation.
  ```
- Headline: `Free Medicare Supplement Review — Triad`
- Description: `Local agent. Three questions. No spam.`
- CTA button: `Get Offer`

### Creative direction (what to actually shoot/find)
- **Hero asset already in repo:** `public/will.webp` — use this. Trust signal is HUGE for insurance.
- **Variants to add later:**
  - Short 15-sec selfie video of Will introducing himself ("Hi, I'm Will, licensed agent here in the Triad...")
  - Local landmark composite (downtown Greensboro skyline + Will inset)
  - UGC-style testimonial graphic (text overlay: *"Will saved us $180/mo on health coverage" — Sarah K., Winston-Salem*) — **only if Will has a real testimonial with permission**
- **Format priority:** 1:1 (1080×1080) for feed, 9:16 (1080×1920) for Reels/Stories. Run both.

### Required compliance fragment
Add to the ad description or as the first comment under every ad:
```
Will Chappell is a North Carolina licensed insurance producer. License #
[NEED FROM WILL]. This is an advertisement. Quotes subject to
underwriting and carrier approval.
```

## §4. Tracking + attribution
- All FB-driven traffic to the website is auto-tagged with `?utm_source=facebook&utm_medium=paid_social&utm_campaign=...` (configure in the FB ad's URL parameters field).
- The wizard reads these and includes them in the webhook payload (see §2). Confirm in Zapier's task history that UTMs appear.
- GA4 reports under **Acquisition → Traffic acquisition** (the GA4 tag is already loaded).
- FB attribution: enable **Conversions API** later for iOS 14+ accuracy. Server-side CAPI is a v2 task — not required for launch.

## §5. Deploy — getting the site live
The repo isn't a git repository on disk yet. Steps:
```bash
cd "C:/Users/chris/Downloads/TriadFlow-os-main/TriadFlow-os-main"
git init
git add -A
git commit -m "TriadFlow v2 — 3-step life/health funnel with FB Pixel + Zapier webhook"
gh repo create TriadFlow-os --public --source=. --remote=origin --push
# OR if the repo already exists on GitHub:
# git remote add origin git@github.com:<USER>/TriadFlow-os.git
# git push -u origin main
```
The GH Pages workflow (`.github/workflows/deploy-pages.yml`) will run on push and publish to `https://<USER>.github.io/TriadFlow-os/`.

To rotate env vars for the deployed build, set them as repository variables in Settings → Secrets and variables → Actions → Variables, and the build will inline them.

## §6. KPIs to watch
At $15/day, expected week-1 numbers:

| Metric | Target | Concerning |
|---|---|---|
| Reach (people) | 4k–8k/wk | <2k |
| Frequency | 1.2–1.8 | >3 (creative fatigue) |
| CPC (link) | $0.80–$2 | >$3 |
| Landing-page view rate | >70% | <50% (slow site or wrong audience) |
| LP → Lead CR | 8–15% | <5% |
| CPL (blended) | $12–$25 | >$40 |
| Quality (Will's gut on calls) | 1 of 4 worth a follow-up | 0 of 8 |

**Kill criteria:** If after 7 days no ad set has a CPL under $40, pause and re-creative.

## §7. Open items — v2 backlog
- Server-side Conversions API (CAPI) for post-iOS-14 attribution
- Bing UET pixel for cross-channel
- Bilingual Spanish variant (Triad has ~10% Hispanic population)
- A/B test of `/medicare` (3-step) vs. a `/quick` (single-screen) funnel
- Replace `public/will.webp` with a freshly-shot professional photo + 15-sec video intro
- Add a `<details>` "What carriers do you work with?" expander on the wizard's step 1 for credibility
