import { pgTable, serial, text, integer, real, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const approvalsTable = pgTable("approvals", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requestedBy: integer("requested_by").notNull(),
  requestedByName: text("requested_by_name").notNull(),
  requiredRole: text("required_role").notNull(),
  status: text("status").notNull().default("pending"),
  riskLevel: text("risk_level").notNull().default("medium"),
  budgetImpact: real("budget_impact"),
  aiReasoning: text("ai_reasoning"),
  campaignId: integer("campaign_id"),
  campaignName: text("campaign_name"),
  dueDate: text("due_date"),
  comments: json("comments").$type<string[]>().notNull().default([]),
  organizationId: integer("organization_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertApprovalSchema = createInsertSchema(approvalsTable).omit({ id: true, createdAt: true });
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type Approval = typeof approvalsTable.$inferSelect;
