import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable, blueprintsTable, approvalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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
    objective: body.objective,
    status: "draft",
    budget: body.budget,
    dailyBudget: body.dailyBudget ?? null,
    startDate: body.startDate,
    endDate: body.endDate,
    channels: body.channels ?? [],
    organizationId: DEFAULT_ORG,
    ownerId: 1,
    targetAudience: body.targetAudience ?? null,
    productDescription: body.productDescription ?? null,
    spendStyle: body.spendStyle ?? null,
    healthScore: null,
    leadsGenerated: null,
    spend: null,
  }).returning();
  return res.status(201).json(formatCampaign(inserted));
});

router.get("/campaigns/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const campaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id)).limit(1);
  if (!campaigns.length) return res.status(404).json({ error: "Not found" });
  const campaign = campaigns[0];
  const blueprints = await db.select().from(blueprintsTable).where(eq(blueprintsTable.campaignId, id)).limit(1);
  const blueprint = blueprints[0] ?? null;
  return res.json({ ...formatCampaign(campaign), blueprint: blueprint ? formatBlueprint(blueprint) : null });
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
  await db.delete(blueprintsTable).where(eq(blueprintsTable.campaignId, id));
  const [blueprint] = await db.insert(blueprintsTable).values({
    campaignId: id,
    strategySummary: `SPARK AI has designed a comprehensive ${c.objective.replace(/_/g, " ")} campaign for "${c.name}". The strategy leverages a multi-channel approach to maximise reach, engagement, and conversion across your target audience segments, with smart budget allocation based on predicted channel performance.`,
    audienceStrategy: `Primary audience: ${c.targetAudience ?? "Marketing decision-makers and business owners aged 28–55"}. Segmentation approach: Behavioural + firmographic. Top segments: High-intent website visitors (74 contacts), dormant CRM leads >90 days (312 contacts), LinkedIn matched audience (2,400 prospects). Exclude: current active customers, bounced email contacts.`,
    budgetPlan: `Total budget: $${c.budget.toLocaleString()}. Recommended split: PPC 40% ($${(c.budget * 0.4).toFixed(0)}), Social 25% ($${(c.budget * 0.25).toFixed(0)}), Content/SEO 20% ($${(c.budget * 0.2).toFixed(0)}), Email/Messaging 15% ($${(c.budget * 0.15).toFixed(0)}). Pacing: ${c.spendStyle ?? "balanced"} — ramp up in week 1–2, peak in weeks 3–4.`,
    channelPlan: `Selected channels: ${(c.channels as string[]).join(", ") || "PPC, Social, Email"}. PPC: Google Search + Display targeting high-intent keywords. Social: LinkedIn sponsored content + Meta retargeting carousel. Email: 5-step nurture sequence to warm segments. WhatsApp: re-engagement flow for dormant leads.`,
    creativePlan: `Asset pack required: 3 ad copy variants (A/B/C test), 2 landing page copy versions, 5 social captions (LinkedIn, Instagram, Facebook, Twitter, Threads), 1 email sequence (5 emails), 2 WhatsApp message flows. Brand tone: professional, confident, solutions-focused. All copy to highlight ROI and time-to-value.`,
    experimentPlan: `A/B Test 1: Landing page headline — "Grow faster" vs "Generate more qualified leads". A/B Test 2: CTA button — "Book a Demo" vs "Start Free Trial". Audience split test: Behavioural vs Lookalike audiences on Meta. Duration: 14 days per test. Success metric: CPA reduction of 15%+.`,
    measurementPlan: `Primary KPIs: Cost per qualified lead (target: <$45), Lead-to-opportunity rate (target: >22%), ROAS (target: >3.5x). Secondary KPIs: CTR >2.5%, Email open rate >28%, LinkedIn engagement rate >3%. Reporting cadence: daily automated alerts, weekly AI report, monthly executive summary.`,
    executionChecklist: [
      "Set up conversion tracking in GA4 and ad platforms",
      "Create and QA all creative assets",
      "Configure audience segments in each platform",
      "Set up email sequence in CRM",
      "Create WhatsApp message flow with approval",
      "Brief channel specialists on campaign objectives",
      "Request finance approval for budget allocation",
      "Launch PPC campaigns and monitor for 48h",
      "Schedule social posts via content calendar",
      "Set up daily performance alerts"
    ],
    approvalRequirements: [
      "Finance Approver: Budget allocation >$10,000",
      "Creative Reviewer: All ad copy and creative assets",
      "Marketing Manager: Campaign strategy and audience targeting",
      "Admin: Platform execution and campaign go-live"
    ],
  }).returning();
  await db.update(campaignsTable).set({ status: "planning" }).where(eq(campaignsTable.id, id));
  return res.json(formatBlueprint(blueprint));
});

router.post("/campaigns/:id/submit-approval", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(campaignsTable).set({ status: "awaiting_approval" }).where(eq(campaignsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(formatCampaign(updated));
});

function formatCampaign(c: any) {
  return {
    id: c.id, name: c.name, objective: c.objective, status: c.status,
    budget: c.budget, dailyBudget: c.dailyBudget,
    startDate: c.startDate, endDate: c.endDate, channels: c.channels || [],
    organizationId: c.organizationId, ownerId: c.ownerId, ownerName: "Alex Chen",
    targetAudience: c.targetAudience, productDescription: c.productDescription,
    spendStyle: c.spendStyle, healthScore: c.healthScore,
    leadsGenerated: c.leadsGenerated, spend: c.spend,
    blueprint: null, createdAt: c.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

function formatBlueprint(b: any) {
  return {
    id: b.id, campaignId: b.campaignId,
    strategySummary: b.strategySummary, audienceStrategy: b.audienceStrategy,
    budgetPlan: b.budgetPlan, channelPlan: b.channelPlan,
    creativePlan: b.creativePlan, experimentPlan: b.experimentPlan,
    measurementPlan: b.measurementPlan,
    executionChecklist: b.executionChecklist || [],
    approvalRequirements: b.approvalRequirements || [],
  };
}

export default router;
