import { pgTable, serial, text, integer, real, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  reasoning: text("reasoning").notNull(),
  confidence: real("confidence").notNull(),
  impactEstimate: text("impact_estimate").notNull(),
  status: text("status").notNull().default("pending"),
  approvalRequired: boolean("approval_required").notNull().default(false),
  campaignId: integer("campaign_id"),
  channelType: text("channel_type"),
  suggestedAction: text("suggested_action").notNull(),
  dataSources: json("data_sources").$type<string[]>().notNull().default([]),
  organizationId: integer("organization_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecommendationSchema = createInsertSchema(recommendationsTable).omit({ id: true, createdAt: true });
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendationsTable.$inferSelect;
