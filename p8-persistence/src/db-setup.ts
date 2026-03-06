/**
 * Creates the test and dev databases if they don't exist.
 * Run with: yarn db:setup
 */
import postgres from "postgres";

const DATABASES = ["cliver_p8", "cliver_p8_test"];

async function setup() {
  // Connect to the default "postgres" database to create others
  const sql = postgres("postgresql://alejo@localhost:5432/postgres");

  for (const dbName of DATABASES) {
    const existing = await sql`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;
    if (existing.length === 0) {
      // Can't use parameterized queries for CREATE DATABASE
      await sql.unsafe(`CREATE DATABASE ${dbName}`);
      console.log(`Created database: ${dbName}`);
    } else {
      console.log(`Database already exists: ${dbName}`);
    }
  }

  await sql.end();
  console.log("Database setup complete.");
}

setup().catch((err) => {
  console.error("Database setup failed:", err);
  process.exit(1);
});
