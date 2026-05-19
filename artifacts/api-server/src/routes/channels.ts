import { Router } from "express";

const router = Router();

router.get("/channels/ppc", (_req, res) => {
  return res.json({
    totalSpend: 58420,
    cpc: 3.24,
    ctr: 3.1,
    conversions: 847,
    cpa: 68.98,
    roas: 4.2,
    recommendations: [
      "Increase budget for 'Enterprise SaaS' campaign by 20% — ROAS is 6.1x vs 4.2x average",
      "Pause 'Competitor Keywords' ad group — CPA is $142, 2x higher than target",
      "Add 14 negative keywords to reduce wasted spend on non-converting queries",
    ],
    campaigns: [
      { name: "Brand Search — Core", spend: 12400, cpc: 1.82, ctr: 5.4, conversions: 312, status: "active" },
      { name: "Non-Brand — Growth", spend: 18900, cpc: 3.91, ctr: 2.8, conversions: 247, status: "active" },
      { name: "Competitor Conquest", spend: 8200, cpc: 5.12, ctr: 1.9, conversions: 58, status: "active" },
      { name: "Remarketing — Visitors", spend: 11400, cpc: 2.34, ctr: 4.1, conversions: 189, status: "active" },
      { name: "LinkedIn Lead Gen", spend: 7520, cpc: 6.84, ctr: 1.4, conversions: 41, status: "paused" },
    ],
    platforms: [
      { name: "Google Ads", status: "connected", logo: "google" },
      { name: "Microsoft Ads", status: "not_connected", logo: "microsoft" },
      { name: "Meta Ads", status: "connected", logo: "meta" },
      { name: "LinkedIn Ads", status: "connected", logo: "linkedin" },
    ],
  });
});

router.post("/channels/ppc/generate-ad-copy", (req, res) => {
  const { product, targetAudience, tone } = req.body;
  return res.json([
    {
      headline: `Supercharge Your ${product ?? "Marketing"} ROI`,
      description: `AI-powered campaigns that drive qualified leads for ${targetAudience ?? "growth teams"}. Start seeing results in 14 days.`,
      cta: "Start Free Trial",
      platform: "Google",
    },
    {
      headline: `The Smarter Way to Run ${product ?? "Marketing"} Campaigns`,
      description: `Join 500+ teams using AI to plan, launch, and optimise multi-channel campaigns. No guesswork. Just results.`,
      cta: "Book a Demo",
      platform: "Google",
    },
    {
      headline: `Cut Campaign Time by 70% — Without Cutting Results`,
      description: `SPARK AI handles your campaign strategy, ad copy, CRM segments, and approvals — all in one command centre.`,
      cta: "See How It Works",
      platform: "LinkedIn",
    },
  ]);
});

router.get("/channels/seo", (_req, res) => {
  return res.json({
    seoScore: 64,
    technicalIssues: [
      { issue: "Missing meta descriptions", severity: "high", count: 14 },
      { issue: "Slow page load speed (>3s)", severity: "critical", count: 8 },
      { issue: "Broken internal links", severity: "medium", count: 22 },
      { issue: "Missing alt text on images", severity: "medium", count: 47 },
      { issue: "Duplicate H1 tags", severity: "high", count: 5 },
    ],
    contentIssues: [
      { issue: "Thin content pages (<300 words)", severity: "medium", count: 19 },
      { issue: "Missing structured data (Schema.org)", severity: "high", count: 8 },
      { issue: "Keyword cannibalization detected", severity: "high", count: 3 },
      { issue: "Pages without internal links", severity: "low", count: 31 },
    ],
    keywordOpportunities: [
      { keyword: "ai marketing platform", volume: 8100, difficulty: 52, opportunity: "high" },
      { keyword: "campaign management software", volume: 5400, difficulty: 61, opportunity: "high" },
      { keyword: "marketing automation ai", volume: 12400, difficulty: 71, opportunity: "medium" },
      { keyword: "crm marketing integration", volume: 3200, difficulty: 44, opportunity: "high" },
      { keyword: "multi channel marketing tool", volume: 2900, difficulty: 39, opportunity: "high" },
    ],
    priorityTasks: [
      "Fix 8 slow-loading pages — estimated 18% traffic uplift",
      "Write meta descriptions for 14 priority landing pages",
      "Fix keyword cannibalization on 3 core topic clusters",
      "Add schema markup to product and pricing pages",
      "Build 5 content briefs targeting top keyword opportunities",
    ],
    metaTitleSuggestions: [
      "SPARK AI — AI-Powered Campaign Management Platform | Free Trial",
      "Automate Your Marketing Campaigns with AI | SPARK AI",
    ],
  });
});

router.post("/channels/seo/scan", (req, res) => {
  return res.json({
    seoScore: 71,
    technicalIssues: [
      { issue: "Missing meta descriptions", severity: "high", count: 11 },
      { issue: "Slow page load speed (>3s)", severity: "critical", count: 5 },
      { issue: "Broken internal links", severity: "medium", count: 17 },
    ],
    contentIssues: [
      { issue: "Thin content pages (<300 words)", severity: "medium", count: 14 },
      { issue: "Missing structured data", severity: "high", count: 6 },
    ],
    keywordOpportunities: [
      { keyword: "ai marketing platform", volume: 8100, difficulty: 52, opportunity: "high" },
      { keyword: "campaign automation", volume: 6200, difficulty: 48, opportunity: "high" },
    ],
    priorityTasks: [
      "Fix 5 slow pages — estimated 14% uplift",
      "Add schema markup to product pages",
    ],
    metaTitleSuggestions: ["SPARK AI — AI Marketing Command Centre"],
  });
});

router.get("/channels/social", (_req, res) => {
  const posts = [];
  const platforms = ["LinkedIn", "Instagram", "Facebook", "Twitter/X"];
  const statuses = ["scheduled", "published", "draft"];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + (i - 4));
    posts.push({
      id: i + 1,
      content: [
        "AI is changing the way marketing teams plan campaigns — not just executing faster, but thinking smarter. Here's what a 70% reduction in campaign planning time looks like in practice.",
        "New feature: SPARK AI now generates complete multi-channel campaign blueprints in under 60 seconds. Strategy summary, audience breakdown, channel plan, creative brief — all in one view.",
        "Why do 74% of leads go cold after 90 days? Because follow-up is inconsistent. SPARK AI's CRM intelligence identifies dormant contacts before they're gone for good.",
        "Our clients are generating 3.2x more qualified leads with AI-assisted campaign planning. Here's the 4-step approach they're using.",
      ][i % 4],
      platform: platforms[i % platforms.length],
      scheduledDate: d.toISOString().split("T")[0],
      status: statuses[i % statuses.length],
      engagement: i < 4 ? Math.floor(150 + Math.random() * 800) : null,
    });
  }
  return res.json({
    posts,
    platforms: [
      { name: "LinkedIn", followers: "12,400", status: "connected" },
      { name: "Instagram", followers: "8,200", status: "connected" },
      { name: "Facebook", followers: "6,800", status: "connected" },
      { name: "Twitter/X", followers: "4,100", status: "read_only" },
    ],
    engagementSummary: { totalReach: 94200, avgEngagement: 3.8, topPlatform: "LinkedIn" },
  });
});

router.post("/channels/social/generate-plan", (req, res) => {
  const { theme } = req.body;
  const platforms = ["LinkedIn", "Instagram", "Facebook", "Twitter/X", "LinkedIn"];
  return res.json(
    platforms.map((platform, i) => ({
      id: 100 + i,
      content: `[${theme ?? "Campaign Launch"} — Day ${i + 1}] ${["Introducing our latest campaign designed to help growth teams scale faster with AI.", "Behind the scenes: How SPARK AI builds a complete campaign blueprint in 60 seconds.", "Customer spotlight: How one team generated 47 qualified leads in the first week.", "Key insight: Teams using AI campaign planning see 3.2x better lead quality on average.", "Week wrap-up: Lessons from running a multi-channel AI-assisted campaign."][i % 5]}`,
      platform,
      scheduledDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "draft",
      engagement: null,
    }))
  );
});

router.get("/channels/crm", (_req, res) => {
  return res.json({
    segments: [
      { id: 1, name: "Dormant Leads (90+ days)", description: "Contacts with no activity in 90+ days", source: "HubSpot CRM", size: 312, tags: ["dormant", "reactivation"], insightSummary: "312 leads last contacted 90+ days ago. 68% opened at least 1 email. High reactivation potential.", organizationId: 1, conversionRate: 8.2, trend: "declining" },
      { id: 2, name: "High-Intent Visitors", description: "Visited pricing or features page 2+ times", source: "GA4 + CRM", size: 74, tags: ["high-intent", "hot"], insightSummary: "74 visitors hit pricing page 2+ times without converting. Average session time 4.2 minutes.", organizationId: 1, conversionRate: 22.4, trend: "growing" },
      { id: 3, name: "Upsell Candidates", description: "Customers on Starter plan for 60+ days", source: "Billing + CRM", size: 127, tags: ["upsell", "existing-customer"], insightSummary: "127 Starter plan customers approaching feature limits. Growth plan conversion rate historically 34%.", organizationId: 1, conversionRate: 34.1, trend: "stable" },
      { id: 4, name: "Lost Deals (180 days)", description: "Opportunities closed-lost in last 180 days", source: "Salesforce", size: 89, tags: ["lost", "winback"], insightSummary: "89 closed-lost opportunities. 41% cited budget constraints. May be ready to revisit with ROI data.", organizationId: 1, conversionRate: 12.8, trend: "stable" },
    ],
    emailSequences: [
      { id: 1, name: "Dormant Lead Reactivation", steps: 5, status: "active", targetSegment: "Dormant Leads (90+ days)" },
      { id: 2, name: "High-Intent Nurture", steps: 3, status: "draft", targetSegment: "High-Intent Visitors" },
      { id: 3, name: "Upsell Journey — Starter to Growth", steps: 4, status: "active", targetSegment: "Upsell Candidates" },
      { id: 4, name: "Win-Back Campaign", steps: 6, status: "draft", targetSegment: "Lost Deals (180 days)" },
    ],
    lifecycleIdeas: [
      "30-day check-in sequence for new customers (3 emails + 1 LinkedIn DM)",
      "Quarterly ROI review email for Pro plan customers",
      "Feature adoption drip campaign for users not using AI Campaign Designer",
    ],
    reactivationIdeas: [
      "Personalised video message from Account Manager for high-value dormant leads",
      "'What changed' campaign — showcase new features since they last engaged",
      "Limited-time offer: 2-month discount for reactivating dormant accounts",
    ],
  });
});

router.get("/channels/messaging", (_req, res) => {
  return res.json({
    templates: [
      { id: 1, name: "Lead Follow-Up — Day 1", type: "whatsapp", content: "Hi [Name], thanks for your interest in SPARK AI. I wanted to reach out personally — what's the biggest challenge your marketing team is facing right now? Happy to show you how we solve it. — Alex", status: "approved" },
      { id: 2, name: "Demo No-Show Recovery", type: "whatsapp", content: "Hi [Name], looks like we missed you on our call earlier. No worries — would [Day] at [Time] work better? We have some new AI features I'd love to walk you through.", status: "pending" },
      { id: 3, name: "Post-Trial Reactivation", type: "whatsapp", content: "Hey [Name], your SPARK AI trial ended last week. We'd love to show you what you built — and how to scale it. 15 minutes — worth it?", status: "approved" },
      { id: 4, name: "Appointment Reminder", type: "whatsapp", content: "Hi [Name], just a quick reminder — your demo call with SPARK AI is tomorrow at [Time]. Looking forward to chatting!", status: "approved" },
    ],
    flows: [
      { id: 1, name: "New Lead Follow-Up Flow", steps: 4, status: "active", trigger: "New lead created in CRM" },
      { id: 2, name: "Dormant Lead Reactivation", steps: 3, status: "draft", trigger: "Lead inactive for 90 days" },
      { id: 3, name: "Demo Scheduler Flow", steps: 2, status: "active", trigger: "Lead clicks 'Book Demo'" },
    ],
    connectionStatus: "not_connected",
  });
});

router.get("/channels/analytics", (_req, res) => {
  return res.json({
    conversionFunnel: [
      { stage: "Website Visitors", value: 42800, conversionRate: 100 },
      { stage: "Landing Page Views", value: 18400, conversionRate: 43.0 },
      { stage: "Form Starts", value: 4200, conversionRate: 22.8 },
      { stage: "Form Submissions", value: 1847, conversionRate: 44.0 },
      { stage: "Qualified Leads", value: 724, conversionRate: 39.2 },
      { stage: "Opportunities", value: 187, conversionRate: 25.8 },
      { stage: "Customers", value: 43, conversionRate: 23.0 },
    ],
    channelPerformance: [
      { channel: "Google PPC", spend: 28400, leads: 847, cpl: 33.53, conversionRate: 4.2 },
      { channel: "LinkedIn Ads", spend: 18200, leads: 312, cpl: 58.33, conversionRate: 2.8 },
      { channel: "Meta Ads", spend: 12800, leads: 524, cpl: 24.43, conversionRate: 3.9 },
      { channel: "SEO (Organic)", spend: 4200, leads: 728, cpl: 5.77, conversionRate: 5.1 },
      { channel: "Email/CRM", spend: 1800, leads: 391, cpl: 4.60, conversionRate: 6.4 },
    ],
    anomalies: [
      { title: "CTR spike on Brand Search (+47%)", severity: "info", description: "Brand search CTR increased 47% this week — likely due to PR coverage. Consider increasing brand budget." },
      { title: "Conversion rate drop on landing page", severity: "warning", description: "Primary landing page conversion rate fell from 4.2% to 2.8% in 72 hours. Possible issue with page load speed or form." },
      { title: "CPA exceeds target on Competitor campaign", severity: "critical", description: "Competitor Conquest campaign CPA hit $142 — 2x the $71 target. Recommend pausing or restructuring." },
    ],
    aiSummary: "Overall campaign performance this month is tracking 12% above target for lead volume, but cost efficiency is mixed. SEO organic traffic declined 8% month-over-month — likely from a Google algorithm update affecting informational content. PPC ROAS of 4.2x is strong. The primary risk is the landing page conversion drop detected in the last 72 hours — this is your highest-priority action item this week.",
    recommendedNextActions: [
      "Investigate and fix landing page conversion drop immediately",
      "Pause Competitor Conquest campaign pending restructure",
      "Increase Brand Search budget by 20% to capitalise on PR-driven CTR spike",
      "Brief SEO specialist on content recovery plan",
    ],
  });
});

export default router;
