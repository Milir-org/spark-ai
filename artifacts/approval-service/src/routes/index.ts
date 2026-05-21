import { Router } from "express";
import { db } from "@workspace/db";
import { approvalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const DEFAULT_ORG = 1;

router.get("/approvals", async (req, res) => {
  const { type, status } = req.query as { type?: string; status?: string };
  let approvals = await db.select().from(approvalsTable).where(eq(approvalsTable.organizationId, DEFAULT_ORG));
  if (type) approvals = approvals.filter((a) => a.type === type);
  if (status) approvals = approvals.filter((a) => a.status === status);
  return res.json(approvals.map(formatApproval));
});

router.post("/approvals/:id/approve", async (req, res) => {
  const id = parseInt(req.params.id);
  const { comment } = req.body;
  const existing = await db.select().from(approvalsTable).where(eq(approvalsTable.id, id)).limit(1);
  if (!existing.length) return res.status(404).json({ error: "Not found" });
  const comments = [...(existing[0].comments as string[]), `Approved: ${comment || "No comment"}`];
  const [updated] = await db.update(approvalsTable).set({ status: "approved", comments }).where(eq(approvalsTable.id, id)).returning();
  return res.json(formatApproval(updated));
});

router.post("/approvals/:id/reject", async (req, res) => {
  const id = parseInt(req.params.id);
  const { comment } = req.body;
  const existing = await db.select().from(approvalsTable).where(eq(approvalsTable.id, id)).limit(1);
  if (!existing.length) return res.status(404).json({ error: "Not found" });
  const comments = [...(existing[0].comments as string[]), `Rejected: ${comment || "No comment"}`];
  const [updated] = await db.update(approvalsTable).set({ status: "rejected", comments }).where(eq(approvalsTable.id, id)).returning();
  return res.json(formatApproval(updated));
});

function formatApproval(a: any) {
  return {
    id: a.id, type: a.type, title: a.title, description: a.description,
    requestedBy: a.requestedBy, requestedByName: a.requestedByName,
    requiredRole: a.requiredRole, status: a.status, riskLevel: a.riskLevel,
    budgetImpact: a.budgetImpact, aiReasoning: a.aiReasoning,
    campaignId: a.campaignId, campaignName: a.campaignName,
    dueDate: a.dueDate, comments: a.comments || [],
    createdAt: a.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export default router;
