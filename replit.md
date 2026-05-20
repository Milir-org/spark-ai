# SPARK AI — Marketing Command Centre

An enterprise-grade AI-powered marketing suite SaaS prototype. Enables B2B marketing teams to plan, activate, approve, and report on campaigns across all channels from a single intelligent platform.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/spark-ai run dev` — run the frontend (port from env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + Wouter + React Query

## Where things live

- **API contract**: `lib/api-spec/openapi.yaml` (source of truth for all types + hooks)
- **Generated hooks**: `lib/api-client-react/` (auto-generated, do not edit manually)
- **DB schema**: `lib/db/src/schema/campaigns.ts` — campaigns, blueprints, providerDrafts tables
- **API routes**: `artifacts/api-server/src/routes/campaigns.ts` — all campaign logic
- **Blueprint Studio**: `artifacts/spark-ai/src/pages/app/channels/PPC.tsx`
- **Campaign Detail**: `artifacts/spark-ai/src/pages/app/CampaignDetail.tsx`
- **Theme**: dark-only (`class="dark"` on `<html>`), electric violet primary, `#0b0d14` navy bg

## Architecture decisions

- **One canonical campaign workflow**: `NewCampaign.tsx` is a thin redirect to `/channels/ppc?new=1`. The PPC Blueprint Studio is the sole entry point for creating campaigns.
- **Blueprint Studio is API-connected**: `Generate Campaign Blueprint` calls `POST /campaigns` + `POST /campaigns/:id/blueprint` via Orval hooks. `Request Approval` calls `POST /campaigns/:id/submit-approval` then navigates to `/campaigns/:id`.
- **Structured blueprint model**: The blueprint schema uses structured JSON fields (`platformStrategy[]`, `keywordThemes[]`, `negativeKeywordThemes[]`, `adDirection`, `trackingPlan`) instead of flat text blobs.
- **Provider draft model**: `providerDraftsTable` stores Google Ads / Microsoft Advertising readiness scores, validation issues, and sync status per campaign. Seeded automatically on campaign creation and updated after blueprint generation.
- **Approval model**: Campaigns carry `approvalRequirements[]` from the blueprint + provider draft readiness gates. `CampaignDetail.tsx` shows a 4-tab view: Overview, Blueprint (structured sections), Provider Readiness (gauges), Approval timeline.
- **No shadcn Card/Badge in PPC**: PPC.tsx uses raw `div` elements with Tailwind for the dark-first design. Other pages may use shadcn components.

## Product

- **PPC Blueprint Studio** (`/channels/ppc`): Full-page fixed overlay. 7-section left nav (Intent → Platform Strategy → Keyword Themes → Budget → Ad Direction → Tracking → Review). SPARK generates a complete campaign strategy on "Generate Blueprint". Connects to real API.
- **Campaign Detail** (`/campaigns/:id`): 4-tab view showing structured blueprint sections, provider draft readiness gauges (Google/Bing), approval timeline, and KPI strip.
- **PPC Overview**: Command centre with AI opportunity band, campaign list, approval queue, tracking issues, and AI opportunity cards.
- **Other channels**: SEO, Social, CRM, Messaging, Creative, Analytics — all with their own workbench views.
- **Approvals hub**: `/approvals` — review pending budget/creative/strategy approvals across all campaigns.

## GitHub

- **Repo**: https://github.com/milir-ai/spark-ai (branch: `main`)
- **Push**: `bash scripts/push-github.sh` — writes to GitHub using the `GITHUB_TOKEN` secret
- **Workflow**: small batches → commit → push after every task. End of task summary includes branch, latest hash, files changed, and verification.
- `GITHUB_TOKEN` is stored as a Replit secret (repo scope). Never hardcode it.

## Gotchas

- After schema changes, always run `pnpm --filter @workspace/db run push` then `pnpm --filter @workspace/api-spec run codegen` in that order.
- Do NOT run `pnpm dev` at root — use workflow restart or `pnpm --filter` instead.
- Blueprint Studio uses local `generateBlueprint()` as a fallback if the API is unreachable, so it always renders something.
- `lib/api-spec/openapi.yaml` title must stay `Api` — changing it breaks generated import paths.

## User preferences

- Dark mode only — no light mode toggle.
- No shadcn Card/Badge in PPC.tsx — raw Tailwind divs only.
- Electric violet (`hsl(255 80% 65%)`) as primary, `#0b0d14` as page background.
- Prototype pragmatism: mock data where needed, but data shapes must support the long-term product model.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- API routes: `artifacts/api-server/src/routes/` — one file per domain
- DB schema: `lib/db/src/schema/` — one file per domain, exported from `index.ts`
