import { pgTable, serial, text, integer, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  objective: text("objective").notNull(),
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
  healthScore: integer("health_score"),
  leadsGenerated: integer("leads_generated"),
  spend: real("spend"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blueprintsTable = pgTable("blueprints", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  strategySummary: text("strategy_summary").notNull(),
  audienceStrategy: text("audience_strategy").notNull(),
  budgetPlan: text("budget_plan").notNull(),
  channelPlan: text("channel_plan").notNull(),
  creativePlan: text("creative_plan").notNull(),
  experimentPlan: text("experiment_plan").notNull(),
  measurementPlan: text("measurement_plan").notNull(),
  executionChecklist: json("execution_checklist").$type<string[]>().notNull().default([]),
  approvalRequirements: json("approval_requirements").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;

export const insertBlueprintSchema = createInsertSchema(blueprintsTable).omit({ id: true, createdAt: true });
export type InsertBlueprint = z.infer<typeof insertBlueprintSchema>;
export type Blueprint = typeof blueprintsTable.$inferSelect;
