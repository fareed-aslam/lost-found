import {
  int,
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),

  fullName: varchar("full_name", { length: 255 }).notNull(),
  userName: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 255 }).notNull(),
  profileImageUrl: varchar("profile_image_url", { length: 512 }),
  // userType: varchar("user_type", { length: 255 }).notNull(),
  userType: mysqlEnum("user_type", ["localUser", "admin"]).default("localUser"),

  deletedAt: int("deleted_at").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
