import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const DEFAULT_ORG = 1;

// ─── Auth ─────────────────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const user = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user.length) return res.status(401).json({ error: "Invalid credentials" });
  const u = user[0];
  const org = await db.select().from(organizationsTable).where(eq(organizationsTable.id, u.organizationId)).limit(1);
  const orgData = org[0];
  return res.json({
    user: {
      id: u.id, name: u.name, email: u.email, role: u.role,
      organizationId: u.organizationId,
      organizationName: orgData?.name ?? "SPARK AI Demo",
      organizationPlan: orgData?.plan ?? "growth",
      avatar: u.avatar, status: u.status,
      createdAt: u.createdAt.toISOString(),
    },
    token: "demo-token-" + u.id,
  });
});

router.post("/auth/logout", (_req, res) => res.json({ success: true }));

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Not authenticated" });
  const userId = parseInt(authHeader.replace("demo-token-", ""));
  if (isNaN(userId)) return res.status(401).json({ error: "Invalid token" });
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user.length) return res.status(401).json({ error: "User not found" });
  const u = user[0];
  const org = await db.select().from(organizationsTable).where(eq(organizationsTable.id, u.organizationId)).limit(1);
  const orgData = org[0];
  return res.json({
    id: u.id, name: u.name, email: u.email, role: u.role,
    organizationId: u.organizationId,
    organizationName: orgData?.name ?? "SPARK AI Demo",
    organizationPlan: orgData?.plan ?? "growth",
    avatar: u.avatar, status: u.status,
    createdAt: u.createdAt.toISOString(),
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────

router.get("/users", async (_req, res) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.organizationId, DEFAULT_ORG));
  return res.json(users.map(formatUser));
});

router.post("/users", async (req, res) => {
  const body = req.body;
  const [inserted] = await db.insert(usersTable).values({
    name: body.name, email: body.email, passwordHash: "demo123",
    role: body.role || "viewer", organizationId: DEFAULT_ORG,
    avatar: null, status: "pending",
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
