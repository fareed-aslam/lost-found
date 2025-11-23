import { int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const signupMethods = mysqlTable("signup_methods", {
  id: int("id").autoincrement().primaryKey(),
  method: varchar("method", { length: 100 }).notNull().unique(),
  // Examples:
  // "form"
  // "google"
  // "github"
});
