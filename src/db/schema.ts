import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core"
import { sql, relations } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const buyers = sqliteTable("buyers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  city: text("city").notNull(), // Chandigarh|Mohali|Zirakpur|Panchkula|Other
  propertyType: text("property_type").notNull(), // Apartment|Villa|Plot|Office|Retail
  bhk: text("bhk"), // 1|2|3|4|Studio - optional if non-residential
  purpose: text("purpose").notNull(), // Buy|Rent
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  timeline: text("timeline").notNull(), // 0-3m|3-6m|>6m|Exploring
  source: text("source").notNull(), // Website|Referral|Walk-in|Call|Other
  status: text("status").notNull().default("New"), // New|Qualified|Contacted|Visited|Negotiation|Converted|Dropped
  notes: text("notes"),
  tags: text("tags"), // JSON array of strings
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const buyerHistory = sqliteTable("buyer_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  buyerId: text("buyer_id")
    .notNull()
    .references(() => buyers.id, { onDelete: "cascade" }),
  changedBy: text("changed_by")
    .notNull()
    .references(() => users.id),
  changedAt: integer("changed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  diff: text("diff").notNull(), // JSON of changed fields
})

// NextAuth tables
export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
)

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
})

export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  buyers: many(buyers),
  buyerHistories: many(buyerHistory),
}))

export const buyersRelations = relations(buyers, ({ one, many }) => ({
  owner: one(users, {
    fields: [buyers.ownerId],
    references: [users.id],
  }),
  history: many(buyerHistory),
}))

export const buyerHistoryRelations = relations(buyerHistory, ({ one }) => ({
  buyer: one(buyers, {
    fields: [buyerHistory.buyerId],
    references: [buyers.id],
  }),
  changedByUser: one(users, {
    fields: [buyerHistory.changedBy],
    references: [users.id],
  }),
}))

// Type exports for use in the application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Buyer = typeof buyers.$inferSelect
export type NewBuyer = typeof buyers.$inferInsert
export type BuyerHistory = typeof buyerHistory.$inferSelect
export type NewBuyerHistory = typeof buyerHistory.$inferInsert
