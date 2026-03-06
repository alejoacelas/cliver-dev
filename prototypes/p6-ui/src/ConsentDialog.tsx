import { useCallback, useEffect, useRef } from "react";

export interface ConsentDialogProps {
  /** Description of the action requiring consent. */
  action: string;
  /** Called when the customer approves. */
  onConsent: () => void;
  /** Called when the customer denies. */
  onDeny: () => void;
}

/**
 * Modal dialog for customer consent requests.
 *
 * Shown when the pipeline proposes an action that requires the customer's
 * explicit permission (e.g., sanctions screening, credit checks).
 */
export function ConsentDialog({ action, onConsent, onDeny }: ConsentDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  const handleApprove = useCallback(() => {
    onConsent();
  }, [onConsent]);

  const handleDeny = useCallback(() => {
    onDeny();
  }, [onDeny]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;

    // Focus the first focusable element in the dialog
    const dialog = dialogRef.current;
    if (dialog) {
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDeny();
        return;
      }

      if (e.key === "Tab" && dialog) {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previously focused element
      if (previousFocusRef.current && previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [onDeny]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-heading"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog body */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 id="consent-heading" className="text-lg font-semibold text-gray-900 mb-3">
          Consent required
        </h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          The following action requires your permission before proceeding:
        </p>
        <div className="bg-gray-50 rounded-md p-4 mb-6">
          <p className="text-sm text-gray-800">{action}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleDeny}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={handleApprove}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
