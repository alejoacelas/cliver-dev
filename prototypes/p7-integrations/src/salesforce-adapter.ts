import type { SalesforceCredentials } from "@cliver/contracts";
import type { Decision } from "@cliver/contracts";
import type { SalesforceSession, ScreeningResultMeta } from "./types.js";
import { SalesforceApiError } from "./types.js";
import { isValidEmail } from "./email-validation.js";

/**
 * OAuth client credentials needed for token refresh.
 * TODO: P0's SalesforceCredentials type should be extended to include
 * clientId and clientSecret fields so they don't need to be passed separately.
 */
export interface OAuthClientCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * Adapter for the Salesforce REST API.
 *
 * Handles OAuth authentication, token refresh, record creation,
 * and contact lookup. All HTTP calls go through plain fetch.
 */
export class SalesforceAdapter {
  private readonly tokenEndpoint: string;
  private readonly oauthClient: OAuthClientCredentials;

  /**
   * @param oauthClient - OAuth client credentials (client_id and client_secret).
   * @param tokenEndpoint - Override the OAuth token endpoint for testing.
   *   Defaults to "https://login.salesforce.com/services/oauth2/token".
   */
  constructor(oauthClient: OAuthClientCredentials, tokenEndpoint?: string) {
    this.oauthClient = oauthClient;
    this.tokenEndpoint =
      tokenEndpoint ?? "https://login.salesforce.com/services/oauth2/token";
  }

  /**
   * Authenticate with Salesforce using OAuth credentials.
   * Exchanges the refresh token for a fresh access token.
   */
  async authenticate(
    credentials: SalesforceCredentials,
  ): Promise<SalesforceSession> {
    const params = new URLSearchParams();
    params.set("grant_type", "refresh_token");
    params.set("refresh_token", credentials.refreshToken);
    params.set("client_id", this.oauthClient.clientId);
    params.set("client_secret", this.oauthClient.clientSecret);

    return this.requestToken(params, credentials.refreshToken);
  }

  /**
   * Authenticate with Salesforce using the OAuth username-password flow.
   * The password should be the user's password concatenated with the security token.
   */
  async authenticateWithPassword(
    username: string,
    password: string,
  ): Promise<SalesforceSession> {
    const params = new URLSearchParams();
    params.set("grant_type", "password");
    params.set("username", username);
    params.set("password", password);
    params.set("client_id", this.oauthClient.clientId);
    params.set("client_secret", this.oauthClient.clientSecret);

    return this.requestToken(params);
  }

  private async requestToken(
    params: URLSearchParams,
    refreshToken?: string,
  ): Promise<SalesforceSession> {
    let response: Response;
    try {
      response = await fetch(this.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
    } catch (err) {
      throw new SalesforceApiError(
        "API_ERROR",
        `Network error during Salesforce authentication: ${(err as Error).message}`,
      );
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new SalesforceApiError(
        "INVALID_CREDENTIALS",
        `Salesforce authentication failed (${response.status}): ${text}`,
        response.status,
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      instance_url: string;
      issued_at: string;
    };

    return {
      instanceUrl: data.instance_url,
      accessToken: data.access_token,
      refreshToken: refreshToken ?? "",
      issuedAt: data.issued_at ?? new Date().toISOString(),
    };
  }

  /**
   * Refresh an existing session by re-authenticating with the
   * stored refresh token.
   */
  async refreshSession(session: SalesforceSession): Promise<SalesforceSession> {
    return this.authenticate({
      instanceUrl: session.instanceUrl,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  }

  /**
   * Push a screening result to Salesforce as a Screening__c record.
   *
   * Maps Decision fields to Salesforce custom object fields:
   * - Status__c        <- decision.status
   * - Flag_Count__c    <- decision.flagCount
   * - Flags__c         <- JSON stringified decision.reasons
   * - Summary__c       <- decision.summary
   * - Evidence_Count__c <- meta.evidenceCount
   * - Check_Count__c   <- meta.checkCount
   * - Customer_Email__c <- meta.customerEmail
   * - Screening_Id__c  <- meta.screeningId
   * - Completed_At__c  <- meta.timestamp
   *
   * If a contact is found for the customer email, the record
   * is linked to that contact via Contact__c.
   */
  async pushResult(
    session: SalesforceSession,
    decision: Decision,
    meta: ScreeningResultMeta,
  ): Promise<{ recordId: string }> {
    // Try to find existing contact to link.
    let contactId: string | null = null;
    try {
      contactId = await this.findContact(session, meta.customerEmail);
    } catch {
      // If contact lookup fails, proceed without linking.
    }

    const fields: Record<string, unknown> = {
      Status__c: decision.status,
      Flag_Count__c: decision.flagCount,
      Flags__c: decision.reasons.length > 0 ? JSON.stringify(decision.reasons) : null,
      Summary__c: decision.summary,
      Evidence_Count__c: meta.evidenceCount,
      Check_Count__c: meta.checkCount,
      Customer_Email__c: meta.customerEmail,
      Screening_Id__c: meta.screeningId,
      Completed_At__c: meta.timestamp,
    };

    if (contactId) {
      fields.Contact__c = contactId;
    }

    return this.createRecord(session, "Screening__c", fields);
  }

  /**
   * Find a Salesforce Contact by email address.
   * Returns null if no matching contact is found.
   */
  async findContact(
    session: SalesforceSession,
    email: string,
  ): Promise<string | null> {
    if (!isValidEmail(email)) {
      throw new SalesforceApiError(
        "FIELD_VALIDATION",
        `Invalid email for contact lookup: ${email}`,
      );
    }
    // Escape \ first (so we don't double-escape), then ' — both are SOQL special characters.
    const safeEmail = email.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const query = `SELECT Id FROM Contact WHERE Email = '${safeEmail}'`;
    const url = `${session.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(query)}`;

    const response = await this.sfFetch(session, url, { method: "GET" });
    const data = (await response.json()) as {
      totalSize: number;
      records: Array<{ Id: string }>;
    };

    if (data.totalSize === 0) return null;
    return data.records[0].Id;
  }

  // --- Private helpers ---

  private async createRecord(
    session: SalesforceSession,
    objectType: string,
    fields: Record<string, unknown>,
  ): Promise<{ recordId: string }> {
    const url = `${session.instanceUrl}/services/data/v59.0/sobjects/${objectType}`;

    const response = await this.sfFetch(session, url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = (await response.json()) as {
      id: string;
      success: boolean;
      errors: Array<{ message: string; statusCode: string }>;
    };

    if (!data.success) {
      const msg = data.errors.map((e) => e.message).join("; ");
      throw new SalesforceApiError(
        "FIELD_VALIDATION",
        `Salesforce record creation failed: ${msg}`,
      );
    }

    return { recordId: data.id };
  }

  /**
   * Wrapper around fetch that adds Salesforce auth headers
   * and handles common SF error codes.
   *
   * On a 401 response, automatically refreshes the session and retries
   * the request once. If the retry also returns 401, throws SESSION_EXPIRED.
   */
  private async sfFetch(
    session: SalesforceSession,
    url: string,
    init: RequestInit,
    retried = false,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${session.accessToken}`);

    let response: Response;
    try {
      response = await fetch(url, { ...init, headers });
    } catch (err) {
      throw new SalesforceApiError(
        "API_ERROR",
        `Network error calling Salesforce: ${(err as Error).message}`,
      );
    }

    if (response.status === 401) {
      if (retried) {
        throw new SalesforceApiError(
          "SESSION_EXPIRED",
          "Salesforce session expired after re-auth retry",
          401,
        );
      }
      // Auto re-auth: refresh the session and retry the original request once.
      const newSession = await this.refreshSession(session);
      // Update the session object in place so callers see the refreshed token.
      session.accessToken = newSession.accessToken;
      session.issuedAt = newSession.issuedAt;
      return this.sfFetch(session, url, init, true);
    }

    if (response.status === 429) {
      throw new SalesforceApiError(
        "RATE_LIMIT",
        "Salesforce rate limit exceeded",
        429,
      );
    }

    if (response.status === 400) {
      const text = await response.text().catch(() => "");
      throw new SalesforceApiError(
        "FIELD_VALIDATION",
        `Salesforce field validation error: ${text}`,
        400,
      );
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new SalesforceApiError(
        "API_ERROR",
        `Salesforce API error ${response.status}: ${text}`,
        response.status,
      );
    }

    return response;
  }
}
