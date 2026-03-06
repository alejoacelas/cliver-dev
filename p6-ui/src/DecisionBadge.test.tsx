import { render, screen } from "@testing-library/react";
import { DecisionBadge } from "./DecisionBadge.js";
import { passDecision, flagDecision, reviewDecision } from "./test-fixtures.js";

describe("DecisionBadge", () => {
  it("renders PASS with green styling", () => {
    render(<DecisionBadge decision={passDecision} />);
    const badge = screen.getByText("PASS");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/green/);
  });

  it("renders FLAG with red styling", () => {
    render(<DecisionBadge decision={flagDecision} />);
    const badge = screen.getByText("FLAG");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/red/);
  });

  it("renders REVIEW with yellow styling", () => {
    render(<DecisionBadge decision={reviewDecision} />);
    const badge = screen.getByText("REVIEW");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/yellow/);
  });

  it("shows the flag count when > 0", () => {
    render(<DecisionBadge decision={flagDecision} />);
    expect(screen.getByText(/2 flag/i)).toBeInTheDocument();
  });

  it("does not show flag count for PASS", () => {
    render(<DecisionBadge decision={passDecision} />);
    expect(screen.queryByText(/flag/i, { selector: "span" })).not.toBeInTheDocument();
  });

  it("shows the decision summary", () => {
    render(<DecisionBadge decision={flagDecision} />);
    expect(screen.getByText(/sanctions match/i)).toBeInTheDocument();
  });
});
