import { Router } from "express";
import { db } from "@workspace/db";
import { reportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const DEFAULT_ORG = 1;

router.get("/reports", async (_req, res) => {
  const reports = await db.select().from(reportsTable).where(eq(reportsTable.organizationId, DEFAULT_ORG));
  return res.json(reports.map(formatReport));
});

router.post("/reports/generate", async (req, res) => {
  const body = req.body;
  const [inserted] = await db.insert(reportsTable).values({
    type: body.type,
    title: body.title,
    summary: `AI-generated ${body.type.replace(/_/g, " ")} report for ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}. Overall performance is tracking 12% above target for lead volume. ROAS at 4.2x — strong. Primary risk: landing page conversion rate drop detected this week.`,
    insights: [
      "CTR improved 18% but conversions remained flat — suggests landing page or offer issue",
      "Email channel has lowest CPL at $4.60 — significantly underinvested",
      "Singapore SME segment converts 2.3x better than average — opportunity to scale",
      "Brand search CTR spiked 47% — likely due to PR coverage, consider increasing budget",
    ],
    whatWorked: [
      "Brand search campaigns — ROAS 6.1x, well above 4.2x average",
      "Email nurture sequences — 28.4% open rate, 6.4% conversion",
      "LinkedIn audience targeting — highest qualified lead rate at 31%",
    ],
    whatDidntWork: [
      "Competitor Conquest campaign — CPA $142 vs $71 target",
      "Landing page B variant — 34% lower conversion than control",
      "TikTok ads test — insufficient data, paused after 5 days",
    ],
    recommendations: [
      "Pause Competitor Conquest campaign and rebuild keyword strategy",
      "Increase email marketing budget by 40% given lowest CPL",
      "Scale Singapore SME LinkedIn targeting by $8,000/month",
      "Fix landing page — run UX audit and A/B test new headline",
    ],
    organizationId: DEFAULT_ORG,
    campaignId: body.campaignId ?? null,
    campaignName: null,
  }).returning();
  return res.json(formatReport(inserted));
});

router.get("/reports/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const reports = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
  if (!reports.length) return res.status(404).json({ error: "Not found" });
  return res.json(formatReport(reports[0]));
});

function formatReport(r: any) {
  return {
    id: r.id, type: r.type, title: r.title, summary: r.summary,
    insights: r.insights || [], whatWorked: r.whatWorked || [],
    whatDidntWork: r.whatDidntWork || [], recommendations: r.recommendations || [],
    organizationId: r.organizationId, campaignId: r.campaignId, campaignName: r.campaignName,
    createdAt: r.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export default router;
