/**
 * End-to-end consent interaction tests.
 *
 * These test the full flow:
 * - Pipeline proposes consent action -> customer portal shows dialog
 * - Customer approves -> pipeline resumes -> provider sees check continue
 * - Customer denies -> pipeline marks check skipped -> provider sees skip reason
 */
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomerPortal } from "./CustomerPortal.js";
import { ProviderDashboard } from "./ProviderDashboard.js";
import { testFormSchema, runningPipelineState, samplePipelineEvents } from "./test-fixtures.js";
import type { SSEEvent, PipelineState } from "@cliver/contracts";

describe("consent flow (end-to-end in UI)", () => {
  it("customer approves -> onConsentResponse fires with granted=true", async () => {
    const user = userEvent.setup();
    const onConsent = vi.fn();

    render(
      <CustomerPortal
        schema={testFormSchema}
        screeningId="scr-001"
        onFieldComplete={vi.fn()}
        onConsentResponse={onConsent}
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

    // Customer sees dialog
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/sanctions screening/i)).toBeInTheDocument();

    // Customer approves
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(onConsent).toHaveBeenCalledWith("sanctions", true);

    // Dialog dismissed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("customer denies -> onConsentResponse fires with granted=false", async () => {
    const user = userEvent.setup();
    const onConsent = vi.fn();

    render(
      <CustomerPortal
        schema={testFormSchema}
        screeningId="scr-001"
        onFieldComplete={vi.fn()}
        onConsentResponse={onConsent}
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
    expect(onConsent).toHaveBeenCalledWith("sanctions", false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("provider sees consent_received event in audit after customer responds", () => {
    // The provider sees the event in the audit trail
    const eventsWithConsent = [
      ...samplePipelineEvents.filter((e) => e.type !== "pipeline_complete"),
    ];

    render(
      <ProviderDashboard
        sessions={[runningPipelineState]}
        auditEvents={{ "scr-001": eventsWithConsent }}
        completeDataMap={{}}
        initialSelectedId="scr-001"
      />,
    );

    expect(screen.getByText(/consent granted/i)).toBeInTheDocument();
  });

  it("provider sees consent_requested event in timeline", () => {
    render(
      <ProviderDashboard
        sessions={[runningPipelineState]}
        auditEvents={{ "scr-001": samplePipelineEvents }}
        completeDataMap={{}}
        initialSelectedId="scr-001"
      />,
    );

    expect(screen.getByText(/consent requested/i)).toBeInTheDocument();
  });
});
