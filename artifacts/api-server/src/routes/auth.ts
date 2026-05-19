import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (!user.length) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const u = user[0];
  const org = await db.select().from(organizationsTable).where(eq(organizationsTable.id, u.organizationId)).limit(1);
  const orgData = org[0];
  const userObj = {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    organizationId: u.organizationId,
    organizationName: orgData?.name ?? "SPARK AI Demo",
    organizationPlan: orgData?.plan ?? "growth",
    avatar: u.avatar,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
  };
  return res.json({ user: userObj, token: "demo-token-" + u.id });
});

router.post("/auth/logout", (req, res) => {
  return res.json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const userId = parseInt(authHeader.replace("demo-token-", ""));
  if (isNaN(userId)) {
    return res.status(401).json({ error: "Invalid token" });
  }
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

export default router;
