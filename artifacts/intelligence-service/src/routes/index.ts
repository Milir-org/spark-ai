import { Router } from "express";
import { db } from "@workspace/db";
import { recommendationsTable, segmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
const DEFAULT_ORG = 1;

// ─── Channels ─────────────────────────────────────────────────────────────────

router.get("/channels/ppc", (_req, res) => {
  return res.json({
    totalSpend: 58420, cpc: 3.24, ctr: 3.1, conversions: 847, cpa: 68.98, roas: 4.2,
    recommendations: [
      "Increase budget for 'Enterprise SaaS' campaign by 20% — ROAS is 6.1x vs 4.2x average",
      "Pause 'Competitor Keywords' ad group — CPA is $142, 2x higher than target",
      "Add 14 negative keywords to reduce wasted spend on non-converting queries",
    ],
    campaigns: [
      { name: "Brand Search — Core", spend: 12400, cpc: 1.82, ctr: 5.4, conversions: 312, status: "active" },
      { name: "Non-Brand — Growth", spend: 18900, cpc: 3.91, ctr: 2.8, conversions: 247, status: "active" },
      { name: "Competitor Conquest", spend: 8200, cpc: 5.12, ctr: 1.9, conversions: 58, status: "active" },
      { name: "Remarketing — Visitors", spend: 11400, cpc: 2.34, ctr: 4.1, conversions: 189, status: "active" },
      { name: "LinkedIn Lead Gen", spend: 7520, cpc: 6.84, ctr: 1.4, conversions: 41, status: "paused" },
    ],
    platforms: [
      { name: "Google Ads", status: "connected", logo: "google" },
      { name: "Microsoft Ads", status: "not_connected", logo: "microsoft" },
      { name: "Meta Ads", status: "connected", logo: "meta" },
      { name: "LinkedIn Ads", status: "connected", logo: "linkedin" },
    ],
  });
});

router.post("/channels/ppc/generate-ad-copy", (req, res) => {
  const { product, targetAudience } = req.body;
  return res.json([
    { headline: `Supercharge Your ${product ?? "Marketing"} ROI`, description: `AI-powered campaigns that drive qualified leads for ${targetAudience ?? "growth teams"}. Start seeing results in 14 days.`, cta: "Start Free Trial", platform: "Google" },
    { headline: `The Smarter Way to Run ${product ?? "Marketing"} Campaigns`, description: `Join 500+ teams using AI to plan, launch, and optimise multi-channel campaigns.`, cta: "Book a Demo", platform: "Google" },
    { headline: `Cut Campaign Time by 70% — Without Cutting Results`, description: `SPARK AI handles your campaign strategy, ad copy, CRM segments, and approvals — all in one command centre.`, cta: "See How It Works", platform: "LinkedIn" },
  ]);
});

router.get("/channels/seo", (_req, res) => {
  return res.json({
    seoScore: 64,
    technicalIssues: [
      { issue: "Missing meta descriptions", severity: "high", count: 14 },
      { issue: "Slow page load speed (>3s)", severity: "critical", count: 8 },
      { issue: "Broken internal links", severity: "medium", count: 22 },
      { issue: "Missing alt text on images", severity: "medium", count: 47 },
      { issue: "Duplicate H1 tags", severity: "high", count: 5 },
    ],
    contentIssues: [
      { issue: "Thin content pages (<300 words)", severity: "medium", count: 19 },
      { issue: "Missing structured data (Schema.org)", severity: "high", count: 8 },
      { issue: "Keyword cannibalization detected", severity: "high", count: 3 },
    ],
    keywordOpportunities: [
      { keyword: "ai marketing platform", volume: 8100, difficulty: 52, opportunity: "high" },
      { keyword: "campaign management software", volume: 5400, difficulty: 61, opportunity: "high" },
      { keyword: "marketing automation ai", volume: 12400, difficulty: 71, opportunity: "medium" },
    ],
    priorityTasks: [
      "Fix 8 slow-loading pages — estimated 18% traffic uplift",
      "Write meta descriptions for 14 priority landing pages",
      "Fix keyword cannibalization on 3 core topic clusters",
    ],
    metaTitleSuggestions: [
      "SPARK AI — AI-Powered Campaign Management Platform | Free Trial",
      "Automate Your Marketing Campaigns with AI | SPARK AI",
    ],
  });
});

router.post("/channels/seo/scan", (_req, res) => {
  return res.json({
    seoScore: 71,
    technicalIssues: [
      { issue: "Missing meta descriptions", severity: "high", count: 11 },
      { issue: "Slow page load speed (>3s)", severity: "critical", count: 5 },
    ],
    contentIssues: [{ issue: "Thin content pages (<300 words)", severity: "medium", count: 14 }],
    keywordOpportunities: [{ keyword: "ai marketing platform", volume: 8100, difficulty: 52, opportunity: "high" }],
    priorityTasks: ["Fix 5 slow pages — estimated 14% uplift"],
    metaTitleSuggestions: ["SPARK AI — AI Marketing Command Centre"],
  });
});

router.get("/channels/social", (_req, res) => {
  const posts: any[] = [];
  const platforms = ["LinkedIn", "Instagram", "Facebook", "Twitter/X"];
  const statuses = ["scheduled", "published", "draft"];
  const now = new Date();
  const contents = [
    "AI is changing the way marketing teams plan campaigns — not just executing faster, but thinking smarter.",
    "New feature: SPARK AI now generates complete multi-channel campaign blueprints in under 60 seconds.",
    "Why do 74% of leads go cold after 90 days? Because follow-up is inconsistent.",
    "Our clients are generating 3.2x more qualified leads with AI-assisted campaign planning.",
  ];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + (i - 4));
    posts.push({ id: i + 1, content: contents[i % 4], platform: platforms[i % platforms.length], scheduledDate: d.toISOString().split("T")[0], status: statuses[i % statuses.length], engagement: i < 4 ? Math.floor(150 + Math.random() * 800) : null });
  }
  return res.json({
    posts,
    platforms: [
      { name: "LinkedIn", followers: "12,400", status: "connected" },
      { name: "Instagram", followers: "8,200", status: "connected" },
      { name: "Facebook", followers: "6,800", status: "connected" },
      { name: "Twitter/X", followers: "4,100", status: "read_only" },
    ],
    engagementSummary: { totalReach: 94200, avgEngagement: 3.8, topPlatform: "LinkedIn" },
  });
});

router.post("/channels/social/generate-plan", (req, res) => {
  const { theme } = req.body;
  const platforms = ["LinkedIn", "Instagram", "Facebook", "Twitter/X", "LinkedIn"];
  const contents = ["Introducing our latest campaign designed to help growth teams scale faster with AI.", "Behind the scenes: How SPARK AI builds a complete campaign blueprint in 60 seconds.", "Customer spotlight: How one team generated 47 qualified leads in the first week.", "Key insight: Teams using AI campaign planning see 3.2x better lead quality on average.", "Week wrap-up: Lessons from running a multi-channel AI-assisted campaign."];
  return res.json(platforms.map((platform, i) => ({
    id: 100 + i, content: `[${theme ?? "Campaign Launch"} — Day ${i + 1}] ${contents[i % 5]}`, platform,
    scheduledDate: new Date(Date.now() + (i + 1) * 86400000).toISOString().split("T")[0], status: "draft", engagement: null,
  })));
});

router.get("/channels/crm", (_req, res) => {
  return res.json({
    segments: [
      { id: 1, name: "Dormant Leads (90+ days)", description: "Contacts with no activity in 90+ days", source: "HubSpot CRM", size: 312, tags: ["dormant", "reactivation"], insightSummary: "312 leads last contacted 90+ days ago. 68% opened at least 1 email.", organizationId: 1, conversionRate: 8.2, trend: "declining" },
      { id: 2, name: "High-Intent Visitors", description: "Visited pricing or features page 2+ times", source: "GA4 + CRM", size: 74, tags: ["high-intent", "hot"], insightSummary: "74 visitors hit pricing page 2+ times without converting.", organizationId: 1, conversionRate: 22.4, trend: "growing" },
      { id: 3, name: "Upsell Candidates", description: "Customers on Starter plan for 60+ days", source: "Billing + CRM", size: 127, tags: ["upsell"], insightSummary: "127 Starter plan customers approaching feature limits.", organizationId: 1, conversionRate: 34.1, trend: "stable" },
    ],
    emailSequences: [
      { id: 1, name: "Dormant Lead Reactivation", steps: 5, status: "active", targetSegment: "Dormant Leads (90+ days)" },
      { id: 2, name: "High-Intent Nurture", steps: 3, status: "draft", targetSegment: "High-Intent Visitors" },
      { id: 3, name: "Upsell Journey — Starter to Growth", steps: 4, status: "active", targetSegment: "Upsell Candidates" },
    ],
    lifecycleIdeas: ["30-day check-in sequence for new customers", "Quarterly ROI review email for Pro plan customers"],
    reactivationIdeas: ["Personalised video message for high-value dormant leads", "'What changed' campaign — showcase new features since they last engaged"],
  });
});

router.get("/channels/messaging", (_req, res) => {
  return res.json({
    templates: [
      { id: 1, name: "Lead Follow-Up — Day 1", type: "whatsapp", content: "Hi [Name], thanks for your interest in SPARK AI. What's the biggest challenge your marketing team is facing right now?", status: "approved" },
      { id: 2, name: "Demo No-Show Recovery", type: "whatsapp", content: "Hi [Name], looks like we missed you on our call earlier. Would [Day] at [Time] work better?", status: "pending" },
      { id: 3, name: "Post-Trial Reactivation", type: "whatsapp", content: "Hey [Name], your SPARK AI trial ended last week. We'd love to show you what you built — and how to scale it.", status: "approved" },
    ],
    flows: [
      { id: 1, name: "New Lead Follow-Up Flow", steps: 4, status: "active", trigger: "New lead created in CRM" },
      { id: 2, name: "Dormant Lead Reactivation", steps: 3, status: "draft", trigger: "Lead inactive for 90 days" },
    ],
    connectionStatus: "not_connected",
  });
});

router.get("/channels/analytics", (_req, res) => {
  return res.json({
    conversionFunnel: [
      { stage: "Website Visitors", value: 42800, conversionRate: 100 },
      { stage: "Landing Page Views", value: 18400, conversionRate: 43.0 },
      { stage: "Form Submissions", value: 1847, conversionRate: 44.0 },
      { stage: "Qualified Leads", value: 724, conversionRate: 39.2 },
      { stage: "Customers", value: 43, conversionRate: 23.0 },
    ],
    channelPerformance: [
      { channel: "Google PPC", spend: 28400, leads: 847, cpl: 33.53, conversionRate: 4.2 },
      { channel: "LinkedIn Ads", spend: 18200, leads: 312, cpl: 58.33, conversionRate: 2.8 },
      { channel: "SEO (Organic)", spend: 4200, leads: 728, cpl: 5.77, conversionRate: 5.1 },
    ],
    anomalies: [
      { title: "CTR spike on Brand Search (+47%)", severity: "info", description: "Brand search CTR increased 47% this week — likely due to PR coverage." },
      { title: "Conversion rate drop on landing page", severity: "warning", description: "Primary landing page conversion rate fell from 4.2% to 2.8% in 72 hours." },
      { title: "CPA exceeds target on Competitor campaign", severity: "critical", description: "Competitor Conquest campaign CPA hit $142 — 2x the $71 target." },
    ],
    aiSummary: "Overall campaign performance this month is tracking 12% above target for lead volume. SEO organic traffic declined 8% month-over-month. PPC ROAS of 4.2x is strong.",
    recommendedNextActions: [
      "Investigate and fix landing page conversion drop immediately",
      "Pause Competitor Conquest campaign pending restructure",
      "Increase Brand Search budget by 20% to capitalise on PR-driven CTR spike",
    ],
  });
});

// ─── Recommendations ──────────────────────────────────────────────────────────

router.get("/recommendations", async (req, res) => {
  const { status, type } = req.query as { status?: string; type?: string };
  let recs = await db.select().from(recommendationsTable).where(eq(recommendationsTable.organizationId, DEFAULT_ORG));
  if (status) recs = recs.filter((r) => r.status === status);
  if (type) recs = recs.filter((r) => r.type === type);
  return res.json(recs.map(formatRec));
});

router.post("/recommendations/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(recommendationsTable).set({ status: "approved" }).where(and(eq(recommendationsTable.id, id), eq(recommendationsTable.organizationId, DEFAULT_ORG))).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(formatRec(updated));
});

router.post("/recommendations/:id/reject", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(recommendationsTable).set({ status: "rejected" }).where(and(eq(recommendationsTable.id, id), eq(recommendationsTable.organizationId, DEFAULT_ORG))).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(formatRec(updated));
});

// ─── Segments ─────────────────────────────────────────────────────────────────

router.get("/segments", async (_req, res) => {
  const segments = await db.select().from(segmentsTable).where(eq(segmentsTable.organizationId, DEFAULT_ORG));
  return res.json(segments.map(formatSegment));
});

router.post("/segments", async (req, res) => {
  const body = req.body;
  const [inserted] = await db.insert(segmentsTable).values({
    name: body.name, description: body.description, source: body.source,
    size: Math.floor(Math.random() * 400 + 50), tags: body.tags || [],
    insightSummary: null, conversionRate: null, trend: "stable", organizationId: DEFAULT_ORG,
  }).returning();
  return res.status(201).json(formatSegment(inserted));
});

router.get("/segments/opportunities", (_req, res) => {
  return res.json([
    { id: 1, title: "312 dormant leads ready for reactivation", type: "reactivation", description: "312 leads have not been contacted in 90+ days. 68% previously opened emails.", potentialValue: "$89,400 pipeline opportunity", segmentSize: 312, priority: "high" },
    { id: 2, title: "74 high-intent visitors didn't convert", type: "conversion", description: "74 leads visited the pricing page 2+ times but did not submit a form.", potentialValue: "$142,000 potential ARR", segmentSize: 74, priority: "high" },
    { id: 3, title: "Singapore SME segment converts 2.3x better", type: "segment_insight", description: "Contacts tagged as Singapore SME owners have a 22.4% conversion rate vs 9.7% average.", potentialValue: "2.3x conversion improvement", segmentSize: 1240, priority: "medium" },
    { id: 4, title: "127 customers approaching plan limits", type: "upsell", description: "127 Starter plan customers have used 80%+ of their monthly campaign credits.", potentialValue: "$38,100 expansion MRR", segmentSize: 127, priority: "medium" },
  ]);
});

router.get("/segments/intelligence-summary", (_req, res) => {
  return res.json({
    dormantLeads: 312, highIntentVisitors: 74, upsellCandidates: 127,
    lostOpportunities: 89, highValueSegments: 4, poorLeadSources: 2,
    bestConvertingSegment: "Singapore SME Owners",
  });
});

function formatRec(r: any) {
  return {
    id: r.id, type: r.type, title: r.title, reasoning: r.reasoning,
    confidence: r.confidence, impactEstimate: r.impactEstimate, status: r.status,
    approvalRequired: r.approvalRequired, campaignId: r.campaignId,
    channelType: r.channelType, suggestedAction: r.suggestedAction,
    dataSources: r.dataSources || [], createdAt: r.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

function formatSegment(s: any) {
  return {
    id: s.id, name: s.name, description: s.description, source: s.source,
    size: s.size, tags: s.tags || [], insightSummary: s.insightSummary,
    organizationId: s.organizationId, conversionRate: s.conversionRate, trend: s.trend,
  };
}

export default router;
