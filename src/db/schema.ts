import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 140 }),
  representativeName: varchar("representative_name", { length: 120 }),
  role: varchar("role", { length: 100 }),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 120 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 24 }).default("pza").notNull(),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  businessName: varchar("business_name", { length: 140 }).default("Mi Taller").notNull(),
  logoUrl: text("logo_url"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 140 }),
  address: text("address"),
  currency: varchar("currency", { length: 8 }).default("MXN").notNull(),
  defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 2 }).default("16.00").notNull(),
  bankName: varchar("bank_name", { length: 120 }),
  bankAccount: varchar("bank_account", { length: 120 }),
  bankClabe: varchar("bank_clabe", { length: 120 }),
  bankBeneficiary: varchar("bank_beneficiary", { length: 120 }),
  qrPayload: text("qr_payload"),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number", { length: 40 }),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  title: varchar("title", { length: 140 }).notNull(),
  status: varchar("status", { length: 24 }).default("draft").notNull(),
  currency: varchar("currency", { length: 8 }).default("MXN").notNull(),
  applyTax: boolean("apply_tax").default(false).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("16.00").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).default("0").notNull(),
  validUntil: date("valid_until"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).default("1").notNull(),
  unit: varchar("unit", { length: 20 }).default("pza").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0").notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  receiptNumber: varchar("receipt_number", { length: 40 }),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  currency: varchar("currency", { length: 8 }).default("MXN").notNull(),
  applyTax: boolean("apply_tax").default(false).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("16.00").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).default("0").notNull(),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }).default("efectivo").notNull(),
  status: varchar("status", { length: 24 }).default("pendiente").notNull(),
  notes: text("notes"),
  issuedAt: timestamp("issued_at", { withTimezone: false }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const receiptItems = pgTable("receipt_items", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id")
    .notNull()
    .references(() => receipts.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).default("1").notNull(),
  unit: varchar("unit", { length: 20 }).default("pza").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0").notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});

export const receiptPayments = pgTable("receipt_payments", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id")
    .notNull()
    .references(() => receipts.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  method: varchar("method", { length: 30 }).default("transferencia").notNull(),
  note: text("note"),
  paidAt: timestamp("paid_at", { withTimezone: false }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
});
