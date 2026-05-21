import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const DEFAULT_ORG = 1;

router.get("/assets", async (req, res) => {
  const { type, status } = req.query as { type?: string; status?: string };
  let assets = await db.select().from(assetsTable).where(eq(assetsTable.organizationId, DEFAULT_ORG));
  if (type) assets = assets.filter((a) => a.type === type);
  if (status) assets = assets.filter((a) => a.status === status);
  return res.json(assets.map(formatAsset));
});

router.post("/assets", async (req, res) => {
  const body = req.body;
  const [inserted] = await db.insert(assetsTable).values({
    type: body.type, title: body.title, content: body.content,
    status: "draft", approvalStatus: "pending",
    createdBy: 1, organizationId: DEFAULT_ORG,
    campaignId: body.campaignId ?? null, campaignName: null,
  }).returning();
  return res.status(201).json(formatAsset(inserted));
});

router.post("/assets/generate", (req, res) => {
  const campaignId = req.body.campaignId;
  return res.json([
    { id: 200, type: "ad_copy", title: "Google Search Ad — Primary", content: "Headline: Supercharge Campaign ROI with AI\nDescription: AI-powered campaign planning for ambitious marketing teams. Start seeing results in 14 days. Free trial — no credit card.", status: "draft", approvalStatus: "pending", createdBy: 1, organizationId: DEFAULT_ORG, campaignId, campaignName: null, createdAt: new Date().toISOString() },
    { id: 201, type: "social_post", title: "LinkedIn Launch Post", content: "Something big is here. We just launched a multi-channel campaign with SPARK AI — from brief to blueprint in 60 seconds.", status: "draft", approvalStatus: "pending", createdBy: 1, organizationId: DEFAULT_ORG, campaignId, campaignName: null, createdAt: new Date().toISOString() },
    { id: 202, type: "email_copy", title: "Launch Email — Subject Line A", content: "Subject: We've been working on something for you\n\nHi [Name],\n\nToday, we're launching SPARK AI...", status: "draft", approvalStatus: "pending", createdBy: 1, organizationId: DEFAULT_ORG, campaignId, campaignName: null, createdAt: new Date().toISOString() },
    { id: 203, type: "landing_page_copy", title: "Landing Page — Hero Section", content: "Headline: Your AI Marketing Command Centre\nSubheadline: Plan campaigns, activate channels, approve decisions, and report results — all in one intelligent platform.\nCTA: Start Your Free Trial", status: "draft", approvalStatus: "pending", createdBy: 1, organizationId: DEFAULT_ORG, campaignId, campaignName: null, createdAt: new Date().toISOString() },
    { id: 204, type: "whatsapp_message", title: "WhatsApp Follow-Up — Day 1", content: "Hi [Name], thanks for your interest in SPARK AI. Quick question — what's the biggest campaign challenge you're facing right now?", status: "draft", approvalStatus: "pending", createdBy: 1, organizationId: DEFAULT_ORG, campaignId, campaignName: null, createdAt: new Date().toISOString() },
  ]);
});

function formatAsset(a: any) {
  return {
    id: a.id, type: a.type, title: a.title, content: a.content,
    status: a.status, approvalStatus: a.approvalStatus,
    createdBy: a.createdBy, organizationId: a.organizationId,
    campaignId: a.campaignId, campaignName: a.campaignName,
    createdAt: a.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export default router;
