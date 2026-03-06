import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerPortal } from "./CustomerPortal.js";
import { testFormSchema, passDecision } from "./test-fixtures.js";
import type { SSEEvent } from "@cliver/contracts";

describe("CustomerPortal", () => {
  const defaultProps = {
    schema: testFormSchema,
    screeningId: "scr-001",
    onFieldComplete: vi.fn(),
    onConsentResponse: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dynamic form from schema", () => {
    render(<CustomerPortal {...defaultProps} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/institution/i)).toBeInTheDocument();
  });

  it("shows generic progress status, not check details", () => {
    render(
      <CustomerPortal
        {...defaultProps}
        events={[{ type: "status", screeningId: "scr-001", message: "Checking your information..." }]}
      />,
    );
    expect(screen.getByText(/checking your information/i)).toBeInTheDocument();
    // Should NOT show tool calls or check names
    expect(screen.queryByText(/search_web/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/affiliation/i)).not.toBeInTheDocument();
  });

  it("shows consent request as a modal dialog when consent_request event arrives", () => {
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          {
            type: "consent_request",
            screeningId: "scr-001",
            checkId: "sanctions",
            description: "Run sanctions screening against consolidated lists",
          },
        ]}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/sanctions screening/i)).toBeInTheDocument();
  });

  it("sends consent response when user approves", async () => {
    const user = userEvent.setup();
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          {
            type: "consent_request",
            screeningId: "scr-001",
            checkId: "sanctions",
            description: "Run sanctions screening",
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(defaultProps.onConsentResponse).toHaveBeenCalledWith("sanctions", true);
  });

  it("sends consent response when user denies", async () => {
    const user = userEvent.setup();
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          {
            type: "consent_request",
            screeningId: "scr-001",
            checkId: "sanctions",
            description: "Run sanctions screening",
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /deny/i }));
    expect(defaultProps.onConsentResponse).toHaveBeenCalledWith("sanctions", false);
  });

  it("shows completion message on complete event without revealing details", () => {
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          {
            type: "complete",
            screeningId: "scr-001",
            data: {
              decision: passDecision,
              checks: [],
              backgroundWork: null,
              audit: { toolCalls: [], raw: { verification: "", work: null } },
            },
          },
        ]}
      />,
    );
    expect(screen.getByText(/screening is complete/i)).toBeInTheDocument();
    expect(screen.getByText(/representative will contact you/i)).toBeInTheDocument();
    // Should NOT show evidence or decision details
    expect(screen.queryByText(/PASS/)).not.toBeInTheDocument();
    expect(screen.queryByText(/affiliation/i)).not.toBeInTheDocument();
  });

  it("does not show tool_call events to customers", () => {
    // This verifies the customer view doesn't leak provider info.
    // The CustomerPortal should only process customer-appropriate events.
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          { type: "tool_call", screeningId: "scr-001", tool: "search_web", args: { query: "test" } } as SSEEvent,
        ]}
      />,
    );
    expect(screen.queryByText(/search_web/)).not.toBeInTheDocument();
  });

  it("shows consent dialog for action_proposed events with requiresConsent: true", () => {
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          {
            type: "action_proposed",
            screeningId: "scr-001",
            actionId: "send-email",
            description: "Send verification email to institution",
            requiresConsent: true,
          } as SSEEvent,
        ]}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/verification email/i)).toBeInTheDocument();
  });

  it("does not show consent dialog for action_proposed without requiresConsent", () => {
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          {
            type: "action_proposed",
            screeningId: "scr-001",
            actionId: "log-action",
            description: "Log verification step",
            requiresConsent: false,
          } as SSEEvent,
        ]}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onConsentResponse when approving action_proposed consent", async () => {
    const user = userEvent.setup();
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          {
            type: "action_proposed",
            screeningId: "scr-001",
            actionId: "send-email",
            description: "Send verification email",
            requiresConsent: true,
          } as SSEEvent,
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(defaultProps.onConsentResponse).toHaveBeenCalledWith("send-email", true);
  });

  it("shows user-friendly error message on error event", () => {
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          {
            type: "error",
            screeningId: "scr-001",
            message: "Internal server error: database connection failed",
          } as SSEEvent,
        ]}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    // Should NOT show the raw technical error
    expect(screen.queryByText(/database connection/i)).not.toBeInTheDocument();
  });

  it("has aria-live on status message area", () => {
    render(
      <CustomerPortal
        {...defaultProps}
        events={[{ type: "status", screeningId: "scr-001", message: "Checking..." }]}
      />,
    );
    const liveRegion = screen.getByText(/checking/i).closest('[aria-live]');
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
  });

  it("dismisses consent dialog after response", async () => {
    const user = userEvent.setup();
    render(
      <CustomerPortal
        {...defaultProps}
        events={[
          {
            type: "consent_request",
            screeningId: "scr-001",
            checkId: "sanctions",
            description: "Run sanctions screening",
          },
        ]}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
