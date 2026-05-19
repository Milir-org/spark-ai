import { pgTable, serial, text, integer, real, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const segmentsTable = pgTable("segments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(),
  size: integer("size").notNull().default(0),
  tags: json("tags").$type<string[]>().notNull().default([]),
  insightSummary: text("insight_summary"),
  conversionRate: real("conversion_rate"),
  trend: text("trend"),
  organizationId: integer("organization_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSegmentSchema = createInsertSchema(segmentsTable).omit({ id: true, createdAt: true });
export type InsertSegment = z.infer<typeof insertSegmentSchema>;
export type Segment = typeof segmentsTable.$inferSelect;
