import { pgTable, serial, text, integer, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  objective: text("objective").notNull(),
  primaryObjective: text("primary_objective"),
  secondaryObjectives: json("secondary_objectives").$type<string[]>().default([]),
  status: text("status").notNull().default("draft"),
  budget: real("budget").notNull(),
  dailyBudget: real("daily_budget"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  channels: json("channels").$type<string[]>().notNull().default([]),
  organizationId: integer("organization_id").notNull(),
  ownerId: integer("owner_id").notNull(),
  targetAudience: text("target_audience"),
  productDescription: text("product_description"),
  spendStyle: text("spend_style"),
  geography: text("geography"),
  landingPage: text("landing_page"),
  healthScore: integer("health_score"),
  leadsGenerated: integer("leads_generated"),
  spend: real("spend"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blueprintsTable = pgTable("blueprints", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  strategySummary: text("strategy_summary").notNull(),
  strategicAngle: text("strategic_angle"),
  audienceStrategy: text("audience_strategy").notNull(),
  budgetPlan: text("budget_plan").notNull(),
  channelPlan: text("channel_plan").notNull(),
  creativePlan: text("creative_plan").notNull(),
  experimentPlan: text("experiment_plan").notNull(),
  measurementPlan: text("measurement_plan").notNull(),
  trackingPlan: text("tracking_plan"),
  platformStrategy: json("platform_strategy").$type<PlatformStrategyEntry[]>().default([]),
  keywordThemes: json("keyword_themes").$type<KeywordThemeEntry[]>().default([]),
  negativeKeywordThemes: json("negative_keyword_themes").$type<NegativeThemeEntry[]>().default([]),
  adDirection: json("ad_direction").$type<AdDirectionEntry | null>().default(null),
  executionChecklist: json("execution_checklist").$type<string[]>().notNull().default([]),
  approvalRequirements: json("approval_requirements").$type<string[]>().notNull().default([]),
  risks: json("risks").$type<string[]>().default([]),
  assumptions: json("assumptions").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const providerDraftsTable = pgTable("provider_drafts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  provider: text("provider").notNull(),
  readinessScore: integer("readiness_score").notNull().default(0),
  status: text("status").notNull().default("draft"),
  validationIssues: json("validation_issues").$type<ProviderValidationIssue[]>().default([]),
  draftSummary: text("draft_summary"),
  accountStatus: text("account_status"),
  syncStatus: text("sync_status").default("not_synced"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── JSON field types ─────────────────────────────────────────────────────────

export interface PlatformStrategyEntry {
  name: string;
  budgetPct: number;
  rationale: string;
  recommended: boolean;
}

export interface KeywordThemeEntry {
  id: number;
  name: string;
  intent: string;
  keywords: string[];
  approved: boolean | null;
}

export interface NegativeThemeEntry {
  id: number;
  name: string;
  rationale: string;
  terms: string[];
}

export interface AdDirectionEntry {
  angle: string;
  tone: string;
  headlines: string[];
  descriptions: string[];
}

export interface ProviderValidationIssue {
  field: string;
  severity: "error" | "warning" | "info";
  message: string;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;

export const insertBlueprintSchema = createInsertSchema(blueprintsTable).omit({ id: true, createdAt: true });
export type InsertBlueprint = z.infer<typeof insertBlueprintSchema>;
export type Blueprint = typeof blueprintsTable.$inferSelect;

export const insertProviderDraftSchema = createInsertSchema(providerDraftsTable).omit({ id: true, createdAt: true });
export type InsertProviderDraft = z.infer<typeof insertProviderDraftSchema>;
export type ProviderDraft = typeof providerDraftsTable.$inferSelect;
