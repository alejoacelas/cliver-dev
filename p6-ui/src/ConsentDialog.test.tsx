import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentDialog } from "./ConsentDialog.js";

describe("ConsentDialog", () => {
  const defaultProps = {
    action: "Run sanctions screening against consolidated lists",
    onConsent: vi.fn(),
    onDeny: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the action description", () => {
    render(<ConsentDialog {...defaultProps} />);
    expect(screen.getByText(/sanctions screening/i)).toBeInTheDocument();
  });

  it("shows approve and deny buttons", () => {
    render(<ConsentDialog {...defaultProps} />);
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deny/i })).toBeInTheDocument();
  });

  it("calls onConsent when approve is clicked", async () => {
    const user = userEvent.setup();
    render(<ConsentDialog {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(defaultProps.onConsent).toHaveBeenCalledOnce();
    expect(defaultProps.onDeny).not.toHaveBeenCalled();
  });

  it("calls onDeny when deny is clicked", async () => {
    const user = userEvent.setup();
    render(<ConsentDialog {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /deny/i }));
    expect(defaultProps.onDeny).toHaveBeenCalledOnce();
    expect(defaultProps.onConsent).not.toHaveBeenCalled();
  });

  it("has dialog role for accessibility", () => {
    render(<ConsentDialog {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows a consent heading", () => {
    render(<ConsentDialog {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /consent/i })).toBeInTheDocument();
  });

  it("calls onDeny when Escape key is pressed", async () => {
    const user = userEvent.setup();
    render(<ConsentDialog {...defaultProps} />);
    await user.keyboard("{Escape}");
    expect(defaultProps.onDeny).toHaveBeenCalledOnce();
  });

  it("focuses the first focusable element on mount", () => {
    render(<ConsentDialog {...defaultProps} />);
    const denyButton = screen.getByRole("button", { name: /deny/i });
    expect(document.activeElement).toBe(denyButton);
  });

  it("traps focus within the dialog on Tab", async () => {
    const user = userEvent.setup();
    render(<ConsentDialog {...defaultProps} />);
    const denyButton = screen.getByRole("button", { name: /deny/i });
    const approveButton = screen.getByRole("button", { name: /approve/i });

    // First focusable element should be focused
    expect(document.activeElement).toBe(denyButton);

    // Tab forward to approve
    await user.tab();
    expect(document.activeElement).toBe(approveButton);

    // Tab forward should wrap to deny
    await user.tab();
    expect(document.activeElement).toBe(denyButton);
  });

  it("traps focus within the dialog on Shift+Tab", async () => {
    const user = userEvent.setup();
    render(<ConsentDialog {...defaultProps} />);
    const denyButton = screen.getByRole("button", { name: /deny/i });
    const approveButton = screen.getByRole("button", { name: /approve/i });

    // First focusable element should be focused
    expect(document.activeElement).toBe(denyButton);

    // Shift+Tab should wrap to last element (approve)
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(approveButton);
  });
});
