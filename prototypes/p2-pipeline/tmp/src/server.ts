/**
 * Interactive integration prototype server.
 *
 * Serves a single HTML page with a form (customer view) and a live
 * event log (provider view). As you fill in fields, the pipeline runs
 * checks in real time. Consent-gated checks surface a dialog.
 *
 * Architecture:
 *   Browser form → POST /api/field → P2 CheckScheduler
 *   P2 events → P5 EventBusAdapter → SSE /api/events/:view
 *   Browser consent → POST /api/consent → P2 onConsent/onConsentDenied
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

import type {
  CheckDeclaration,
  CheckOutcome,
  ICheckExecutor,
  PipelineEvent,
  SSEEvent,
} from "@cliver/contracts";

import { CheckScheduler } from "@cliver/p2-pipeline";
import { EventBus, EventBusAdapter } from "@cliver/p5-events";

// ---------------------------------------------------------------------------
// Stub executors (same as integration test, no real API calls)
// ---------------------------------------------------------------------------

class DomainCheck implements ICheckExecutor {
  readonly checkId = "domain_validation";
  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    await sleep(300); // simulate latency
    const email = String(fields.email ?? "");
    const domain = email.split("@")[1] ?? "";
    const academic = [".edu", ".ac.uk", ".ac.jp", ".edu.au"].some((s) =>
      domain.endsWith(s),
    );
    return {
      checkId: this.checkId,
      status: academic ? "pass" : "flag",
      evidence: academic
        ? `${domain} is a recognized academic domain`
        : `${domain} is not a recognized academic domain`,
      sources: [],
    };
  }
}

class SanctionsCheck implements ICheckExecutor {
  readonly checkId = "sanctions";
  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    await sleep(800); // simulate slow API
    const name = String(fields.name ?? "").toLowerCase();
    const institution = String(fields.institution ?? "").toLowerCase();
    const query = `${name} ${institution}`;
    const flagged = query.includes("sanctioned") || query.includes("blocked");
    return {
      checkId: this.checkId,
      status: flagged ? "flag" : "pass",
      evidence: flagged
        ? `Potential match found for "${fields.name}" / "${fields.institution}"`
        : `No matches in sanctions list for "${fields.name}" / "${fields.institution}"`,
      sources: flagged ? ["screen1"] : [],
    };
  }
}

class PublicationCheck implements ICheckExecutor {
  readonly checkId = "publication_search";
  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    await sleep(600);
    return {
      checkId: this.checkId,
      status: "pass",
      evidence: `Found publications for "${fields.name}" at "${fields.institution}"`,
      sources: ["epmc1", "epmc2"],
    };
  }
}

class ThirdPartyVerification implements ICheckExecutor {
  readonly checkId = "third_party_verification";
  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    await sleep(500);
    return {
      checkId: this.checkId,
      status: "pass",
      evidence: `Institutional contact at ${fields.institution} confirmed affiliation for ${fields.name}`,
      sources: ["verify1"],
    };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Check declarations
// ---------------------------------------------------------------------------

const DECLARATIONS: CheckDeclaration[] = [
  {
    id: "domain_validation",
    name: "Email Domain Validation",
    requiredFields: ["email"],
    needsConsent: false,
    description: "Validates the email domain against known academic institutions",
  },
  {
    id: "sanctions",
    name: "Sanctions & Export Control",
    requiredFields: ["name", "institution"],
    needsConsent: false,
    description: "Checks name and institution against US Consolidated Screening List",
  },
  {
    id: "publication_search",
    name: "Publication Search",
    requiredFields: ["name", "institution"],
    needsConsent: false,
    description: "Searches EPMC for publications by this researcher",
  },
  {
    id: "third_party_verification",
    name: "Third-Party Verification",
    requiredFields: ["name", "email", "institution"],
    needsConsent: true,
    description:
      "Contact the institution to verify the researcher's affiliation. An email will be sent to the institution's compliance office.",
  },
];

// ---------------------------------------------------------------------------
// Pipeline setup (single session for the prototype)
// ---------------------------------------------------------------------------

let scheduler: CheckScheduler;
let eventBus: EventBus;
let adapter: EventBusAdapter;
let screeningId = `screening-${Date.now()}`;

function resetPipeline() {
  screeningId = `screening-${Date.now()}`;
  eventBus = new EventBus();
  adapter = new EventBusAdapter(eventBus);

  scheduler = new CheckScheduler({
    screeningId,
    declarations: DECLARATIONS,
    executors: [
      new DomainCheck(),
      new SanctionsCheck(),
      new PublicationCheck(),
      new ThirdPartyVerification(),
    ],
    flagCheckIds: new Set(["sanctions"]),
    criterionNames: new Map([
      ["domain_validation", "Email Domain"],
      ["sanctions", "Sanctions List Match"],
      ["publication_search", "Publication Record"],
      ["third_party_verification", "Third-Party Verification"],
    ]),
    consentTimeoutMs: 120_000, // 2 min timeout
  });

  // Wire P2 → P5
  scheduler.subscribe((event: PipelineEvent) => {
    adapter.emit(event);
    // Also emit as a "raw" pipeline event on the debug channel
    const raw: SSEEvent = {
      type: "status",
      screeningId: event.screeningId,
      message: formatPipelineEvent(event),
    };
    eventBus.emit(event.screeningId, raw);
  });
}

function formatPipelineEvent(e: PipelineEvent): string {
  switch (e.type) {
    case "field_completed":
      return `Field "${e.fieldId}" completed`;
    case "check_started":
      return `Check "${e.checkId}" started`;
    case "check_completed":
      return `Check "${e.checkId}" completed → ${e.outcome.status}`;
    case "consent_requested":
      return `Consent requested for "${e.checkId}"`;
    case "consent_received":
      return `Consent ${e.granted ? "granted" : "denied"} for "${e.checkId}"`;
    case "pipeline_complete":
      return `Pipeline complete → ${e.decision.status}`;
    case "error":
      return `Error: ${e.message}`;
    case "action_proposed":
      return `Action proposed: ${e.description}`;
  }
}

resetPipeline();

// ---------------------------------------------------------------------------
// Hono app
// ---------------------------------------------------------------------------

const app = new Hono();

// --- API routes ---

app.post("/api/field", async (c) => {
  const body = await c.req.json<{ fieldId: string; value: string }>();
  if (!body.fieldId || body.value === undefined) {
    return c.json({ error: "fieldId and value required" }, 400);
  }
  // Fire-and-forget: don't await the full check cycle so the POST returns fast
  scheduler.onFieldCompleted(body.fieldId, body.value);
  return c.json({ ok: true, screeningId });
});

app.post("/api/consent", async (c) => {
  const body = await c.req.json<{ checkId: string; granted: boolean }>();
  if (!body.checkId || body.granted === undefined) {
    return c.json({ error: "checkId and granted required" }, 400);
  }
  if (body.granted) {
    scheduler.onConsent(body.checkId);
  } else {
    scheduler.onConsentDenied(body.checkId);
  }
  return c.json({ ok: true });
});

app.post("/api/finalize", async (c) => {
  await scheduler.finalize();
  return c.json({ ok: true, state: scheduler.getState() });
});

app.post("/api/reset", async (c) => {
  resetPipeline();
  return c.json({ ok: true, screeningId });
});

app.get("/api/state", (c) => {
  return c.json(scheduler.getState());
});

app.get("/api/audit", (c) => {
  return c.json(scheduler.getAuditLog());
});

// --- SSE stream (all pipeline events as status messages) ---

app.get("/api/events", (c) => {
  return streamSSE(c, async (stream) => {
    const sid = screeningId;

    // Send current state immediately
    await stream.writeSSE({
      event: "state",
      data: JSON.stringify(scheduler.getState()),
    });

    // Subscribe to all events (debug view = everything)
    const unsub = eventBus.subscribe(sid, "debug", (event: SSEEvent) => {
      stream.writeSSE({
        event: event.type,
        data: JSON.stringify(event),
      });
    });

    // Keep alive until client disconnects
    stream.onAbort(() => {
      unsub();
    });

    // Heartbeat
    while (true) {
      await sleep(10_000);
      await stream.writeSSE({ event: "heartbeat", data: "" });
    }
  });
});

// --- HTML UI ---

app.get("/", (c) => {
  return c.html(HTML);
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = 3077;
console.log(`Integration prototype running at http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });

// ---------------------------------------------------------------------------
// HTML (inline for simplicity)
// ---------------------------------------------------------------------------

const HTML = /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cliver integration prototype</title>
<style>
  :root {
    --bg: #0f1117;
    --surface: #1a1d27;
    --surface2: #242736;
    --border: #2e3144;
    --text: #e2e4e9;
    --text2: #8b8fa3;
    --accent: #6c7ee1;
    --accent2: #4f5ecb;
    --green: #34d399;
    --red: #f87171;
    --yellow: #fbbf24;
    --orange: #fb923c;
    --font: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: var(--font);
    font-size: 13px;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
  }

  header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  header h1 {
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  header .screening-id {
    color: var(--text2);
    font-size: 11px;
  }

  .controls {
    display: flex;
    gap: 8px;
  }

  .controls button {
    padding: 6px 14px;
    font-size: 12px;
    font-family: var(--font);
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    transition: background 0.15s;
  }

  .controls button:hover { background: var(--surface2); }
  .controls button.primary { background: var(--accent); border-color: var(--accent); }
  .controls button.primary:hover { background: var(--accent2); }
  .controls button.danger { border-color: var(--red); color: var(--red); }
  .controls button.danger:hover { background: rgba(248,113,113,0.1); }

  main {
    display: grid;
    grid-template-columns: 340px 1fr;
    height: calc(100vh - 53px);
  }

  /* --- Left panel: form --- */
  .form-panel {
    border-right: 1px solid var(--border);
    padding: 20px;
    overflow-y: auto;
  }

  .form-panel h2 {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field-group {
    margin-bottom: 16px;
  }

  .field-group label {
    display: block;
    font-size: 12px;
    color: var(--text2);
    margin-bottom: 4px;
  }

  .field-group input {
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    font-family: var(--font);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s;
  }

  .field-group input:focus {
    border-color: var(--accent);
  }

  .field-group .sent {
    font-size: 11px;
    color: var(--green);
    margin-top: 3px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .field-group .sent.visible { opacity: 1; }

  .field-group .hint {
    font-size: 11px;
    color: var(--text2);
    margin-top: 3px;
    font-style: italic;
  }

  /* --- Right panel: live view --- */
  .live-panel {
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
  }

  .tabs button {
    flex: 1;
    padding: 10px;
    font-size: 12px;
    font-family: var(--font);
    background: none;
    border: none;
    color: var(--text2);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s;
  }

  .tabs button.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .tabs button:hover:not(.active) {
    color: var(--text);
  }

  .event-log {
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .event {
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    animation: fadeIn 0.2s;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .event .time {
    color: var(--text2);
    flex-shrink: 0;
    font-size: 11px;
    min-width: 60px;
  }

  .event .tag {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: 600;
    flex-shrink: 0;
    text-transform: uppercase;
  }

  .event .msg { flex: 1; word-break: break-word; }

  .event.field   { background: rgba(108,126,225,0.08); }
  .event.field   .tag { background: rgba(108,126,225,0.2); color: var(--accent); }
  .event.started { background: rgba(251,191,36,0.06); }
  .event.started .tag { background: rgba(251,191,36,0.15); color: var(--yellow); }
  .event.pass    { background: rgba(52,211,153,0.06); }
  .event.pass    .tag { background: rgba(52,211,153,0.15); color: var(--green); }
  .event.flag    { background: rgba(248,113,113,0.06); }
  .event.flag    .tag { background: rgba(248,113,113,0.15); color: var(--red); }
  .event.error   { background: rgba(248,113,113,0.06); }
  .event.error   .tag { background: rgba(248,113,113,0.15); color: var(--red); }
  .event.consent { background: rgba(251,146,60,0.06); }
  .event.consent .tag { background: rgba(251,146,60,0.15); color: var(--orange); }
  .event.decision { background: rgba(108,126,225,0.1); }
  .event.decision .tag { background: rgba(108,126,225,0.25); color: var(--accent); }
  .event.undetermined { background: rgba(251,191,36,0.06); }
  .event.undetermined .tag { background: rgba(251,191,36,0.15); color: var(--yellow); }

  /* --- Status bar --- */
  .status-bar {
    border-top: 1px solid var(--border);
    padding: 10px 16px;
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: var(--text2);
    align-items: center;
  }

  .status-bar .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 4px;
  }

  .dot.pending  { background: var(--text2); }
  .dot.running  { background: var(--yellow); animation: pulse 1s infinite; }
  .dot.completed { background: var(--green); }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 11px;
  }

  .badge.PASS   { background: rgba(52,211,153,0.15); color: var(--green); }
  .badge.FLAG   { background: rgba(248,113,113,0.15); color: var(--red); }
  .badge.REVIEW { background: rgba(251,191,36,0.15); color: var(--yellow); }

  /* --- Consent dialog --- */
  .consent-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 100;
    justify-content: center;
    align-items: center;
  }

  .consent-overlay.visible {
    display: flex;
  }

  .consent-dialog {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px;
    max-width: 420px;
    width: 90%;
  }

  .consent-dialog h3 {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .consent-dialog p {
    color: var(--text2);
    font-size: 12px;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .consent-dialog .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .consent-dialog button {
    padding: 8px 18px;
    font-size: 12px;
    font-family: var(--font);
    border-radius: 6px;
    border: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.15s;
  }

  .consent-dialog .approve {
    background: var(--green);
    color: var(--bg);
    border-color: var(--green);
    font-weight: 600;
  }

  .consent-dialog .deny {
    background: none;
    color: var(--red);
    border-color: var(--red);
  }

  /* --- Checks grid --- */
  .checks-summary {
    padding: 12px 20px;
    border-top: 1px solid var(--border);
  }

  .checks-summary h3 {
    font-size: 11px;
    color: var(--text2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .checks-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .check-card {
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--surface2);
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .check-card .name { color: var(--text); }
  .check-card .status { font-weight: 600; text-transform: uppercase; font-size: 10px; }
  .check-card .status.pending { color: var(--text2); }
  .check-card .status.running { color: var(--yellow); }
  .check-card .status.pass { color: var(--green); }
  .check-card .status.flag { color: var(--red); }
  .check-card .status.error { color: var(--red); }
  .check-card .status.undetermined { color: var(--yellow); }
  .check-card .status.waiting { color: var(--orange); }

  .empty-state {
    color: var(--text2);
    text-align: center;
    padding: 48px 20px;
    font-size: 12px;
    line-height: 1.8;
  }
</style>
</head>
<body>

<header>
  <div>
    <h1>Cliver integration prototype</h1>
    <div class="screening-id" id="screeningId"></div>
  </div>
  <div class="controls">
    <button onclick="finalize()">Finalize</button>
    <button class="danger" onclick="resetAll()">Reset</button>
  </div>
</header>

<main>
  <!-- Left: customer form -->
  <div class="form-panel">
    <h2>Customer form</h2>

    <div class="field-group">
      <label for="f-email">Email</label>
      <input id="f-email" type="email" placeholder="researcher@university.edu" data-field="email" />
      <div class="sent" id="sent-email"></div>
      <div class="hint">Try .edu or .ac.uk for pass, other domains for flag</div>
    </div>

    <div class="field-group">
      <label for="f-name">Full name</label>
      <input id="f-name" type="text" placeholder="Alice Researcher" data-field="name" />
      <div class="sent" id="sent-name"></div>
      <div class="hint">Include "sanctioned" to trigger a sanctions flag</div>
    </div>

    <div class="field-group">
      <label for="f-institution">Institution</label>
      <input id="f-institution" type="text" placeholder="MIT" data-field="institution" />
      <div class="sent" id="sent-institution"></div>
    </div>

    <div class="checks-summary">
      <h3>Checks</h3>
      <div class="checks-grid" id="checksGrid"></div>
    </div>
  </div>

  <!-- Right: live event log -->
  <div class="live-panel">
    <div class="tabs">
      <button class="active" data-view="all" onclick="switchTab(this)">All events</button>
      <button data-view="checks" onclick="switchTab(this)">Checks only</button>
      <button data-view="consent" onclick="switchTab(this)">Consent</button>
    </div>

    <div class="event-log" id="eventLog">
      <div class="empty-state">
        Fill in form fields to start the pipeline.<br/>
        Events will appear here in real time.
      </div>
    </div>

    <div class="status-bar">
      <div><span class="dot" id="statusDot"></span> <span id="statusText">Pending</span></div>
      <div id="decisionBadge"></div>
      <div style="margin-left:auto" id="checkCounts"></div>
    </div>
  </div>
</main>

<!-- Consent dialog -->
<div class="consent-overlay" id="consentOverlay">
  <div class="consent-dialog">
    <h3>Consent required</h3>
    <p id="consentDescription"></p>
    <div class="actions">
      <button class="deny" onclick="respondConsent(false)">Deny</button>
      <button class="approve" onclick="respondConsent(true)">Approve</button>
    </div>
  </div>
</div>

<script>
// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let events = [];
let currentFilter = "all";
let pendingConsent = null; // { checkId, description }
let debounceTimers = {};

// ---------------------------------------------------------------------------
// SSE connection
// ---------------------------------------------------------------------------
let evtSource = null;

function connectSSE() {
  if (evtSource) evtSource.close();
  evtSource = new EventSource("/api/events");

  evtSource.addEventListener("state", (e) => {
    const state = JSON.parse(e.data);
    document.getElementById("screeningId").textContent = state.screeningId;
    updateStatusBar(state);
    updateChecksGrid(state);
  });

  // All event types come through as "status" from our server
  evtSource.addEventListener("status", (e) => {
    const data = JSON.parse(e.data);
    addEvent(data);
  });

  evtSource.addEventListener("consent_request", (e) => {
    const data = JSON.parse(e.data);
    showConsentDialog(data.checkId, data.description);
  });

  evtSource.onerror = () => {
    // Reconnect after a brief pause
    setTimeout(connectSSE, 2000);
  };
}

connectSSE();

// ---------------------------------------------------------------------------
// Field submission
// ---------------------------------------------------------------------------
document.querySelectorAll("input[data-field]").forEach((input) => {
  input.addEventListener("blur", () => {
    const fieldId = input.dataset.field;
    const value = input.value.trim();
    if (!value) return;
    submitField(fieldId, value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      input.blur();
      // Focus next field
      const fields = [...document.querySelectorAll("input[data-field]")];
      const idx = fields.indexOf(input);
      if (idx < fields.length - 1) fields[idx + 1].focus();
    }
  });
});

async function submitField(fieldId, value) {
  // Debounce per field
  clearTimeout(debounceTimers[fieldId]);
  debounceTimers[fieldId] = setTimeout(async () => {
    const res = await fetch("/api/field", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldId, value }),
    });
    if (res.ok) {
      const sent = document.getElementById("sent-" + fieldId);
      if (sent) {
        sent.textContent = "Sent to pipeline";
        sent.classList.add("visible");
        setTimeout(() => sent.classList.remove("visible"), 2000);
      }
    }
    // Poll state after a bit to update UI
    setTimeout(pollState, 200);
    setTimeout(pollState, 1000);
    setTimeout(pollState, 2000);
  }, 150);
}

// ---------------------------------------------------------------------------
// Event log
// ---------------------------------------------------------------------------
function addEvent(data) {
  const entry = {
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    message: data.message,
    category: categorize(data.message),
    raw: data,
  };
  events.push(entry);
  renderEvents();
  pollState();
}

function categorize(msg) {
  if (!msg) return "info";
  if (msg.startsWith("Field")) return "field";
  if (msg.includes("started")) return "started";
  if (msg.includes("pass")) return "pass";
  if (msg.includes("flag")) return "flag";
  if (msg.includes("error") || msg.includes("Error")) return "error";
  if (msg.includes("undetermined")) return "undetermined";
  if (msg.includes("Consent")) return "consent";
  if (msg.includes("Pipeline complete")) return "decision";
  return "info";
}

function shouldShow(entry) {
  if (currentFilter === "all") return true;
  if (currentFilter === "checks") return ["started", "pass", "flag", "error", "undetermined", "decision"].includes(entry.category);
  if (currentFilter === "consent") return entry.category === "consent";
  return true;
}

function renderEvents() {
  const log = document.getElementById("eventLog");
  const visible = events.filter(shouldShow);

  if (visible.length === 0) {
    log.innerHTML = '<div class="empty-state">No events matching this filter.</div>';
    return;
  }

  log.innerHTML = visible.map((e) => {
    const tag = e.category.charAt(0).toUpperCase() + e.category.slice(1);
    return '<div class="event ' + e.category + '">'
      + '<span class="time">' + e.time + '</span>'
      + '<span class="tag">' + tag + '</span>'
      + '<span class="msg">' + escapeHtml(e.message) + '</span>'
      + '</div>';
  }).join("");

  log.scrollTop = log.scrollHeight;
}

function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function switchTab(btn) {
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  currentFilter = btn.dataset.view;
  renderEvents();
}

// ---------------------------------------------------------------------------
// Status bar + checks grid
// ---------------------------------------------------------------------------
async function pollState() {
  try {
    const res = await fetch("/api/state");
    const state = await res.json();
    updateStatusBar(state);
    updateChecksGrid(state);
  } catch {}
}

function updateStatusBar(state) {
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  const badge = document.getElementById("decisionBadge");
  const counts = document.getElementById("checkCounts");

  dot.className = "dot " + state.status;
  text.textContent = state.status.charAt(0).toUpperCase() + state.status.slice(1);

  if (state.decision) {
    badge.innerHTML = '<span class="badge ' + state.decision.status + '">' + state.decision.status + '</span>';
  } else {
    badge.innerHTML = "";
  }

  const p = state.pendingChecks.length;
  const r = state.runningChecks.length;
  const c = state.completedChecks.length;
  counts.textContent = c + " done, " + r + " running, " + p + " pending";
}

const CHECK_NAMES = {
  domain_validation: "Email Domain",
  sanctions: "Sanctions",
  publication_search: "Publications",
  third_party_verification: "3rd Party",
};

function updateChecksGrid(state) {
  const grid = document.getElementById("checksGrid");
  const allIds = ["domain_validation", "sanctions", "publication_search", "third_party_verification"];

  grid.innerHTML = allIds.map((id) => {
    let status = "pending";
    if (state.runningChecks.includes(id)) status = "running";
    else if (state.completedChecks.includes(id)) {
      const outcome = state.outcomes.find((o) => o.checkId === id);
      status = outcome ? outcome.status : "done";
    } else if (state.consentState[id] === "pending") {
      status = "waiting";
    }

    const label = status === "waiting" ? "consent" : status;

    return '<div class="check-card">'
      + '<span class="name">' + (CHECK_NAMES[id] || id) + '</span>'
      + '<span class="status ' + status + '">' + label + '</span>'
      + '</div>';
  }).join("");
}

// ---------------------------------------------------------------------------
// Consent dialog
// ---------------------------------------------------------------------------
function showConsentDialog(checkId, description) {
  pendingConsent = { checkId, description };
  document.getElementById("consentDescription").textContent = description;
  document.getElementById("consentOverlay").classList.add("visible");
}

async function respondConsent(granted) {
  if (!pendingConsent) return;
  document.getElementById("consentOverlay").classList.remove("visible");

  await fetch("/api/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkId: pendingConsent.checkId, granted }),
  });

  pendingConsent = null;
  setTimeout(pollState, 300);
  setTimeout(pollState, 1200);
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
async function finalize() {
  await fetch("/api/finalize", { method: "POST" });
  setTimeout(pollState, 300);
}

async function resetAll() {
  await fetch("/api/reset", { method: "POST" });
  events = [];
  renderEvents();
  document.querySelectorAll("input[data-field]").forEach((i) => { i.value = ""; });
  document.getElementById("decisionBadge").innerHTML = "";
  connectSSE();
  setTimeout(pollState, 200);
}

// Initial poll
pollState();
</script>

</body>
</html>
`;
