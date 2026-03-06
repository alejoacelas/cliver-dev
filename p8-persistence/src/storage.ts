import { eq, and, desc, asc, gte, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type {
  IStorageLayer,
  PipelineState,
  CheckOutcome,
  ConsentStatus,
  PipelineEvent,
  UserRole,
  FormSchema,
} from "@cliver/contracts";
import * as schema from "./schema.js";

export function createStorageLayer(
  db: PostgresJsDatabase<typeof schema>,
): IStorageLayer {
  return {
    // --- Screenings ---

    async createScreening(data: Partial<PipelineState>, customerEmail?: string): Promise<string> {
      const [row] = await db
        .insert(schema.sessions)
        .values({
          customerEmail: customerEmail ?? "unknown@example.com",
          status: data.status ?? "pending",
          formSchemaVersion: undefined,
        })
        .returning({ id: schema.sessions.id });
      return row.id;
    },

    async getScreening(id: string): Promise<PipelineState | null> {
      const [session] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, id));
      if (!session) return null;

      // Gather related data
      const fieldRows = await db
        .select()
        .from(schema.fieldValues)
        .where(eq(schema.fieldValues.sessionId, id));

      const checkRows = await db
        .select()
        .from(schema.checks)
        .where(eq(schema.checks.sessionId, id));

      const outcomeRows = checkRows
        .filter((c) => c.status === "completed" && c.result)
        .map((c) => c.result as CheckOutcome);

      const consentRows = await db
        .select()
        .from(schema.consentRecords)
        .where(eq(schema.consentRecords.sessionId, id));

      const [decisionRow] = await db
        .select()
        .from(schema.decisions)
        .where(eq(schema.decisions.sessionId, id))
        .orderBy(desc(schema.decisions.decidedAt))
        .limit(1);

      const completedFields = fieldRows.map((f) => f.fieldId);
      const pendingChecks = checkRows
        .filter((c) => c.status === "pending")
        .map((c) => c.checkType);
      const runningChecks = checkRows
        .filter((c) => c.status === "running")
        .map((c) => c.checkType);
      const completedChecks = checkRows
        .filter((c) => c.status === "completed" || c.status === "error")
        .map((c) => c.checkType);

      const consentState: Record<string, ConsentStatus> = {};
      for (const cr of consentRows) {
        consentState[cr.actionType] = cr.status as ConsentStatus;
      }

      const decision = decisionRow
        ? {
            status: decisionRow.status as "PASS" | "FLAG" | "REVIEW",
            flagCount: decisionRow.flagCount,
            summary: decisionRow.summary,
            reasons: (decisionRow.reasons ?? []) as Array<{
              checkId: string;
              criterion: string;
              detail: string;
            }>,
          }
        : null;

      return {
        screeningId: session.id,
        status: session.status as PipelineState["status"],
        completedFields,
        pendingChecks,
        runningChecks,
        completedChecks,
        outcomes: outcomeRows,
        consentState,
        decision,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      };
    },

    async updateScreening(
      id: string,
      data: Partial<PipelineState>,
    ): Promise<void> {
      const updates: Record<string, unknown> = {};
      if (data.status) updates.status = data.status;
      updates.updatedAt = new Date();

      await db
        .update(schema.sessions)
        .set(updates)
        .where(eq(schema.sessions.id, id));
    },

    async listScreenings(
      filter?: Record<string, unknown>,
    ): Promise<PipelineState[]> {
      const conditions = [];
      if (filter?.status) {
        conditions.push(
          eq(
            schema.sessions.status,
            filter.status as "pending" | "running" | "completed" | "failed",
          ),
        );
      }
      if (filter?.customerEmail) {
        conditions.push(
          eq(schema.sessions.customerEmail, filter.customerEmail as string),
        );
      }

      const query = conditions.length
        ? db
            .select()
            .from(schema.sessions)
            .where(and(...conditions))
        : db.select().from(schema.sessions);

      const rows = await query.orderBy(desc(schema.sessions.createdAt));
      const results: PipelineState[] = [];
      for (const row of rows) {
        const state = await this.getScreening(row.id);
        if (state) results.push(state);
      }
      return results;
    },

    // --- Check outcomes ---

    async storeOutcome(
      screeningId: string,
      outcome: CheckOutcome,
    ): Promise<void> {
      await db
        .insert(schema.checks)
        .values({
          sessionId: screeningId,
          checkType: outcome.checkId,
          status: outcome.status === "error" ? "error" : "completed",
          result: outcome,
          startedAt: new Date(),
          completedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.checks.sessionId, schema.checks.checkType],
          set: {
            status: outcome.status === "error" ? "error" : "completed",
            result: outcome,
            completedAt: new Date(),
          },
        });
    },

    async getOutcomes(screeningId: string): Promise<CheckOutcome[]> {
      const rows = await db
        .select()
        .from(schema.checks)
        .where(eq(schema.checks.sessionId, screeningId));

      return rows
        .filter((r) => r.result !== null)
        .map((r) => r.result as CheckOutcome);
    },

    // --- Field values ---

    async storeFieldValue(
      screeningId: string,
      fieldId: string,
      value: unknown,
    ): Promise<void> {
      await db
        .insert(schema.fieldValues)
        .values({
          sessionId: screeningId,
          fieldId,
          value,
        })
        .onConflictDoUpdate({
          target: [schema.fieldValues.sessionId, schema.fieldValues.fieldId],
          set: { value, completedAt: new Date() },
        });
    },

    async getFieldValues(
      screeningId: string,
    ): Promise<Record<string, unknown>> {
      const rows = await db
        .select()
        .from(schema.fieldValues)
        .where(eq(schema.fieldValues.sessionId, screeningId));

      const result: Record<string, unknown> = {};
      for (const row of rows) {
        result[row.fieldId] = row.value;
      }
      return result;
    },

    // --- Consent records ---

    async storeConsentRecord(
      screeningId: string,
      checkId: string,
      status: ConsentStatus,
    ): Promise<void> {
      await db
        .insert(schema.consentRecords)
        .values({
          sessionId: screeningId,
          actionType: checkId,
          status,
          respondedAt: status !== "pending" ? new Date() : undefined,
        })
        .onConflictDoUpdate({
          target: [schema.consentRecords.sessionId, schema.consentRecords.actionType],
          set: {
            status,
            respondedAt: status !== "pending" ? new Date() : undefined,
          },
        });
    },

    async getConsentRecords(
      screeningId: string,
    ): Promise<Array<{ checkId: string; status: ConsentStatus }>> {
      const rows = await db
        .select()
        .from(schema.consentRecords)
        .where(eq(schema.consentRecords.sessionId, screeningId));

      return rows.map((r) => ({
        checkId: r.actionType,
        status: r.status as ConsentStatus,
      }));
    },

    // --- Audit events ---

    async storeAuditEvent(event: PipelineEvent): Promise<void> {
      await db.insert(schema.auditEvents).values({
        sessionId: event.screeningId,
        eventType: event.type,
        payload: event,
        timestamp: new Date(event.timestamp),
      });
    },

    async queryAuditEvents(filter: {
      screeningId?: string;
      type?: string;
      since?: string;
    }): Promise<PipelineEvent[]> {
      const conditions = [];
      if (filter.screeningId) {
        conditions.push(
          eq(schema.auditEvents.sessionId, filter.screeningId),
        );
      }
      if (filter.type) {
        conditions.push(eq(schema.auditEvents.eventType, filter.type));
      }
      if (filter.since) {
        conditions.push(
          gte(schema.auditEvents.timestamp, new Date(filter.since)),
        );
      }

      const query = conditions.length
        ? db
            .select()
            .from(schema.auditEvents)
            .where(and(...conditions))
            .orderBy(asc(schema.auditEvents.timestamp))
        : db
            .select()
            .from(schema.auditEvents)
            .orderBy(asc(schema.auditEvents.timestamp));

      const rows = await query;
      return rows.map((r) => r.payload as PipelineEvent);
    },

    // --- Users ---

    async createUser(data: {
      email: string;
      passwordHash: string;
      role: UserRole;
    }): Promise<string> {
      if (data.role === "provider") {
        const [row] = await db
          .insert(schema.providerUsers)
          .values({
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role,
          })
          .returning({ id: schema.providerUsers.id });
        return row.id;
      } else {
        const [row] = await db
          .insert(schema.customers)
          .values({
            email: data.email,
            passwordHash: data.passwordHash,
          })
          .returning({ id: schema.customers.id });
        return row.id;
      }
    },

    async getUserByEmail(
      email: string,
    ): Promise<{
      id: string;
      email: string;
      passwordHash: string;
      role: UserRole;
      totpSecret?: string;
      emailConfirmed?: boolean;
    } | null> {
      // Check providers first
      const [provider] = await db
        .select()
        .from(schema.providerUsers)
        .where(eq(schema.providerUsers.email, email));

      if (provider) {
        return {
          id: provider.id,
          email: provider.email,
          passwordHash: provider.passwordHash,
          role: provider.role as UserRole,
          totpSecret: provider.totpSecret ?? undefined,
        };
      }

      // Then check customers
      const [customer] = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.email, email));

      if (customer) {
        return {
          id: customer.id,
          email: customer.email,
          passwordHash: customer.passwordHash,
          role: "customer" as UserRole,
          emailConfirmed: customer.emailConfirmed,
        };
      }

      return null;
    },

    async updateUser(
      id: string,
      data: Record<string, unknown>,
    ): Promise<void> {
      // Try providers first
      const [provider] = await db
        .select()
        .from(schema.providerUsers)
        .where(eq(schema.providerUsers.id, id));

      if (provider) {
        const updates: Record<string, unknown> = {};
        if ("passwordHash" in data)
          updates.passwordHash = data.passwordHash;
        if ("totpSecret" in data) updates.totpSecret = data.totpSecret;
        if ("email" in data) updates.email = data.email;
        await db
          .update(schema.providerUsers)
          .set(updates)
          .where(eq(schema.providerUsers.id, id));
        return;
      }

      // Then customers
      const customerUpdates: Record<string, unknown> = {};
      if ("passwordHash" in data)
        customerUpdates.passwordHash = data.passwordHash;
      if ("emailConfirmed" in data)
        customerUpdates.emailConfirmed = data.emailConfirmed;
      if ("email" in data) customerUpdates.email = data.email;
      await db
        .update(schema.customers)
        .set(customerUpdates)
        .where(eq(schema.customers.id, id));
    },

    // --- Form schemas ---

    async storeFormSchema(formSchema: FormSchema): Promise<void> {
      await db
        .insert(schema.formSchemas)
        .values({
          id: formSchema.id,
          version: formSchema.version,
          schema: formSchema,
        })
        .onConflictDoUpdate({
          target: [schema.formSchemas.id, schema.formSchemas.version],
          set: { schema: formSchema },
        });
    },

    async getFormSchema(
      id: string,
      version?: string,
    ): Promise<FormSchema | null> {
      let query;
      if (version) {
        query = db
          .select()
          .from(schema.formSchemas)
          .where(
            and(
              eq(schema.formSchemas.id, id),
              eq(schema.formSchemas.version, version),
            ),
          );
      } else {
        query = db
          .select()
          .from(schema.formSchemas)
          .where(eq(schema.formSchemas.id, id))
          .orderBy(desc(schema.formSchemas.createdAt))
          .limit(1);
      }

      const [row] = await query;
      return row ? (row.schema as FormSchema) : null;
    },
  };
}
