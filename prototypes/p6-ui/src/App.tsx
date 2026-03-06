import { useState, useCallback, useRef, useEffect } from "react";
import type { SSEEvent, PipelineState, PipelineEvent, CompleteData } from "@cliver/contracts";
import type { FieldEvent } from "@cliver/form-engine";
import { CustomerPortal } from "./CustomerPortal.js";
import { ProviderDashboard } from "./ProviderDashboard.js";
import {
  testFormSchema,
  completedPipelineState,
  runningPipelineState,
  pendingPipelineState,
  samplePipelineEvents,
  sampleCompleteData,
  generateSessions,
  customerSSEEvents,
} from "./test-fixtures.js";

type View = "customer" | "provider";

/**
 * Dev shell for the P6 prototype. Lets you switch between the customer
 * portal and provider dashboard views, using canned data from test fixtures.
 *
 * The customer view runs a simulated event sequence so you can see
 * the form, consent dialog, status messages, and completion state.
 */
export function App() {
  const [view, setView] = useState<View>("customer");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* View switcher */}
      <nav className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-4">
        <span className="text-sm font-semibold text-gray-900 tracking-tight">cliver p6</span>
        <div className="flex gap-1 ml-4">
          <button
            type="button"
            onClick={() => setView("customer")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              view === "customer"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Customer portal
          </button>
          <button
            type="button"
            onClick={() => setView("provider")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              view === "provider"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Provider dashboard
          </button>
        </div>
      </nav>

      {/* View content */}
      {view === "customer" ? <CustomerView /> : <ProviderView />}
    </div>
  );
}

/**
 * Customer view: runs a simulated event sequence with delays.
 */
function CustomerView() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [simStarted, setSimStarted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startSimulation = useCallback(() => {
    setEvents([]);
    setSimStarted(true);

    // Clear any existing timeouts
    for (const t of timeoutRef.current) clearTimeout(t);
    timeoutRef.current = [];

    // Drip-feed events with delays
    customerSSEEvents.forEach((event, i) => {
      const t = setTimeout(() => {
        setEvents((prev) => [...prev, event]);
      }, (i + 1) * 2000);
      timeoutRef.current.push(t);
    });
  }, []);

  useEffect(() => {
    return () => {
      for (const t of timeoutRef.current) clearTimeout(t);
    };
  }, []);

  const handleFieldComplete = useCallback((event: FieldEvent) => {
    console.log("Field complete:", event);
  }, []);

  const handleConsentResponse = useCallback((checkId: string, granted: boolean) => {
    console.log("Consent response:", checkId, granted);
  }, []);

  return (
    <div>
      {!simStarted && (
        <div className="max-w-2xl mx-auto px-4 pt-6">
          <button
            type="button"
            onClick={startSimulation}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Start simulated screening
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Plays a canned event sequence: status, consent request, more status, completion.
          </p>
        </div>
      )}
      <CustomerPortal
        schema={testFormSchema}
        screeningId="scr-demo"
        onFieldComplete={handleFieldComplete}
        onConsentResponse={handleConsentResponse}
        events={events}
      />
    </div>
  );
}

/**
 * Provider view: shows a pre-populated dashboard with sample sessions.
 */
function ProviderView() {
  const sessions: PipelineState[] = [
    completedPipelineState,
    runningPipelineState,
    { ...pendingPipelineState, screeningId: "scr-003" },
    ...generateSessions(10).map((s, i) => ({
      ...s,
      screeningId: `scr-${String(i + 10).padStart(3, "0")}`,
    })),
  ];

  const auditEvents: Record<string, PipelineEvent[]> = {
    "scr-001": samplePipelineEvents,
  };

  const completeDataMap: Record<string, CompleteData> = {
    "scr-001": sampleCompleteData,
  };

  return (
    <ProviderDashboard
      sessions={sessions}
      auditEvents={auditEvents}
      completeDataMap={completeDataMap}
    />
  );
}
