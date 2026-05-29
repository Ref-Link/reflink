<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
New constitution — initial ratification.

Principles defined:
  I.   信頼インフラ第一 (Trust Infrastructure First)
  II.  既存文化の尊重 (Respect Existing Culture)
  III. 最小限のデジタル化 (Minimal Digitization)
  IV.  半クローズドコミュニティ (Semi-Closed Community)
  V.   段階的な信頼可視化 (Gradual Trust Visibility)

Added sections:
  - Tech Stack Constraints
  - Development Workflow

Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check section is generic; no update needed
  ✅ .specify/templates/spec-template.md — no constitution-specific references; no update needed
  ✅ .specify/templates/tasks-template.md — no constitution-specific references; no update needed

Deferred TODOs: none
-->

# RefLink Constitution

## Core Principles

### I. 信頼インフラ第一 (Trust Infrastructure First)

RefLink MUST be designed as a **trust infrastructure** for regional sports communities,
not as a referee consumption or dispatching service.

Every product decision MUST be evaluated against the question:
"Does this strengthen long-term trust between referees, clubs, and regions?"
Features that optimise for volume or velocity at the expense of trust MUST be rejected.

**Rationale**: The mission is to increase reliable referee connections in grassroots
football — not to maximise throughput. Trust is the product.

### II. 既存文化の尊重 (Respect Existing Culture)

RefLink MUST NOT force cultural change on its users. Existing workflows —
LINE, phone calls, face-to-face coordination — MUST be treated as first-class.
The platform MAY provide alternatives but MUST NOT deprecate or replace them.

Specifically: migration to a new communication channel (e.g., "please use Discord")
is PROHIBITED as a product requirement.

**Rationale**: The field already works. RefLink reduces coordination cost; it does
not own the coordination.

### III. 最小限のデジタル化 (Minimal Digitization)

Only back-end complexity MUST be digitised. User-facing interactions MUST remain
as simple as possible.

- Referee side: LINE notifications + single-tap response.
- Admin side: web management screen only.

Features that increase visible complexity for referees or clubs without a clear
trust or coordination benefit MUST be deferred.

**Rationale**: Adoption depends on low friction. A referee who already manages
five LINE groups MUST not feel that RefLink is a sixth.

### IV. 半クローズドコミュニティ (Semi-Closed Community)

RefLink MUST operate on a **regional, semi-closed** access model.
The following MUST be prohibited in initial releases:

- Open/public referee search (unauthenticated or cross-region)
- DMs from arbitrary users
- Follower/following social graph features
- Score-based public rankings

Access MUST be gated by either invitation or regional-admin approval.
Real-name disclosure MUST occur only after a match is confirmed, within the same
community, or via a regional admin.

**Rationale**: Safety and trust require controlled introductions. An open SNS
model would undermine the community-based credibility that makes the platform
valuable.

### V. 段階的な信頼可視化 (Gradual Trust Visibility)

Numeric rating or scoring systems MUST NOT be introduced in MVP or Phase 2.
Trust signals MUST be represented as objective, verifiable history:

- Assignment history (matches officiated)
- Continuity (repeat participation)
- Licence / qualification level
- Experience age-group
- Referral relationship (who introduced whom)

Subjective evaluation features (stars, ratings, reviews) MAY be considered in
Phase 3 or later, only after community norms are established.

**Rationale**: Premature scoring cultures damage newcomer participation and
incentivise gaming behaviour before the community has sufficient scale or norms
to self-correct.

---

## Tech Stack Constraints

The following stack MUST be used unless explicitly amended via constitution update:

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js (PWA) | Mobile-first, offline-capable |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime) | No custom auth server |
| Hosting | Vercel | |
| Notifications | LINE Developers (Messaging API) | Primary referee channel |

Third-party services outside this list MUST be justified in the feature plan and
reviewed against Principles II and III before adoption.

Payment processing MUST NOT be integrated in MVP or Phase 2.
Existing settlement methods (cash on-site, PayPay, etc.) MUST remain supported
as the default.

---

## Development Workflow

1. Every feature MUST have a spec (`/speckit-specify`) before implementation begins.
2. Implementation MUST start from the MVP user story (P1) and deliver independently
   testable increments per user story.
3. Each feature plan MUST include a **Constitution Check** section that explicitly
   verifies compliance with Principles I–V before Phase 0 research starts and again
   after Phase 1 design.
4. Any deviation from the tech stack or access model MUST be flagged in the plan's
   Complexity Tracking table with a justification.
5. Pilot rollout MUST target a single region (20–30 referees, a few clubs, one
   tournament) before expanding; data from the pilot informs Phase 2 scoping.

---

## Governance

This Constitution supersedes all other practices, style guides, and verbal agreements
for the RefLink project. Amendments require:

1. A written rationale documenting what changes and why.
2. A version bump per semantic versioning (see below).
3. Propagation of impacts to all dependent templates (plan, spec, tasks).
4. A dated record in this file's Last Amended field.

**Versioning policy**:
- MAJOR: Removal or redefinition of a Core Principle.
- MINOR: New principle, section, or materially expanded guidance.
- PATCH: Clarifications, wording, or non-semantic refinements.

All feature plans and reviews MUST verify compliance with this Constitution.
Complexity or exceptions MUST be justified explicitly — never silently bypassed.

**Version**: 1.0.0 | **Ratified**: 2026-05-29 | **Last Amended**: 2026-05-29
