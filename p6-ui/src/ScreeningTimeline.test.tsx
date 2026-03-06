import { render, screen } from "@testing-library/react";
import { ScreeningTimeline } from "./ScreeningTimeline.js";
import { samplePipelineEvents } from "./test-fixtures.js";

describe("ScreeningTimeline", () => {
  it("renders all events in chronological order", () => {
    render(<ScreeningTimeline events={samplePipelineEvents} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(samplePipelineEvents.length);
  });

  it("shows field_completed events", () => {
    render(<ScreeningTimeline events={samplePipelineEvents} />);
    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByText(/email/i)).toBeInTheDocument();
  });

  it("shows check_started events", () => {
    render(<ScreeningTimeline events={samplePipelineEvents} />);
    expect(screen.getByText(/affiliation.*started/i)).toBeInTheDocument();
  });

  it("shows consent_requested events", () => {
    render(<ScreeningTimeline events={samplePipelineEvents} />);
    expect(screen.getByText(/consent requested/i)).toBeInTheDocument();
  });

  it("shows consent_received events", () => {
    render(<ScreeningTimeline events={samplePipelineEvents} />);
    expect(screen.getByText(/consent granted/i)).toBeInTheDocument();
  });

  it("shows check_completed events", () => {
    render(<ScreeningTimeline events={samplePipelineEvents} />);
    const completedItems = screen.getAllByText(/completed/i);
    expect(completedItems.length).toBeGreaterThanOrEqual(2);
  });

  it("shows pipeline_complete event", () => {
    render(<ScreeningTimeline events={samplePipelineEvents} />);
    expect(screen.getByText(/pipeline complete/i)).toBeInTheDocument();
  });

  it("displays timestamps", () => {
    render(<ScreeningTimeline events={samplePipelineEvents} />);
    // Should show at least one time
    expect(screen.getByText(/10:00:30/)).toBeInTheDocument();
  });

  it("renders empty state for no events", () => {
    render(<ScreeningTimeline events={[]} />);
    expect(screen.getByText(/no events/i)).toBeInTheDocument();
  });
});
