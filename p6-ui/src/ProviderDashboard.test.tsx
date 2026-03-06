import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProviderDashboard } from "./ProviderDashboard.js";
import {
  pendingPipelineState,
  runningPipelineState,
  completedPipelineState,
  samplePipelineEvents,
  sampleCompleteData,
  generateSessions,
} from "./test-fixtures.js";

describe("ProviderDashboard", () => {
  describe("session list", () => {
    it("lists active screening sessions", () => {
      render(
        <ProviderDashboard
          sessions={[pendingPipelineState]}
          auditEvents={{}}
          completeDataMap={{}}
        />,
      );
      expect(screen.getByText(/scr-001/)).toBeInTheDocument();
    });

    it("shows status for each session", () => {
      const running = { ...runningPipelineState, screeningId: "scr-002" };
      render(
        <ProviderDashboard
          sessions={[pendingPipelineState, running]}
          auditEvents={{}}
          completeDataMap={{}}
        />,
      );
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
      expect(screen.getByText(/running/i)).toBeInTheDocument();
    });

    it("shows timestamp for each session", () => {
      render(
        <ProviderDashboard
          sessions={[pendingPipelineState]}
          auditEvents={{}}
          completeDataMap={{}}
        />,
      );
      // Should show a date
      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it("clicking a session opens screening detail view", async () => {
      const user = userEvent.setup();
      render(
        <ProviderDashboard
          sessions={[completedPipelineState]}
          auditEvents={{ "scr-001": samplePipelineEvents }}
          completeDataMap={{ "scr-001": sampleCompleteData }}
        />,
      );
      await user.click(screen.getByText(/scr-001/));
      // After clicking, should see the screening detail
      expect(screen.getByText(/screening detail/i)).toBeInTheDocument();
    });

    it("handles 50+ sessions without errors", () => {
      const sessions = generateSessions(55);
      render(
        <ProviderDashboard
          sessions={sessions}
          auditEvents={{}}
          completeDataMap={{}}
        />,
      );
      // All 55 sessions should be rendered
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBe(55);
    });
  });

  describe("screening detail view", () => {
    it("shows which checks are running, completed, pending", async () => {
      const user = userEvent.setup();
      render(
        <ProviderDashboard
          sessions={[runningPipelineState]}
          auditEvents={{ "scr-001": samplePipelineEvents }}
          completeDataMap={{}}
        />,
      );
      await user.click(screen.getByText(/scr-001/));
      expect(screen.getByText(/running/i)).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it("shows decision badge when completed", async () => {
      const user = userEvent.setup();
      render(
        <ProviderDashboard
          sessions={[completedPipelineState]}
          auditEvents={{ "scr-001": samplePipelineEvents }}
          completeDataMap={{ "scr-001": sampleCompleteData }}
        />,
      );
      await user.click(screen.getByText(/scr-001/));
      // The DecisionBadge renders FLAG in the badge area
      expect(screen.getAllByText("FLAG").length).toBeGreaterThanOrEqual(1);
    });

    it("shows check results with evidence as they arrive", async () => {
      const user = userEvent.setup();
      render(
        <ProviderDashboard
          sessions={[completedPipelineState]}
          auditEvents={{ "scr-001": samplePipelineEvents }}
          completeDataMap={{ "scr-001": sampleCompleteData }}
        />,
      );
      await user.click(screen.getByText(/scr-001/));
      // Evidence from complete data
      expect(screen.getByText(/confirmed via orcid/i)).toBeInTheDocument();
      expect(screen.getByText(/sdn consolidated list/i)).toBeInTheDocument();
    });

    it("shows source citations", async () => {
      const user = userEvent.setup();
      render(
        <ProviderDashboard
          sessions={[completedPipelineState]}
          auditEvents={{ "scr-001": samplePipelineEvents }}
          completeDataMap={{ "scr-001": sampleCompleteData }}
        />,
      );
      await user.click(screen.getByText(/scr-001/));
      expect(screen.getAllByText(/orcid1/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/screen1/).length).toBeGreaterThanOrEqual(1);
    });

    it("shows audit trail", async () => {
      const user = userEvent.setup();
      render(
        <ProviderDashboard
          sessions={[completedPipelineState]}
          auditEvents={{ "scr-001": samplePipelineEvents }}
          completeDataMap={{ "scr-001": sampleCompleteData }}
        />,
      );
      await user.click(screen.getByText(/scr-001/));
      // Audit trail section should exist
      expect(screen.getByText(/audit trail/i)).toBeInTheDocument();
    });

    it("can navigate back to session list", async () => {
      const user = userEvent.setup();
      render(
        <ProviderDashboard
          sessions={[completedPipelineState]}
          auditEvents={{ "scr-001": samplePipelineEvents }}
          completeDataMap={{ "scr-001": sampleCompleteData }}
        />,
      );
      await user.click(screen.getByText(/scr-001/));
      expect(screen.getByText(/screening detail/i)).toBeInTheDocument();
      // Click back button
      await user.click(screen.getByRole("button", { name: /back/i }));
      expect(screen.queryByText(/screening detail/i)).not.toBeInTheDocument();
    });
  });
});
