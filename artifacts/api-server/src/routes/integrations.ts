import { Router } from "express";
import { db } from "@workspace/db";
import { integrationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();
const DEFAULT_ORG = 1;

router.get("/integrations", async (req, res) => {
  const { category } = req.query as { category?: string };
  let integrations = await db.select().from(integrationsTable).where(eq(integrationsTable.organizationId, DEFAULT_ORG));
  if (category) integrations = integrations.filter((i) => i.category === category);
  return res.json(integrations.map((i) => ({
    id: i.id, provider: i.provider, category: i.category, status: i.status,
    description: i.description, logo: i.logo,
    lastSyncedAt: i.lastSyncedAt?.toISOString() ?? null,
  })));
});

router.post("/integrations/:id/connect", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(integrationsTable).set({
    status: "connected",
    lastSyncedAt: new Date(),
  }).where(and(eq(integrationsTable.id, id), eq(integrationsTable.organizationId, DEFAULT_ORG))).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json({
    id: updated.id, provider: updated.provider, category: updated.category,
    status: updated.status, description: updated.description, logo: updated.logo,
    lastSyncedAt: updated.lastSyncedAt?.toISOString() ?? null,
  });
});

router.post("/integrations/:id/disconnect", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(integrationsTable).set({ status: "not_connected", lastSyncedAt: null }).where(
    and(eq(integrationsTable.id, id), eq(integrationsTable.organizationId, DEFAULT_ORG))
  ).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json({
    id: updated.id, provider: updated.provider, category: updated.category,
    status: updated.status, description: updated.description, logo: updated.logo,
    lastSyncedAt: null,
  });
});

export default router;
