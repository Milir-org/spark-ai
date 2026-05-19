import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable, approvalsTable, recommendationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (_req, res) => {
  return res.json({
    activeCampaigns: 7,
    totalSpend: 142850,
    leadsGenerated: 3247,
    conversionRate: 4.2,
    pendingApprovals: 8,
    aiOpportunities: 14,
    revenueInfluenced: 892000,
    budgetUsed: 142850,
    budgetTotal: 200000,
  });
});

router.get("/dashboard/performance", (_req, res) => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    data.push({
      date,
      leads: Math.floor(80 + Math.random() * 120),
      spend: Math.floor(3500 + Math.random() * 2000),
      conversions: Math.floor(15 + Math.random() * 40),
      ctr: parseFloat((2.1 + Math.random() * 2).toFixed(2)),
    });
  }
  return res.json(data);
});

router.get("/dashboard/channel-health", (_req, res) => {
  return res.json([
    { channel: "PPC", status: "healthy", score: 87, metric: "ROAS", metricValue: "4.2x", trend: "up" },
    { channel: "SEO", status: "warning", score: 64, metric: "Organic Traffic", metricValue: "-8% MoM", trend: "down" },
    { channel: "Social", status: "healthy", score: 79, metric: "Engagement Rate", metricValue: "3.8%", trend: "up" },
    { channel: "Email/CRM", status: "healthy", score: 91, metric: "Open Rate", metricValue: "28.4%", trend: "up" },
    { channel: "WhatsApp", status: "warning", score: 58, metric: "Response Rate", metricValue: "41%", trend: "down" },
    { channel: "Analytics", status: "healthy", score: 95, metric: "Data Quality", metricValue: "99.1%", trend: "stable" },
  ]);
});

export default router;
