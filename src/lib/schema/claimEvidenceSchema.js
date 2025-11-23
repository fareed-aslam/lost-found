import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const claimEvidence = mysqlTable("claim_evidence", {
  id: int("id").primaryKey().autoincrement(),
  claimId: int("claim_id").notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  kind: varchar("kind", { length: 50 }).default("photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const claimAudit = mysqlTable("claim_audit", {
  id: int("id").primaryKey().autoincrement(),
  actorUserId: int("actor_user_id"),
  claimId: int("claim_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
