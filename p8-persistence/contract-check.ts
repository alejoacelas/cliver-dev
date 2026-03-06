/**
 * Contract compilation check for P8.
 *
 * Imports every export from @cliver/contracts that P8 uses and verifies
 * the storage layer implementation satisfies IStorageLayer.
 *
 * This file is NOT meant to be executed — only type-checked with:
 *   npx tsc --noEmit --project tsconfig.json
 */
import type {
  IStorageLayer,
  PipelineState,
  PipelineEvent,
  CheckOutcome,
  ConsentStatus,
  Decision,
  FormSchema,
  UserRole,
  AAL,
  Session,
  TokenPayload,
  SSEEvent,
} from "@cliver/contracts";

import { createStorageLayer } from "./src/storage.js";
import { createApp } from "./src/routes.js";
import { createAuthMiddleware, type AuthContext } from "./src/auth-middleware.js";

// Verify createStorageLayer returns IStorageLayer
declare const db: Parameters<typeof createStorageLayer>[0];
const _storage: IStorageLayer = createStorageLayer(db);

// Verify all IStorageLayer methods exist with correct signatures
const _createScreening: (data: Partial<PipelineState>) => Promise<string> =
  _storage.createScreening;
const _getScreening: (id: string) => Promise<PipelineState | null> =
  _storage.getScreening;
const _updateScreening: (
  id: string,
  data: Partial<PipelineState>,
) => Promise<void> = _storage.updateScreening;
const _listScreenings: (
  filter?: Record<string, unknown>,
) => Promise<PipelineState[]> = _storage.listScreenings;
const _storeOutcome: (
  screeningId: string,
  outcome: CheckOutcome,
) => Promise<void> = _storage.storeOutcome;
const _getOutcomes: (screeningId: string) => Promise<CheckOutcome[]> =
  _storage.getOutcomes;
const _storeFieldValue: (
  screeningId: string,
  fieldId: string,
  value: unknown,
) => Promise<void> = _storage.storeFieldValue;
const _getFieldValues: (
  screeningId: string,
) => Promise<Record<string, unknown>> = _storage.getFieldValues;
const _storeConsentRecord: (
  screeningId: string,
  checkId: string,
  status: ConsentStatus,
) => Promise<void> = _storage.storeConsentRecord;
const _getConsentRecords: (
  screeningId: string,
) => Promise<Array<{ checkId: string; status: ConsentStatus }>> =
  _storage.getConsentRecords;
const _storeAuditEvent: (event: PipelineEvent) => Promise<void> =
  _storage.storeAuditEvent;
const _queryAuditEvents: (filter: {
  screeningId?: string;
  type?: string;
  since?: string;
}) => Promise<PipelineEvent[]> = _storage.queryAuditEvents;
const _createUser: (data: {
  email: string;
  passwordHash: string;
  role: UserRole;
}) => Promise<string> = _storage.createUser;
const _getUserByEmail: (email: string) => Promise<{
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  totpSecret?: string;
  emailConfirmed?: boolean;
} | null> = _storage.getUserByEmail;
const _updateUser: (
  id: string,
  data: Record<string, unknown>,
) => Promise<void> = _storage.updateUser;
const _storeFormSchema: (schema: FormSchema) => Promise<void> =
  _storage.storeFormSchema;
const _getFormSchema: (
  id: string,
  version?: string,
) => Promise<FormSchema | null> = _storage.getFormSchema;

// Verify AuthContext shape
const _authContext: AuthContext = {
  userId: "u1",
  email: "test@test.com",
  role: "customer" as UserRole,
  aal: "AAL1" as AAL,
  sessionId: "s1",
};

// Suppress unused variable warnings
void [
  _storage,
  _createScreening,
  _getScreening,
  _updateScreening,
  _listScreenings,
  _storeOutcome,
  _getOutcomes,
  _storeFieldValue,
  _getFieldValues,
  _storeConsentRecord,
  _getConsentRecords,
  _storeAuditEvent,
  _queryAuditEvents,
  _createUser,
  _getUserByEmail,
  _updateUser,
  _storeFormSchema,
  _getFormSchema,
  _authContext,
];
