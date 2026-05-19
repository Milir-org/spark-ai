import { Router } from "express";
import { db } from "@workspace/db";
import { segmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const DEFAULT_ORG = 1;

router.get("/segments", async (_req, res) => {
  const segments = await db.select().from(segmentsTable).where(eq(segmentsTable.organizationId, DEFAULT_ORG));
  return res.json(segments.map(formatSegment));
});

router.post("/segments", async (req, res) => {
  const body = req.body;
  const [inserted] = await db.insert(segmentsTable).values({
    name: body.name,
    description: body.description,
    source: body.source,
    size: Math.floor(Math.random() * 400 + 50),
    tags: body.tags || [],
    insightSummary: null,
    conversionRate: null,
    trend: "stable",
    organizationId: DEFAULT_ORG,
  }).returning();
  return res.status(201).json(formatSegment(inserted));
});

router.get("/segments/opportunities", (_req, res) => {
  return res.json([
    { id: 1, title: "312 dormant leads ready for reactivation", type: "reactivation", description: "312 leads have not been contacted in 90+ days. 68% previously opened emails. SPARK AI predicts 24% reactivation rate with personalised outreach.", potentialValue: "$89,400 pipeline opportunity", segmentSize: 312, priority: "high" },
    { id: 2, title: "74 high-intent visitors didn't convert", type: "conversion", description: "74 leads visited the pricing page 2+ times but did not submit a form. Average session time is 4.2 minutes. A targeted follow-up sequence could recover significant pipeline.", potentialValue: "$142,000 potential ARR", segmentSize: 74, priority: "high" },
    { id: 3, title: "Singapore SME segment converts 2.3x better", type: "segment_insight", description: "Contacts tagged as Singapore SME owners have a 22.4% conversion rate vs 9.7% average. Recommend increasing spend targeting this segment on LinkedIn and Google.", potentialValue: "2.3x conversion improvement", segmentSize: 1240, priority: "medium" },
    { id: 4, title: "127 customers approaching plan limits", type: "upsell", description: "127 Starter plan customers have used 80%+ of their monthly campaign credits. Targeted Growth plan upgrade campaign could drive expansion revenue.", potentialValue: "$38,100 expansion MRR", segmentSize: 127, priority: "medium" },
    { id: 5, title: "Campaign A leads have 3x lower LTV than Campaign B", type: "quality", description: "Despite Campaign A generating 2x more leads, post-sale LTV is $1,200 vs $3,800 for Campaign B. Recommend shifting 30% of budget from A to B.", potentialValue: "18% improvement in LTV", segmentSize: 189, priority: "high" },
  ]);
});

router.get("/segments/intelligence-summary", (_req, res) => {
  return res.json({
    dormantLeads: 312,
    highIntentVisitors: 74,
    upsellCandidates: 127,
    lostOpportunities: 89,
    highValueSegments: 4,
    poorLeadSources: 2,
    bestConvertingSegment: "Singapore SME Owners",
  });
});

function formatSegment(s: any) {
  return {
    id: s.id, name: s.name, description: s.description, source: s.source,
    size: s.size, tags: s.tags || [], insightSummary: s.insightSummary,
    organizationId: s.organizationId, conversionRate: s.conversionRate,
    trend: s.trend,
  };
}

export default router;
