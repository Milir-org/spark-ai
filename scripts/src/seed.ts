import { db } from "@workspace/db";
import {
  organizationsTable, usersTable, campaignsTable, integrationsTable,
  recommendationsTable, approvalsTable, segmentsTable, assetsTable, reportsTable
} from "@workspace/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await db.execute(sql`TRUNCATE organizations, users, campaigns, blueprints, integrations, recommendations, approvals, segments, assets, reports RESTART IDENTITY CASCADE`);

  // Organizations
  const [org] = await db.insert(organizationsTable).values({
    name: "Milir AI Demo Workspace",
    plan: "growth",
    industry: "B2B SaaS",
    website: "https://milir.ai",
  }).returning();

  console.log("Created org:", org.id);

  // Users
  const users = await db.insert(usersTable).values([
    { name: "Alex Chen", email: "alex@milir.ai", passwordHash: "demo123", role: "owner", organizationId: org.id, avatar: null, status: "active" },
    { name: "Sarah Park", email: "sarah@milir.ai", passwordHash: "demo123", role: "marketing_manager", organizationId: org.id, avatar: null, status: "active" },
    { name: "James Wong", email: "james@milir.ai", passwordHash: "demo123", role: "finance_approver", organizationId: org.id, avatar: null, status: "active" },
    { name: "Priya Sharma", email: "priya@milir.ai", passwordHash: "demo123", role: "channel_specialist", organizationId: org.id, avatar: null, status: "active" },
    { name: "David Lee", email: "david@milir.ai", passwordHash: "demo123", role: "creative_reviewer", organizationId: org.id, avatar: null, status: "active" },
    { name: "Nina Foster", email: "nina@milir.ai", passwordHash: "demo123", role: "viewer", organizationId: org.id, avatar: null, status: "active" },
  ]).returning();

  console.log("Created", users.length, "users");

  // Campaigns
  const campaigns = await db.insert(campaignsTable).values([
    { name: "Q2 Lead Generation — Enterprise SaaS", objective: "lead_generation", status: "active", budget: 45000, dailyBudget: 1500, startDate: "2026-04-01", endDate: "2026-06-30", channels: ["ppc", "seo", "social"], organizationId: org.id, ownerId: users[0].id, targetAudience: "Marketing Managers at B2B SaaS companies, 50–500 employees, APAC region", productDescription: "SPARK AI — AI-powered marketing command centre for enterprise teams", spendStyle: "balanced", healthScore: 87, leadsGenerated: 312, spend: 28400 },
    { name: "Product Launch — SPARK Pro Features", objective: "product_launch", status: "awaiting_approval", budget: 28000, dailyBudget: null, startDate: "2026-05-15", endDate: "2026-07-15", channels: ["social", "email"], organizationId: org.id, ownerId: users[1].id, targetAudience: "Existing SPARK AI Growth plan customers + warm leads", productDescription: "SPARK AI Pro — new AI features including Autonomous Optimisation and Enterprise Governance", spendStyle: "aggressive", healthScore: null, leadsGenerated: null, spend: null },
    { name: "Competitor Reactivation — Churned Accounts", objective: "reactivation", status: "planning", budget: 12000, dailyBudget: null, startDate: "2026-05-01", endDate: "2026-05-31", channels: ["email", "crm"], organizationId: org.id, ownerId: users[3].id, targetAudience: "Former customers who churned in the last 12 months", productDescription: "Win-back campaign showcasing new features and ROI improvements", spendStyle: "conservative", healthScore: null, leadsGenerated: 47, spend: 4200 },
    { name: "SME Growth — Singapore Market", objective: "awareness", status: "active", budget: 35000, dailyBudget: 1100, startDate: "2026-03-15", endDate: "2026-06-15", channels: ["ppc", "social"], organizationId: org.id, ownerId: users[0].id, targetAudience: "Singapore SME owners and marketing leads, revenue $1M–$20M", productDescription: "SPARK AI Growth plan for ambitious SME marketing teams", spendStyle: "balanced", healthScore: 72, leadsGenerated: 184, spend: 19800 },
    { name: "Dormant Lead Reactivation", objective: "retention", status: "draft", budget: 8000, dailyBudget: null, startDate: "2026-06-01", endDate: "2026-06-30", channels: ["email", "whatsapp"], organizationId: org.id, ownerId: users[3].id, targetAudience: "CRM contacts with no activity in 90+ days", productDescription: "Reactivation campaign with personalised outreach", spendStyle: "conservative", healthScore: null, leadsGenerated: null, spend: null },
  ]).returning();

  console.log("Created", campaigns.length, "campaigns");

  // Integrations
  await db.insert(integrationsTable).values([
    { provider: "Google Ads", category: "advertising", status: "connected", description: "Sync campaigns, ad groups, keywords, and performance data with Google Ads.", logo: "google", organizationId: org.id, lastSyncedAt: new Date(Date.now() - 30 * 60 * 1000) },
    { provider: "Meta Ads", category: "advertising", status: "connected", description: "Connect Facebook and Instagram ad campaigns, audiences, and creative performance.", logo: "meta", organizationId: org.id, lastSyncedAt: new Date(Date.now() - 2 * 3600000) },
    { provider: "LinkedIn Ads", category: "advertising", status: "connected", description: "LinkedIn Campaign Manager — sponsored content, lead gen forms, and audience insights.", logo: "linkedin", organizationId: org.id, lastSyncedAt: new Date(Date.now() - 4 * 3600000) },
    { provider: "Microsoft Ads", category: "advertising", status: "not_connected", description: "Bing Ads / Microsoft Advertising — reach additional search audiences.", logo: "microsoft", organizationId: org.id, lastSyncedAt: null },
    { provider: "HubSpot", category: "crm", status: "connected", description: "Full CRM integration — contacts, deals, sequences, and lifecycle stage sync.", logo: "hubspot", organizationId: org.id, lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000) },
    { provider: "Salesforce", category: "crm", status: "not_connected", description: "Enterprise CRM integration with Opportunities, Leads, and Campaign attribution.", logo: "salesforce", organizationId: org.id, lastSyncedAt: null },
    { provider: "Google Analytics 4", category: "analytics", status: "connected", description: "Website traffic, conversion events, and audience data from GA4.", logo: "google", organizationId: org.id, lastSyncedAt: new Date(Date.now() - 10 * 60 * 1000) },
    { provider: "Mixpanel", category: "analytics", status: "not_connected", description: "Product analytics — user behaviour, funnels, and retention analysis.", logo: "mixpanel", organizationId: org.id, lastSyncedAt: null },
    { provider: "Mailchimp", category: "email", status: "not_connected", description: "Email lists, campaigns, and automations from Mailchimp.", logo: "mailchimp", organizationId: org.id, lastSyncedAt: null },
    { provider: "Klaviyo", category: "email", status: "not_connected", description: "Advanced email and SMS marketing automation with segmentation.", logo: "klaviyo", organizationId: org.id, lastSyncedAt: null },
    { provider: "WhatsApp Business", category: "messaging", status: "not_connected", description: "WhatsApp Business API — message flows, templates, and conversation management.", logo: "whatsapp", organizationId: org.id, lastSyncedAt: null },
    { provider: "Canva", category: "creative", status: "not_connected", description: "Design assets from Canva — export to SPARK AI asset library automatically.", logo: "canva", organizationId: org.id, lastSyncedAt: null },
    { provider: "Stripe", category: "billing", status: "not_connected", description: "Revenue attribution — link conversions to actual Stripe payments and MRR.", logo: "stripe", organizationId: org.id, lastSyncedAt: null },
    { provider: "SEMrush", category: "seo", status: "not_connected", description: "Keyword rankings, backlink analysis, and competitive intelligence.", logo: "semrush", organizationId: org.id, lastSyncedAt: null },
  ]);

  console.log("Created integrations");

  // Recommendations
  await db.insert(recommendationsTable).values([
    { type: "budget", title: "Shift budget from Campaign A to Campaign B", reasoning: "Campaign B is generating 2.1x better quality leads at 18% lower CPA. Historical data shows this pattern has 89% confidence over 14-day windows.", confidence: 0.89, impactEstimate: "+$12,400 pipeline opportunity", status: "pending", approvalRequired: true, campaignId: campaigns[0].id, channelType: "ppc", suggestedAction: "Move $5,000 from Q2 Lead Gen to SME Singapore", dataSources: ["Google Ads", "CRM", "SPARK AI Attribution"], organizationId: org.id },
    { type: "channel_optimisation", title: "Add 14 negative keywords to PPC — reduce wasted spend", reasoning: "Analysis of 30-day search term report shows 14 keywords generating clicks but 0 conversions at $2,400 combined spend. Removing these will improve ROAS by estimated 8%.", confidence: 0.94, impactEstimate: "Save $2,100/month", status: "pending", approvalRequired: false, campaignId: campaigns[0].id, channelType: "ppc", suggestedAction: "Add 14 negative keywords to Q2 Lead Gen campaign", dataSources: ["Google Ads"], organizationId: org.id },
    { type: "crm", title: "Launch reactivation campaign to 312 dormant leads", reasoning: "312 CRM contacts last contacted 90+ days ago. 68% of these opened at least 1 email historically. Predicted reactivation rate: 18–24%. Pipeline opportunity: $89,400.", confidence: 0.78, impactEstimate: "$89,400 potential pipeline", status: "pending", approvalRequired: true, campaignId: null, channelType: "email", suggestedAction: "Launch 5-step reactivation email sequence to dormant segment", dataSources: ["HubSpot CRM", "GA4"], organizationId: org.id },
    { type: "content", title: "Create 3 blog posts targeting top keyword opportunities", reasoning: "SPARK AI SEO scan identified 5 high-volume keywords (avg 6,400 monthly searches) with low difficulty scores (<55) where no existing content ranks. Creating targeted posts could generate 800–1,200 organic visits/month.", confidence: 0.82, impactEstimate: "Est. 1,000 organic visits/month", status: "pending", approvalRequired: false, campaignId: null, channelType: "seo", suggestedAction: "Brief content team on 3 priority blog posts", dataSources: ["SEO Scan", "Google Search Console"], organizationId: org.id },
    { type: "budget", title: "Increase Brand Search budget by 20% — CTR spike capitalisation", reasoning: "Brand search CTR jumped 47% this week (likely PR coverage). Current budget is limiting impression share. ROAS on brand search is 6.1x. A 20% budget increase should capture an estimated $18,000 additional pipeline.", confidence: 0.91, impactEstimate: "+$18,000 pipeline if acted on within 72h", status: "approved", approvalRequired: true, campaignId: campaigns[0].id, channelType: "ppc", suggestedAction: "Increase Google Ads Brand Search budget from $8,000 to $9,600", dataSources: ["Google Ads", "SPARK AI Attribution"], organizationId: org.id },
  ]);

  console.log("Created recommendations");

  // Approvals
  await db.insert(approvalsTable).values([
    { type: "campaign_launch", title: "Q2 Lead Gen Campaign Launch", description: "Full multi-channel campaign across PPC, SEO, Social, and Email. Total budget $45,000. Targeting enterprise SaaS decision makers in APAC.", requestedBy: users[1].id, requestedByName: "Sarah Park", requiredRole: "marketing_manager", status: "pending", riskLevel: "medium", budgetImpact: 45000, aiReasoning: "SPARK AI has reviewed this campaign. The strategy is well-structured and the target audience is well-defined. Budget allocation across channels is within benchmarks. Historical data suggests a 22% lead conversion rate for similar campaigns. Recommend approval.", campaignId: campaigns[0].id, campaignName: campaigns[0].name, dueDate: "2026-05-25", comments: [], organizationId: org.id },
    { type: "budget", title: "PPC Budget Increase — +$8,000", description: "Request to increase Google Ads budget from $28,000 to $36,000 for the Brand Search campaign. ROAS is currently 6.1x.", requestedBy: users[0].id, requestedByName: "Alex Chen", requiredRole: "finance_approver", status: "pending", riskLevel: "high", budgetImpact: 8000, aiReasoning: "SPARK AI supports this budget increase. Brand Search ROAS at 6.1x vs 4.2x average — 45% outperformance. Increasing spend here should capture additional CTR uplift from recent PR coverage.", campaignId: campaigns[0].id, campaignName: campaigns[0].name, dueDate: "2026-05-22", comments: [], organizationId: org.id },
    { type: "ad_copy", title: "LinkedIn Ad Copy — 3 Variants", description: "Creative review of 3 LinkedIn sponsored content copy variants for the enterprise SaaS lead gen campaign.", requestedBy: users[4].id, requestedByName: "David Lee", requiredRole: "creative_reviewer", status: "pending", riskLevel: "low", budgetImpact: null, aiReasoning: "All 3 copy variants follow brand guidelines. Tone is professional and value-focused. Headlines are within LinkedIn character limits. CTA buttons are clear and action-oriented. Recommend approval.", campaignId: campaigns[0].id, campaignName: campaigns[0].name, dueDate: "2026-05-21", comments: [], organizationId: org.id },
    { type: "crm_segment", title: "Dormant Lead Segment — Mass Reactivation", description: "Request to activate reactivation campaign to 312 dormant CRM contacts. 5-step email + WhatsApp follow-up.", requestedBy: users[3].id, requestedByName: "Priya Sharma", requiredRole: "marketing_manager", status: "pending", riskLevel: "medium", budgetImpact: 2400, aiReasoning: "SPARK AI analysed this segment. 312 contacts, 68% historically engaged. Sequence is permission-compliant. Estimated reactivation rate: 18–24%. Pipeline potential: $89,400. Recommend approval.", campaignId: null, campaignName: null, dueDate: "2026-05-28", comments: [], organizationId: org.id },
    { type: "campaign_launch", title: "SME Singapore Market — Launch", description: "LinkedIn + Google PPC campaign targeting Singapore SME owners. $35,000 budget over 90 days.", requestedBy: users[0].id, requestedByName: "Alex Chen", requiredRole: "owner", status: "approved", riskLevel: "medium", budgetImpact: 35000, aiReasoning: null, campaignId: campaigns[3].id, campaignName: campaigns[3].name, dueDate: "2026-05-10", comments: ["Approved — good strategy. Proceed with launch."], organizationId: org.id },
    { type: "ad_copy", title: "Meta Retargeting Ads — Q1 Creative", description: "4 creative variants for Meta retargeting campaign.", requestedBy: users[4].id, requestedByName: "David Lee", requiredRole: "creative_reviewer", status: "rejected", riskLevel: "low", budgetImpact: null, aiReasoning: null, campaignId: null, campaignName: null, dueDate: "2026-04-20", comments: ["Rejected — brand tone not aligned. Please revise Variant 3 and resubmit."], organizationId: org.id },
    { type: "budget", title: "Product Launch Campaign — Budget Approval", description: "Total campaign budget approval for SPARK Pro product launch campaign. $28,000 over 60 days.", requestedBy: users[1].id, requestedByName: "Sarah Park", requiredRole: "finance_approver", status: "pending", riskLevel: "high", budgetImpact: 28000, aiReasoning: "Product launch campaigns in comparable SaaS companies have generated 2.8x pipeline on similar budgets. SPARK AI considers this a justified investment given current brand momentum.", campaignId: campaigns[1].id, campaignName: campaigns[1].name, dueDate: "2026-05-30", comments: [], organizationId: org.id },
    { type: "ai_action", title: "AI: Pause Competitor Conquest Campaign", description: "SPARK AI recommends pausing the Competitor Conquest ad group — CPA has reached $142, 2x the $71 target. Immediate action would save an estimated $3,200 in wasted spend.", requestedBy: users[0].id, requestedByName: "Alex Chen", requiredRole: "marketing_manager", status: "pending", riskLevel: "medium", budgetImpact: -3200, aiReasoning: "30-day analysis shows Competitor Conquest ad group has a CPA of $142 vs $71 target. Despite 3 iterations of keyword and bid optimisation, performance has not improved. This is a signal that the keywords are too expensive relative to conversion intent. Recommend pausing and rebuilding with a different approach.", campaignId: campaigns[0].id, campaignName: campaigns[0].name, dueDate: "2026-05-20", comments: [], organizationId: org.id },
  ]);

  console.log("Created approvals");

  // Segments
  await db.insert(segmentsTable).values([
    { name: "Dormant Leads (90+ days)", description: "Contacts with no activity in 90+ days", source: "HubSpot CRM", size: 312, tags: ["dormant", "reactivation"], insightSummary: "312 leads last contacted 90+ days ago. 68% opened at least 1 email. High reactivation potential.", conversionRate: 8.2, trend: "declining", organizationId: org.id },
    { name: "High-Intent Visitors", description: "Visited pricing or features page 2+ times", source: "GA4 + CRM", size: 74, tags: ["high-intent", "hot"], insightSummary: "74 visitors hit pricing page 2+ times without converting. Average session time 4.2 minutes.", conversionRate: 22.4, trend: "growing", organizationId: org.id },
    { name: "Upsell Candidates", description: "Customers on Starter plan for 60+ days", source: "Billing + CRM", size: 127, tags: ["upsell", "existing-customer"], insightSummary: "127 Starter plan customers approaching feature limits. Growth plan conversion rate historically 34%.", conversionRate: 34.1, trend: "stable", organizationId: org.id },
    { name: "Lost Deals (180 days)", description: "Opportunities closed-lost in last 180 days", source: "Salesforce", size: 89, tags: ["lost", "winback"], insightSummary: "89 closed-lost opportunities. 41% cited budget constraints. May be ready to revisit with ROI data.", conversionRate: 12.8, trend: "stable", organizationId: org.id },
    { name: "Singapore SME Owners", description: "SME owner contacts tagged as Singapore-based", source: "LinkedIn + CRM", size: 1240, tags: ["high-value", "singapore", "smb"], insightSummary: "1,240 Singapore SME owner contacts. 22.4% conversion rate vs 9.7% average. Strongest performing segment.", conversionRate: 22.4, trend: "growing", organizationId: org.id },
  ]);

  console.log("Created segments");

  // Assets
  await db.insert(assetsTable).values([
    { type: "ad_copy", title: "Google Search Ad — Brand Search Primary", content: "Headline: AI Marketing Platform | Supercharge Campaign ROI\nDescription: AI-powered campaign planning for ambitious marketing teams. ROAS 4.2x average. Start free trial — no credit card required.", status: "approved", approvalStatus: "approved", createdBy: users[0].id, organizationId: org.id, campaignId: campaigns[0].id, campaignName: campaigns[0].name },
    { type: "social_post", title: "LinkedIn Launch Post — Product Feature", content: "Something big is here.\n\nWe just launched a multi-channel campaign with SPARK AI — from brief to blueprint in 60 seconds.\n\nHere's what the first 7 days looked like:\n→ 84 qualified leads\n→ $38 CPL vs $52 industry average\n→ 4.2x ROAS across 4 channels\n\nAll from one AI-powered command centre. Thread below 🧵", status: "approved", approvalStatus: "approved", createdBy: users[4].id, organizationId: org.id, campaignId: campaigns[1].id, campaignName: campaigns[1].name },
    { type: "email_copy", title: "Dormant Lead Reactivation — Email 1 of 5", content: "Subject: We've been thinking about you\n\nHi [Name],\n\nIt's been a while, and we wanted to reach out personally.\n\nSince you last engaged with us, we've shipped some things that I think you'd actually care about — especially if campaign planning time is still a challenge for your team.\n\nMind if I share 3 things that changed? Won't take more than 2 minutes to read.", status: "draft", approvalStatus: "pending", createdBy: users[0].id, organizationId: org.id, campaignId: null, campaignName: null },
    { type: "landing_page_copy", title: "Pricing Page — Hero Section", content: "Headline: Simple, transparent pricing\nSubheadline: Start free. Scale as you grow. No hidden fees.\nBody: Every plan includes full access to the AI Campaign Designer, channel workbenches, and real-time performance insights. Upgrade when you're ready.", status: "approved", approvalStatus: "approved", createdBy: users[4].id, organizationId: org.id, campaignId: null, campaignName: null },
    { type: "whatsapp_message", title: "Demo No-Show Recovery", content: "Hi [Name], looks like we missed each other earlier — no worries at all. Would [Day] at [Time] work better? I have some new AI features I'd love to walk you through. Should only take 20 minutes.", status: "approved", approvalStatus: "approved", createdBy: users[0].id, organizationId: org.id, campaignId: null, campaignName: null },
  ]);

  console.log("Created assets");

  // Reports
  await db.insert(reportsTable).values([
    { type: "monthly_performance", title: "April 2026 Monthly Performance Report", summary: "Overall campaign performance tracked 12% above target for lead volume. ROAS at 4.2x. Primary risk: landing page conversion rate drop detected this week.", insights: ["CTR improved 18% but conversions remained flat — suggests landing page or offer issue", "Email channel has lowest CPL at $4.60 — significantly underinvested", "Singapore SME segment converts 2.3x better than average", "Brand search CTR spiked 47% — likely due to PR coverage"], whatWorked: ["Brand search campaigns — ROAS 6.1x", "Email nurture sequences — 28.4% open rate", "LinkedIn audience targeting — 31% qualified lead rate"], whatDidntWork: ["Competitor Conquest campaign — CPA $142 vs $71 target", "Landing page B variant — 34% lower conversion", "TikTok ads test — insufficient data"], recommendations: ["Pause Competitor Conquest", "Increase email budget 40%", "Scale Singapore SME targeting", "Fix landing page conversion drop"], organizationId: org.id, campaignId: null, campaignName: null },
    { type: "campaign_performance", title: "Q2 Lead Gen Campaign — Mid-Point Report", summary: "Campaign tracking at 87% of lead generation target at midpoint. Cost-per-lead is $38, below the $45 target. LinkedIn outperforming Google on lead quality.", insights: ["LinkedIn leads convert to opportunities at 31% vs 19% for Google", "WhatsApp follow-up reduced no-show rate by 28%"], whatWorked: ["LinkedIn targeting precision", "5-step email nurture sequence"], whatDidntWork: ["Competitor keywords — paused Week 3"], recommendations: ["Scale LinkedIn by $5,000", "Remove bottom 3 Google keywords"], organizationId: org.id, campaignId: campaigns[0].id, campaignName: campaigns[0].name },
  ]);

  console.log("Created reports");
  console.log("✅ Seed complete!");
}

main().catch(console.error).finally(() => process.exit(0));
