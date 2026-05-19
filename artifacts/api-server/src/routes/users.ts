import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const DEFAULT_ORG = 1;

router.get("/users", async (_req, res) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.organizationId, DEFAULT_ORG));
  return res.json(users.map(formatUser));
});

router.post("/users", async (req, res) => {
  const body = req.body;
  const [inserted] = await db.insert(usersTable).values({
    name: body.name,
    email: body.email,
    passwordHash: "demo123",
    role: body.role || "viewer",
    organizationId: DEFAULT_ORG,
    avatar: null,
    status: "pending",
  }).returning();
  return res.status(201).json(formatUser(inserted));
});

router.patch("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = req.body;
  const [updated] = await db.update(usersTable).set({
    ...(body.role !== undefined && { role: body.role }),
    ...(body.status !== undefined && { status: body.status }),
  }).where(eq(usersTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(formatUser(updated));
});

router.delete("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.status(204).send();
});

function formatUser(u: any) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    organizationId: u.organizationId,
    organizationName: "Milir AI Demo Workspace",
    organizationPlan: "growth",
    avatar: u.avatar, status: u.status,
    createdAt: u.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export default router;
