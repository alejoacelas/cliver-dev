/**
 * Test setup: connects to the test database, pushes schema,
 * and provides a truncateAll() helper for cleanup between tests.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../src/schema.js";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://alejo@localhost:5432/cliver_p8_test";

let testClient: ReturnType<typeof postgres>;
let testDb: ReturnType<typeof drizzle<typeof schema>>;

export function getTestDb() {
  if (!testDb) {
    testClient = postgres(TEST_DATABASE_URL);
    testDb = drizzle(testClient, { schema });
  }
  return testDb;
}

export function getTestClient() {
  if (!testClient) {
    getTestDb();
  }
  return testClient;
}

/**
 * Create all tables using raw SQL (matching the Drizzle schema).
 * This is simpler than using drizzle-kit push for tests.
 */
export async function createTables() {
  const client = getTestClient();
  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_email VARCHAR NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'pending',
      form_schema_version VARCHAR,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS field_values (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      field_id VARCHAR NOT NULL,
      value JSONB,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (session_id, field_id)
    );

    CREATE TABLE IF NOT EXISTS checks (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      check_type VARCHAR NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'pending',
      result JSONB,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      UNIQUE (session_id, check_type)
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      status VARCHAR NOT NULL,
      flag_count INTEGER NOT NULL DEFAULT 0,
      summary TEXT NOT NULL,
      reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
      decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS consent_records (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      action_type VARCHAR NOT NULL,
      status VARCHAR NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      responded_at TIMESTAMPTZ,
      UNIQUE (session_id, action_type)
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id VARCHAR NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      event_type VARCHAR NOT NULL,
      actor VARCHAR,
      payload JSONB,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS form_schemas (
      id VARCHAR NOT NULL,
      version VARCHAR NOT NULL,
      schema JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (id, version)
    );

    CREATE TABLE IF NOT EXISTS provider_users (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      totp_secret TEXT,
      role VARCHAR NOT NULL DEFAULT 'provider',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email_confirmed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      role VARCHAR NOT NULL,
      aal VARCHAR NOT NULL,
      email VARCHAR NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      last_activity TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

/**
 * Truncate all tables between tests.
 */
export async function truncateAll() {
  const client = getTestClient();
  await client.unsafe(`
    TRUNCATE
      auth_sessions,
      audit_events,
      consent_records,
      decisions,
      checks,
      field_values,
      form_schemas,
      provider_users,
      customers,
      sessions
    CASCADE;
  `);
}

/**
 * Close the test database connection.
 */
export async function closeTestDb() {
  if (testClient) {
    await testClient.end();
  }
}
