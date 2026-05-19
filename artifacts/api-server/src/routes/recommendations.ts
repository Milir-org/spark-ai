import { Router } from "express";
import { db } from "@workspace/db";
import { recommendationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
const DEFAULT_ORG = 1;

router.get("/recommendations", async (req, res) => {
  const { status, type } = req.query as { status?: string; type?: string };
  let recs = await db.select().from(recommendationsTable).where(eq(recommendationsTable.organizationId, DEFAULT_ORG));
  if (status) recs = recs.filter((r) => r.status === status);
  if (type) recs = recs.filter((r) => r.type === type);
  return res.json(recs.map(formatRec));
});

router.post("/recommendations/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(recommendationsTable).set({ status: "approved" }).where(
    and(eq(recommendationsTable.id, id), eq(recommendationsTable.organizationId, DEFAULT_ORG))
  ).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(formatRec(updated));
});

router.post("/recommendations/:id/reject", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(recommendationsTable).set({ status: "rejected" }).where(
    and(eq(recommendationsTable.id, id), eq(recommendationsTable.organizationId, DEFAULT_ORG))
  ).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(formatRec(updated));
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

export default router;
