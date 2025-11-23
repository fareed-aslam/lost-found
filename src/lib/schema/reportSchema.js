import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  date,
} from "drizzle-orm/mysql-core";

export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

export const reports = mysqlTable("reports", {
  id: int("id").primaryKey().autoincrement(),
  reportType: varchar("report_type", { length: 50 }).notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  reportDate: timestamp("report_date"),
  itemStatus: varchar("item_status", { length: 100 }),
  categoryId: int("category_id"),
  description: text("description"),
  contactInfo: varchar("contact_info", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const reportImages = mysqlTable("report_images", {
  id: int("id").primaryKey().autoincrement(),
  reportId: int("report_id").notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const claims = mysqlTable("claims", {
  id: int("id").primaryKey().autoincrement(),
  reportId: int("report_id").notNull(),
  claimantName: varchar("claimant_name", { length: 255 }),
  itemDescription: text("item_description"),
  claimStatus: varchar("claim_status", { length: 50 }).default("pending"),
  claimantUserId: int("claimant_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
