import { mysqlTable, varchar, int, date, text } from "drizzle-orm/mysql-core";

export const items = mysqlTable("items", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }),
  location: varchar("location", { length: 255 }),
  status: varchar("status", { length: 50 }),
  date: date("date"),
  description: text("description"),
});
