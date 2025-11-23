import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  text,
} from "drizzle-orm/mysql-core";

export const userAudit = mysqlTable("user_audit", {
  id: int("id").primaryKey().autoincrement(),
  actorUserId: int("actor_user_id"),
  targetUserId: int("target_user_id"),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
