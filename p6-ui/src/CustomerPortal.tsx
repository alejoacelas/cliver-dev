import { useState, useMemo, useCallback } from "react";
import type { FormSchema, SSEEvent } from "@cliver/contracts";
import { DynamicForm, type FieldEvent } from "@cliver/form-engine";
import { ConsentDialog } from "./ConsentDialog.js";

export interface CustomerPortalProps {
  /** The form schema to render. */
  schema: FormSchema;
  /** The current screening session ID. */
  screeningId: string;
  /** Called when a form field completes validation. */
  onFieldComplete: (event: FieldEvent) => void;
  /** Called when the customer responds to a consent request. */
  onConsentResponse: (checkId: string, granted: boolean) => void;
  /** SSE events received for this screening (customer-filtered). */
  events?: SSEEvent[];
}

interface ConsentRequest {
  checkId: string;
  description: string;
}

/**
 * Customer-facing portal: form + consent dialogs + generic status.
 *
 * The customer sees:
 * - A dynamic form driven by the schema
 * - Consent request dialogs when the pipeline needs permission
 * - Generic status messages ("Checking your information...")
 * - A completion message (no details, no evidence)
 *
 * The customer does NOT see:
 * - Tool calls, check names, evidence, determinations
 * - Decision status (PASS/FLAG/REVIEW)
 */
export function CustomerPortal({
  schema,
  screeningId,
  onFieldComplete,
  onConsentResponse,
  events = [],
}: CustomerPortalProps) {
  const [dismissedConsents, setDismissedConsents] = useState<Set<string>>(new Set());

  // Extract state from events
  const { statusMessage, consentRequests, isComplete, hasError } = useMemo(() => {
    let statusMessage: string | null = null;
    const consentRequests: ConsentRequest[] = [];
    let isComplete = false;
    let hasError = false;

    for (const event of events) {
      switch (event.type) {
        case "status":
          statusMessage = event.message;
          break;
        case "consent_request":
          consentRequests.push({
            checkId: event.checkId,
            description: event.description,
          });
          break;
        case "action_proposed":
          if (event.requiresConsent) {
            consentRequests.push({
              checkId: event.actionId,
              description: event.description,
            });
          }
          break;
        case "complete":
          isComplete = true;
          break;
        case "error":
          hasError = true;
          break;
        // Ignore events that customers shouldn't see
        case "tool_call":
        case "tool_result":
        case "delta":
        case "field_event":
          break;
      }
    }

    return { statusMessage, consentRequests, isComplete, hasError };
  }, [events]);

  // Find the first undismissed consent request to show
  const activeConsent = consentRequests.find(
    (cr) => !dismissedConsents.has(cr.checkId),
  );

  const handleConsent = useCallback(
    (checkId: string, granted: boolean) => {
      onConsentResponse(checkId, granted);
      setDismissedConsents((prev) => new Set(prev).add(checkId));
    },
    [onConsentResponse],
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Form */}
      {!isComplete && (
        <div className="mb-8">
          <DynamicForm schema={schema} onFieldComplete={onFieldComplete} />
        </div>
      )}

      {/* Status area */}
      <div aria-live="polite">
        {statusMessage && !isComplete && !hasError && (
          <div className="flex items-center gap-3 py-4 px-4 bg-blue-50 rounded-lg mb-6">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-blue-700">{statusMessage}</p>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div role="alert" className="flex items-center gap-3 py-4 px-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <p className="text-sm text-red-700">
              Something went wrong. Please try again or contact support.
            </p>
          </div>
        )}
      </div>

      {/* Completion message */}
      {isComplete && (
        <div className="py-8 px-6 bg-gray-50 rounded-lg text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Your screening is complete
          </h2>
          <p className="text-sm text-gray-600">
            A representative will contact you with next steps.
          </p>
        </div>
      )}

      {/* Consent dialog (modal overlay) */}
      {activeConsent && (
        <ConsentDialog
          action={activeConsent.description}
          onConsent={() => handleConsent(activeConsent.checkId, true)}
          onDeny={() => handleConsent(activeConsent.checkId, false)}
        />
      )}
    </div>
  );
}
