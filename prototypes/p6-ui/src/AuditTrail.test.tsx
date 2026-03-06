import { render, screen } from "@testing-library/react";
import { AuditTrail } from "./AuditTrail.js";
import { samplePipelineEvents } from "./test-fixtures.js";

describe("AuditTrail", () => {
  it("renders all entries", () => {
    render(<AuditTrail entries={samplePipelineEvents} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(samplePipelineEvents.length);
  });

  it("shows event types as labels", () => {
    render(<AuditTrail entries={samplePipelineEvents} />);
    expect(screen.getAllByText(/field_completed/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/check_started/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/pipeline_complete/)).toBeInTheDocument();
  });

  it("shows timestamps in order", () => {
    render(<AuditTrail entries={samplePipelineEvents} />);
    const items = screen.getAllByRole("listitem");
    // First item should be the earliest event
    expect(items[0].textContent).toContain("10:00:30");
  });

  it("shows screening ID", () => {
    render(<AuditTrail entries={samplePipelineEvents} />);
    // At least one entry shows the screening ID
    expect(screen.getAllByText(/scr-001/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders empty state", () => {
    render(<AuditTrail entries={[]} />);
    expect(screen.getByText(/no audit/i)).toBeInTheDocument();
  });

  it("shows event details for check events", () => {
    render(<AuditTrail entries={samplePipelineEvents} />);
    // check_started event should show checkId
    expect(screen.getAllByText(/affiliation/).length).toBeGreaterThanOrEqual(1);
  });
});
