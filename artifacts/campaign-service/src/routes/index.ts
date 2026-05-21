import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable, blueprintsTable, providerDraftsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type {
  PlatformStrategyEntry, KeywordThemeEntry, NegativeThemeEntry,
  AdDirectionEntry, ProviderValidationIssue,
} from "@workspace/db";

const router = Router();
const DEFAULT_ORG = 1;

router.get("/campaigns", async (req, res) => {
  const { status, search } = req.query as { status?: string; search?: string };
  let campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.organizationId, DEFAULT_ORG));
  if (status) campaigns = campaigns.filter((c) => c.status === status);
  if (search) campaigns = campaigns.filter((c) => c.name.toLowerCase().includes((search as string).toLowerCase()));
  return res.json(campaigns.map(formatCampaign));
});

router.post("/campaigns", async (req, res) => {
  const body = req.body;
  const [inserted] = await db.insert(campaignsTable).values({
    name: body.name,
    objective: body.objective ?? body.primaryObjective ?? "lead_generation",
    primaryObjective: body.primaryObjective ?? body.objective ?? null,
    secondaryObjectives: body.secondaryObjectives ?? [],
    status: "draft", budget: body.budget ?? 10000, dailyBudget: body.dailyBudget ?? null,
    startDate: body.startDate ?? new Date().toISOString().split("T")[0],
    endDate: body.endDate ?? new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    channels: body.channels ?? ["ppc"], organizationId: DEFAULT_ORG, ownerId: 1,
    targetAudience: body.targetAudience ?? null,
    productDescription: body.productDescription ?? null,
    spendStyle: body.spendStyle ?? null, geography: body.geography ?? null,
    landingPage: body.landingPage ?? null, healthScore: null,
    leadsGenerated: null, spend: null,
  }).returning();
  await seedProviderDrafts(inserted.id, { google: 85, bing: 72 });
  return res.status(201).json(formatCampaign(inserted));
});

router.get("/campaigns/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id)).limit(1);
  if (!campaigns.length) return res.status(404).json({ error: "Not found" });
  const blueprints = await db.select().from(blueprintsTable).where(eq(blueprintsTable.campaignId, id)).limit(1);
  const drafts = await db.select().from(providerDraftsTable).where(eq(providerDraftsTable.campaignId, id));
  return res.json({
    ...formatCampaign(campaigns[0]),
    blueprint: blueprints[0] ? formatBlueprint(blueprints[0]) : null,
    providerDrafts: drafts.map(formatProviderDraft),
  });
});

router.patch("/campaigns/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = req.body;
  const [updated] = await db.update(campaignsTable).set({
    ...(body.name !== undefined && { name: body.name }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.budget !== undefined && { budget: body.budget }),
    ...(body.targetAudience !== undefined && { targetAudience: body.targetAudience }),
    ...(body.productDescription !== undefined && { productDescription: body.productDescription }),
    ...(body.geography !== undefined && { geography: body.geography }),
    ...(body.landingPage !== undefined && { landingPage: body.landingPage }),
    ...(body.primaryObjective !== undefined && { primaryObjective: body.primaryObjective }),
    ...(body.secondaryObjectives !== undefined && { secondaryObjectives: body.secondaryObjectives }),
  }).where(eq(campaignsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(formatCampaign(updated));
});

router.delete("/campaigns/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(campaignsTable).where(eq(campaignsTable.id, id));
  return res.status(204).send();
});

router.post("/campaigns/:id/blueprint", async (req, res) => {
  const id = parseInt(req.params.id);
  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id)).limit(1);
  if (!campaigns.length) return res.status(404).json({ error: "Not found" });
  const c = campaigns[0];
  const geo = c.geography?.split(",")[0]?.trim() ?? "APAC";
  const product = c.productDescription ?? "your product";
  const audience = c.targetAudience ?? "marketing decision-makers";
  const goal = (c.primaryObjective ?? c.objective).replace(/_/g, " ");
  const budget = c.budget;
  const spendStyle = c.spendStyle ?? "balanced";

  const platformStrategy: PlatformStrategyEntry[] = [
    { name: "Google Ads", budgetPct: 65, rationale: "Highest search intent volume — captures users already searching for your solution.", recommended: true },
    { name: "Microsoft Advertising", budgetPct: 25, rationale: "Lower CPCs for B2B audiences. Strong on LinkedIn-profile targeting via MSA.", recommended: true },
    { name: "Display / YouTube", budgetPct: 10, rationale: "Retargeting warm visitors and building brand recall for mid-funnel.", recommended: false },
  ];

  const keywordThemes: KeywordThemeEntry[] = [
    { id: 1, name: "Brand Terms", intent: "Brand", keywords: ["spark ai", "spark marketing ai", "spark campaign platform"], approved: null },
    { id: 2, name: "High-Intent Alternatives", intent: "High Intent", keywords: ["ai marketing platform", "automated campaign management", "ai media buying"], approved: null },
    { id: 3, name: "Product Category", intent: "Product", keywords: ["ppc management software", "google ads automation", "campaign intelligence tool"], approved: null },
    { id: 4, name: "Competitor Conquest", intent: "Competitor", keywords: ["wordstream alternative", "semrush ads tool", "hubspot ads alternative"], approved: null },
    { id: 5, name: "Pain-Point Search", intent: "High Intent", keywords: ["reduce ad spend waste", "improve roas", "lower cost per lead"], approved: null },
  ];

  const negativeKeywordThemes: NegativeThemeEntry[] = [
    { id: 1, name: "Free / DIY Seekers", rationale: "High volume but low commercial intent.", terms: ["free", "diy", "how to", "tutorial", "course"] },
    { id: 2, name: "Job Seekers", rationale: "Common contamination in SaaS searches.", terms: ["jobs", "career", "salary", "hiring", "internship"] },
    { id: 3, name: "Irrelevant Verticals", rationale: "Adjacent but non-relevant search terms.", terms: ["real estate", "restaurant", "ecommerce store", "shopify"] },
  ];

  const adDirection: AdDirectionEntry = {
    angle: `Lead with speed-to-insight and ROI transparency — ${audience} are frustrated with black-box agency reporting. SPARK makes decisions visible and accountable.`,
    tone: "Confident, clear, outcome-focused. Avoid buzzwords. Use specifics and numbers.",
    headlines: [
      "AI Campaigns That Actually Deliver", `Cut CPL by 40% — Powered by SPARK AI`,
      "Stop Guessing. Start Knowing.", "Your AI Marketing Command Centre",
      "From Blueprint to Launch in Hours",
    ],
    descriptions: [
      `Plan, activate, and optimise ${goal} campaigns with full AI guidance. Every decision explained.`,
      `Enterprise marketing intelligence for B2B SaaS teams in ${geo}. See results inside 30 days.`,
    ],
  };

  await db.delete(blueprintsTable).where(eq(blueprintsTable.campaignId, id));
  const [blueprint] = await db.insert(blueprintsTable).values({
    campaignId: id,
    strategicAngle: `Position this ${goal} campaign as the high-trust AI-led alternative to slow, expensive agency retainers for ${audience} in ${geo}. Lead with outcomes: qualified leads, reduced CPL, and full transparency.`,
    strategySummary: `AI-designed ${goal} campaign for "${c.name}". Multi-channel approach leveraging paid search and retargeting to maximise qualified reach across ${audience} in ${geo}.`,
    audienceStrategy: `Primary: ${audience}. Segmentation: Behavioural + firmographic. Top segments: High-intent website visitors (74 contacts), dormant CRM leads >90 days (312 contacts), LinkedIn-matched audience (2,400 prospects).`,
    budgetPlan: `Total: $${budget.toLocaleString()}. Split: Google Ads 65% ($${(budget * 0.65).toFixed(0)}), Microsoft Advertising 25% ($${(budget * 0.25).toFixed(0)}), Retargeting 10% ($${(budget * 0.10).toFixed(0)}). Pacing: ${spendStyle}.`,
    channelPlan: `Google Search + Display targeting high-intent keywords. Microsoft Advertising for LinkedIn-profile matched B2B audiences. Retargeting via Google Display for warm website visitors.`,
    creativePlan: `Asset pack: 3 ad copy variants (A/B/C), 2 landing page headline variants, 5 responsive search ads per ad group.`,
    experimentPlan: `A/B Test 1: Landing headline. A/B Test 2: CTA — "Book a Demo" vs "Start Free Trial". Duration: 14 days per test.`,
    measurementPlan: `Primary KPIs: Cost per qualified lead (target <$45), Lead-to-opportunity rate (>22%), ROAS (>3.5×). Secondary: CTR >2.5%, conversion rate >3.8%.`,
    trackingPlan: `GA4 conversion events: form_submit (primary), demo_booked (primary), page_view_pricing (secondary). Google Tag Manager container required.`,
    platformStrategy, keywordThemes, negativeKeywordThemes, adDirection,
    executionChecklist: [
      "Set up conversion tracking in GA4 and link to Google Ads",
      "Create responsive search ads for each keyword theme",
      "Configure audience segments per platform",
      "Set up Microsoft Advertising account and import Google campaigns",
      "Brief creative team on ad direction and tone guidelines",
      "Request Finance approval for budget allocation (>$10k)",
      "QA all tracking tags in staging before launch",
    ],
    approvalRequirements: [
      "Finance Approver: Budget allocation >$10,000",
      "Creative Reviewer: All ad copy and creative assets",
      "Marketing Manager: Campaign strategy and audience targeting",
      "Admin: Platform execution and campaign go-live",
    ],
    risks: [
      "Low initial Quality Score on non-brand terms — first 2 weeks may show higher CPCs",
      "Competitor conquest terms carry higher CPCs and moderate conversion rates",
    ],
    assumptions: [
      "Landing page conversion rate baseline: 3.8%",
      "Target geography has sufficient search volume for all keyword themes",
    ],
  }).returning();

  await updateProviderReadiness(id, 85, 72);
  await db.update(campaignsTable).set({ status: "planning" }).where(eq(campaignsTable.id, id));
  return res.json(formatBlueprint(blueprint));
});

router.post("/campaigns/:id/submit-approval", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(campaignsTable).set({ status: "awaiting_approval" }).where(eq(campaignsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(formatCampaign(updated));
});

router.get("/campaigns/:id/provider-drafts", async (req, res) => {
  const id = parseInt(req.params.id);
  const drafts = await db.select().from(providerDraftsTable).where(eq(providerDraftsTable.campaignId, id));
  if (!drafts.length) {
    await seedProviderDrafts(id, { google: 0, bing: 0 });
    const seeded = await db.select().from(providerDraftsTable).where(eq(providerDraftsTable.campaignId, id));
    return res.json(seeded.map(formatProviderDraft));
  }
  return res.json(drafts.map(formatProviderDraft));
});

router.get("/campaigns/:id/approval-blockers", async (req, res) => {
  const id = parseInt(req.params.id);
  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id)).limit(1);
  if (!campaigns.length) return res.status(404).json({ error: "Not found" });
  const blueprints = await db.select().from(blueprintsTable).where(eq(blueprintsTable.campaignId, id)).limit(1);
  const blockers: any[] = [];
  if (!blueprints.length) blockers.push({ type: "missing_blueprint", label: "Blueprint not generated", severity: "error" });
  const drafts = await db.select().from(providerDraftsTable).where(eq(providerDraftsTable.campaignId, id));
  for (const draft of drafts) {
    const issues = (draft.validationIssues as ProviderValidationIssue[] ?? []).filter((i) => i.severity === "error");
    if (issues.length) blockers.push({ type: "provider_validation", label: `${draft.provider}: ${issues.length} validation error(s)`, severity: "error" });
  }
  return res.json({ blockers, canSubmit: blockers.length === 0 });
});

async function seedProviderDrafts(campaignId: number, scores: { google: number; bing: number }) {
  const googleIssues: ProviderValidationIssue[] = scores.google >= 80 ? [] : [{ field: "conversionTracking", severity: "warning", message: "Conversion tracking not verified in Google Ads account" }];
  const bingIssues: ProviderValidationIssue[] = scores.bing >= 70 ? [] : [{ field: "accountVerification", severity: "warning", message: "Microsoft Advertising account requires additional verification" }];
  await db.insert(providerDraftsTable).values([
    { campaignId, provider: "google_ads", readinessScore: scores.google, status: scores.google > 0 ? "draft_ready" : "not_started", validationIssues: googleIssues, draftSummary: "Campaign structure imported. Keywords and ads pending final review.", accountStatus: "active", syncStatus: scores.google > 0 ? "synced" : "not_synced" },
    { campaignId, provider: "microsoft_advertising", readinessScore: scores.bing, status: scores.bing > 0 ? "draft_ready" : "not_started", validationIssues: bingIssues, draftSummary: "Imported from Google Ads structure. Bid adjustments pending.", accountStatus: "active", syncStatus: scores.bing > 0 ? "synced" : "not_synced" },
  ]);
}

async function updateProviderReadiness(campaignId: number, googleScore: number, bingScore: number) {
  const drafts = await db.select().from(providerDraftsTable).where(eq(providerDraftsTable.campaignId, campaignId));
  for (const draft of drafts) {
    const score = draft.provider === "google_ads" ? googleScore : bingScore;
    const issues: ProviderValidationIssue[] = score >= 80 ? [] : [{ field: "conversionTracking", severity: "warning", message: "Verify conversion tracking before launch" }];
    await db.update(providerDraftsTable).set({ readinessScore: score, status: "draft_ready", validationIssues: issues, syncStatus: "synced" }).where(eq(providerDraftsTable.id, draft.id));
  }
}

function formatCampaign(c: any) {
  return {
    id: c.id, name: c.name, objective: c.objective,
    primaryObjective: c.primaryObjective ?? c.objective,
    secondaryObjectives: c.secondaryObjectives ?? [],
    status: c.status, budget: c.budget, dailyBudget: c.dailyBudget,
    startDate: c.startDate, endDate: c.endDate, channels: c.channels || [],
    organizationId: c.organizationId, ownerId: c.ownerId, ownerName: "Alex Chen",
    targetAudience: c.targetAudience, productDescription: c.productDescription,
    spendStyle: c.spendStyle, geography: c.geography, landingPage: c.landingPage,
    healthScore: c.healthScore, leadsGenerated: c.leadsGenerated, spend: c.spend,
    blueprint: null, providerDrafts: [],
    createdAt: c.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

function formatBlueprint(b: any) {
  return {
    id: b.id, campaignId: b.campaignId, strategicAngle: b.strategicAngle ?? null,
    strategySummary: b.strategySummary, audienceStrategy: b.audienceStrategy,
    budgetPlan: b.budgetPlan, channelPlan: b.channelPlan, creativePlan: b.creativePlan,
    experimentPlan: b.experimentPlan, measurementPlan: b.measurementPlan,
    trackingPlan: b.trackingPlan ?? null, platformStrategy: b.platformStrategy ?? [],
    keywordThemes: b.keywordThemes ?? [], negativeKeywordThemes: b.negativeKeywordThemes ?? [],
    adDirection: b.adDirection ?? null, executionChecklist: b.executionChecklist || [],
    approvalRequirements: b.approvalRequirements || [],
    risks: b.risks ?? [], assumptions: b.assumptions ?? [],
  };
}

function formatProviderDraft(d: any) {
  return {
    id: d.id, campaignId: d.campaignId, provider: d.provider,
    readinessScore: d.readinessScore, status: d.status,
    validationIssues: d.validationIssues ?? [], draftSummary: d.draftSummary,
    accountStatus: d.accountStatus, syncStatus: d.syncStatus,
    createdAt: d.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export default router;
