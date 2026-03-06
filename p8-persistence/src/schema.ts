import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";

// --- sessions ---

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    customerEmail: varchar("customer_email").notNull(),
    status: varchar("status", {
      enum: ["pending", "running", "completed", "failed"],
    })
      .notNull()
      .default("pending"),
    formSchemaVersion: varchar("form_schema_version"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("sessions_customer_email_idx").on(table.customerEmail)],
);

// --- field_values ---

export const fieldValues = pgTable(
  "field_values",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    fieldId: varchar("field_id").notNull(),
    value: jsonb("value"),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("field_values_session_id_idx").on(table.sessionId),
    index("field_values_session_field_idx").on(table.sessionId, table.fieldId),
    unique("field_values_session_field_uq").on(table.sessionId, table.fieldId),
  ],
);

// --- checks ---

export const checks = pgTable(
  "checks",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    checkType: varchar("check_type").notNull(),
    status: varchar("status", {
      enum: ["pending", "running", "completed", "error"],
    })
      .notNull()
      .default("pending"),
    result: jsonb("result"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("checks_session_id_idx").on(table.sessionId),
    unique("checks_session_check_type_uq").on(table.sessionId, table.checkType),
  ],
);

// --- decisions ---

export const decisions = pgTable(
  "decisions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    status: varchar("status", { enum: ["PASS", "FLAG", "REVIEW"] }).notNull(),
    flagCount: integer("flag_count").notNull().default(0),
    summary: text("summary").notNull(),
    reasons: jsonb("reasons").notNull().default(sql`'[]'::jsonb`),
    decidedAt: timestamp("decided_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("decisions_session_id_idx").on(table.sessionId)],
);

// --- consent_records ---

export const consentRecords = pgTable(
  "consent_records",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    actionType: varchar("action_type").notNull(),
    status: varchar("status", {
      enum: ["pending", "granted", "denied", "expired"],
    })
      .notNull()
      .default("pending"),
    requestedAt: timestamp("requested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    index("consent_records_session_id_idx").on(table.sessionId),
    index("consent_records_session_action_idx").on(
      table.sessionId,
      table.actionType,
    ),
    unique("consent_records_session_action_uq").on(table.sessionId, table.actionType),
  ],
);

// --- audit_events ---

export const auditEvents = pgTable(
  "audit_events",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    eventType: varchar("event_type").notNull(),
    actor: varchar("actor"),
    payload: jsonb("payload"),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_events_session_id_idx").on(table.sessionId),
    index("audit_events_timestamp_idx").on(table.timestamp),
  ],
);

// --- form_schemas ---

export const formSchemas = pgTable(
  "form_schemas",
  {
    id: varchar("id").notNull(),
    version: varchar("version").notNull(),
    schema: jsonb("schema").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.version] }),
    index("form_schemas_id_version_idx").on(table.id, table.version),
  ],
);

// --- provider_users ---

export const providerUsers = pgTable(
  "provider_users",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    totpSecret: text("totp_secret"),
    role: varchar("role", { enum: ["customer", "provider"] })
      .notNull()
      .default("provider"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("provider_users_email_idx").on(table.email)],
);

// --- customers ---

export const customers = pgTable(
  "customers",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    emailConfirmed: boolean("email_confirmed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("customers_email_idx").on(table.email)],
);

// --- auth_sessions (server-side sessions for auth middleware) ---

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    role: varchar("role", { enum: ["customer", "provider"] }).notNull(),
    aal: varchar("aal", { enum: ["AAL1", "AAL2"] }).notNull(),
    email: varchar("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastActivity: timestamp("last_activity", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("auth_sessions_user_id_idx").on(table.userId)],
);
