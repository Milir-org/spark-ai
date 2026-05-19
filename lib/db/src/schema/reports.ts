import { pgTable, serial, text, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  insights: json("insights").$type<string[]>().notNull().default([]),
  whatWorked: json("what_worked").$type<string[]>().notNull().default([]),
  whatDidntWork: json("what_didnt_work").$type<string[]>().notNull().default([]),
  recommendations: json("recommendations").$type<string[]>().notNull().default([]),
  organizationId: integer("organization_id").notNull(),
  campaignId: integer("campaign_id"),
  campaignName: text("campaign_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
