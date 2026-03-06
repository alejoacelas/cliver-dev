/**
 * Interactive p4-auth prototype.
 *
 * Lets you exercise the full auth stack through a browser:
 *   - Customer registration (email + password, NIST SP 800-63B-4)
 *   - Email confirmation codes
 *   - Customer login (AAL1)
 *   - Provider TOTP enrollment (QR code)
 *   - Provider login (AAL2: password + TOTP)
 *   - Session inspection + logout
 *   - Third-party email verification flow
 *   - Password strength + breach checking
 *
 * All state is in-memory. The ConsoleEmailTransport captures sent
 * emails so you can see confirmation codes without a real mail server.
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";

import {
  PasswordService,
  SessionService,
  CustomerAuthService,
  ProviderAuthService,
  EmailVerificationService,
  ConsoleEmailTransport,
  InMemoryTokenStore,
  InMemoryUserStore,
} from "@cliver/auth";

// ---------------------------------------------------------------------------
// Bootstrap services
// ---------------------------------------------------------------------------

const tokenStore = new InMemoryTokenStore();
const userStore = new InMemoryUserStore();
const emailTransport = new ConsoleEmailTransport();
const passwordService = new PasswordService();
const sessionService = new SessionService(tokenStore);

const customerAuth = new CustomerAuthService(
  passwordService,
  sessionService,
  userStore,
  tokenStore,
  emailTransport,
);

const providerAuth = new ProviderAuthService(
  passwordService,
  sessionService,
  userStore,
  tokenStore,
);

const emailVerification = new EmailVerificationService(
  tokenStore,
  emailTransport,
);

// ---------------------------------------------------------------------------
// Hono app
// ---------------------------------------------------------------------------

const app = new Hono();

// --- Password ---

app.post("/api/password/check", async (c) => {
  const { password, aal } = await c.req.json<{ password: string; aal?: string }>();
  const strength = passwordService.validateStrength(password, (aal as "AAL1" | "AAL2") ?? "AAL1");
  const blocklist = await passwordService.checkBlocklist(password);
  return c.json({ strength, blocklist });
});

// --- Customer auth ---

app.post("/api/customer/register", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const result = await customerAuth.register(email, password);
  return c.json(result);
});

app.post("/api/customer/confirm", async (c) => {
  const { email, code } = await c.req.json<{ email: string; code: string }>();
  const result = await customerAuth.confirmEmail(email, code);
  return c.json(result);
});

app.post("/api/customer/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const result = await customerAuth.login(email, password);
  return c.json(result);
});

// --- Provider auth ---

app.post("/api/provider/register", async (c) => {
  // Providers are pre-created; this creates one for testing
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const strength = passwordService.validateStrength(password, "AAL2");
  if (!strength.valid) return c.json({ success: false, error: strength.reason });
  const hash = await passwordService.hash(password);
  const userId = await userStore.createUser({
    email,
    passwordHash: hash,
    role: "provider",
    emailConfirmed: true, // providers are pre-confirmed
  });
  return c.json({ success: true, userId });
});

app.post("/api/provider/enroll-totp", async (c) => {
  const { userId } = await c.req.json<{ userId: string }>();
  try {
    const enrollment = await providerAuth.enrollTOTP(userId);
    return c.json({ success: true, ...enrollment });
  } catch (e: unknown) {
    return c.json({ success: false, error: (e as Error).message });
  }
});

app.post("/api/provider/login", async (c) => {
  const { email, password, totpCode } = await c.req.json<{
    email: string;
    password: string;
    totpCode: string;
  }>();
  const result = await providerAuth.login(email, password, totpCode);
  return c.json(result);
});

// --- Sessions ---

app.post("/api/session/validate", async (c) => {
  const { sessionId } = await c.req.json<{ sessionId: string }>();
  const session = await sessionService.validateSession(sessionId);
  if (!session) return c.json({ valid: false });
  const enforced = await sessionService.enforceTimeouts(session);
  if (!enforced) return c.json({ valid: false, reason: "timed out" });
  const csrf = await sessionService.getCsrfToken(sessionId);
  return c.json({ valid: true, session: enforced, csrfToken: csrf });
});

app.post("/api/session/logout", async (c) => {
  const { sessionId } = await c.req.json<{ sessionId: string }>();
  await sessionService.destroySession(sessionId);
  return c.json({ ok: true });
});

// --- Email verification ---

app.post("/api/verification/request", async (c) => {
  const { contactEmail, customerName, institution } = await c.req.json<{
    contactEmail: string;
    customerName: string;
    institution: string;
  }>();
  const result = await emailVerification.requestVerification(
    contactEmail,
    customerName,
    institution,
  );
  return c.json(result);
});

app.post("/api/verification/status", async (c) => {
  const { verificationId } = await c.req.json<{ verificationId: string }>();
  try {
    const result = await emailVerification.checkStatus(verificationId);
    return c.json(result);
  } catch (e: unknown) {
    return c.json({ error: (e as Error).message }, 404);
  }
});

app.post("/api/verification/respond", async (c) => {
  const { token, decision } = await c.req.json<{
    token: string;
    decision: "confirmed" | "denied";
  }>();
  try {
    await emailVerification.handleResponse(token, decision);
    return c.json({ ok: true });
  } catch (e: unknown) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// --- Debug: see all sent emails ---

app.get("/api/emails", (c) => {
  return c.json(emailTransport.sentEmails);
});

app.get("/api/users", async (c) => {
  // Expose user store for debugging (not in production!)
  const emails = ["customer@test.com", "provider@test.com"]; // check known ones
  const users = [];
  for (const email of emails) {
    const u = await userStore.getUserByEmail(email);
    if (u) users.push({ id: u.id, email: u.email, role: u.role, emailConfirmed: u.emailConfirmed, failedAttempts: u.failedAttempts, hasTOTP: !!u.totpSecret });
  }
  return c.json(users);
});

// --- HTML UI ---

app.get("/", (c) => c.html(HTML));

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = 3078;
console.log(`Auth prototype running at http://localhost:${PORT}`);
serve({ fetch: app.fetch, port: PORT });

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

const HTML = /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cliver auth prototype</title>
<style>
  :root {
    --bg: #0f1117; --surface: #1a1d27; --surface2: #242736;
    --border: #2e3144; --text: #e2e4e9; --text2: #8b8fa3;
    --accent: #6c7ee1; --accent2: #4f5ecb;
    --green: #34d399; --red: #f87171; --yellow: #fbbf24; --orange: #fb923c;
    --font: 'SF Mono','Cascadia Code','Fira Code','JetBrains Mono',monospace;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:var(--font); font-size:13px; background:var(--bg); color:var(--text); line-height:1.5; }

  header { padding:16px 24px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  header h1 { font-size:15px; font-weight:600; letter-spacing:-0.02em; }

  main { display:grid; grid-template-columns:1fr 1fr; height:calc(100vh - 53px); }

  .panel { border-right:1px solid var(--border); padding:20px; overflow-y:auto; }
  .panel:last-child { border-right:none; }

  h2 { font-size:13px; font-weight:600; margin-bottom:12px; color:var(--text2); text-transform:uppercase; letter-spacing:0.05em; }
  h3 { font-size:12px; font-weight:600; margin:16px 0 8px; color:var(--accent); }

  .section { margin-bottom:20px; padding:14px; background:var(--surface); border:1px solid var(--border); border-radius:8px; }

  label { display:block; font-size:11px; color:var(--text2); margin-bottom:3px; }
  input { width:100%; padding:7px 10px; font-size:13px; font-family:var(--font); background:var(--surface2); border:1px solid var(--border); border-radius:6px; color:var(--text); outline:none; margin-bottom:8px; }
  input:focus { border-color:var(--accent); }

  button { padding:7px 16px; font-size:12px; font-family:var(--font); border:1px solid var(--border); border-radius:6px; background:var(--surface2); color:var(--text); cursor:pointer; transition:background .15s; margin-right:6px; margin-bottom:6px; }
  button:hover { background:var(--accent); border-color:var(--accent); }
  button.small { padding:4px 10px; font-size:11px; }
  button.green { background:rgba(52,211,153,.15); border-color:var(--green); color:var(--green); }
  button.green:hover { background:rgba(52,211,153,.3); }
  button.red { background:rgba(248,113,113,.1); border-color:var(--red); color:var(--red); }
  button.red:hover { background:rgba(248,113,113,.2); }

  .result { margin-top:8px; padding:8px 10px; border-radius:6px; font-size:12px; white-space:pre-wrap; word-break:break-all; max-height:200px; overflow-y:auto; }
  .result.ok { background:rgba(52,211,153,.08); border:1px solid rgba(52,211,153,.2); color:var(--green); }
  .result.err { background:rgba(248,113,113,.08); border:1px solid rgba(248,113,113,.2); color:var(--red); }
  .result.info { background:rgba(108,126,225,.08); border:1px solid rgba(108,126,225,.2); color:var(--accent); }

  .log { font-size:11px; color:var(--text2); padding:6px 0; border-bottom:1px solid var(--border); }
  .log .time { color:var(--text2); margin-right:8px; }
  .log .tag { font-size:10px; padding:1px 5px; border-radius:3px; font-weight:600; margin-right:6px; }
  .log .tag.email { background:rgba(108,126,225,.15); color:var(--accent); }
  .log .tag.action { background:rgba(251,191,36,.15); color:var(--yellow); }

  .qr-container { text-align:center; margin:8px 0; }
  .qr-container img { border-radius:8px; border:2px solid var(--border); }

  .hint { font-size:11px; color:var(--text2); font-style:italic; margin-bottom:8px; }

  .tabs { display:flex; gap:0; margin-bottom:12px; }
  .tabs button { flex:1; border-radius:0; border-bottom:2px solid transparent; background:none; margin:0; }
  .tabs button:first-child { border-radius:6px 0 0 0; }
  .tabs button:last-child { border-radius:0 6px 0 0; }
  .tabs button.active { border-bottom-color:var(--accent); color:var(--accent); }

  .tab-content { display:none; }
  .tab-content.active { display:block; }

  .session-card { padding:8px 10px; background:var(--surface2); border-radius:6px; margin-bottom:6px; font-size:11px; display:flex; justify-content:space-between; align-items:center; }
  .session-card .meta { color:var(--text2); }
  .badge { padding:2px 8px; border-radius:4px; font-weight:700; font-size:10px; text-transform:uppercase; }
  .badge.aal1 { background:rgba(52,211,153,.15); color:var(--green); }
  .badge.aal2 { background:rgba(108,126,225,.15); color:var(--accent); }
</style>
</head>
<body>

<header>
  <h1>Cliver auth prototype</h1>
  <div style="font-size:11px;color:var(--text2)">NIST SP 800-63B-4 compliant</div>
</header>

<main>
  <!-- Left panel: actions -->
  <div class="panel">
    <div class="tabs" id="mainTabs">
      <button class="active" onclick="switchMain('customer')">Customer (AAL1)</button>
      <button onclick="switchMain('provider')">Provider (AAL2)</button>
      <button onclick="switchMain('verification')">Verification</button>
      <button onclick="switchMain('password')">Password</button>
    </div>

    <!-- CUSTOMER TAB -->
    <div class="tab-content active" id="tab-customer">
      <div class="section">
        <h3>1. Register</h3>
        <div class="hint">Password: min 15 chars, no composition rules, checked against breach list</div>
        <label>Email</label>
        <input id="c-reg-email" value="customer@test.com" />
        <label>Password</label>
        <input id="c-reg-pass" type="password" value="MySecurePassword123!" />
        <button onclick="customerRegister()">Register</button>
        <div id="c-reg-result"></div>
      </div>

      <div class="section">
        <h3>2. Confirm email</h3>
        <div class="hint">Check the email log on the right for the 6-digit code</div>
        <label>Email</label>
        <input id="c-conf-email" value="customer@test.com" />
        <label>Confirmation code</label>
        <input id="c-conf-code" placeholder="123456" />
        <button onclick="customerConfirm()">Confirm</button>
        <div id="c-conf-result"></div>
      </div>

      <div class="section">
        <h3>3. Login</h3>
        <label>Email</label>
        <input id="c-login-email" value="customer@test.com" />
        <label>Password</label>
        <input id="c-login-pass" type="password" value="MySecurePassword123!" />
        <button onclick="customerLogin()">Login</button>
        <div id="c-login-result"></div>
      </div>
    </div>

    <!-- PROVIDER TAB -->
    <div class="tab-content" id="tab-provider">
      <div class="section">
        <h3>1. Create provider account</h3>
        <div class="hint">Password: min 8 chars (AAL2 uses MFA), pre-confirmed email</div>
        <label>Email</label>
        <input id="p-reg-email" value="provider@test.com" />
        <label>Password</label>
        <input id="p-reg-pass" type="password" value="Provider1!" />
        <button onclick="providerRegister()">Create account</button>
        <div id="p-reg-result"></div>
      </div>

      <div class="section">
        <h3>2. Enroll TOTP</h3>
        <div class="hint">Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.)</div>
        <label>User ID</label>
        <input id="p-totp-uid" placeholder="(from step 1)" />
        <button onclick="providerEnrollTOTP()">Enroll TOTP</button>
        <div id="p-totp-result"></div>
        <div class="qr-container" id="p-qr"></div>
      </div>

      <div class="section">
        <h3>3. Login (password + TOTP)</h3>
        <label>Email</label>
        <input id="p-login-email" value="provider@test.com" />
        <label>Password</label>
        <input id="p-login-pass" type="password" value="Provider1!" />
        <label>TOTP code</label>
        <input id="p-login-totp" placeholder="123456" />
        <button onclick="providerLogin()">Login</button>
        <div id="p-login-result"></div>
      </div>
    </div>

    <!-- VERIFICATION TAB -->
    <div class="tab-content" id="tab-verification">
      <div class="section">
        <h3>1. Request third-party verification</h3>
        <div class="hint">Sends a verification email to an institutional contact</div>
        <label>Contact email (at institution)</label>
        <input id="v-contact" value="compliance@university.edu" />
        <label>Customer name</label>
        <input id="v-name" value="Alice Researcher" />
        <label>Institution</label>
        <input id="v-inst" value="MIT" />
        <button onclick="requestVerification()">Send request</button>
        <div id="v-req-result"></div>
      </div>

      <div class="section">
        <h3>2. Check status</h3>
        <label>Verification ID</label>
        <input id="v-check-id" placeholder="(from step 1)" />
        <button onclick="checkVerificationStatus()">Check status</button>
        <div id="v-check-result"></div>
      </div>

      <div class="section">
        <h3>3. Respond (as institutional contact)</h3>
        <div class="hint">Simulates the contact clicking confirm/deny in their email</div>
        <label>Verification token</label>
        <input id="v-resp-token" placeholder="(from email log)" />
        <button class="green" onclick="respondVerification('confirmed')">Confirm</button>
        <button class="red" onclick="respondVerification('denied')">Deny</button>
        <div id="v-resp-result"></div>
      </div>
    </div>

    <!-- PASSWORD TAB -->
    <div class="tab-content" id="tab-password">
      <div class="section">
        <h3>Password strength + breach check</h3>
        <div class="hint">Tests against NIST SP 800-63B-4 rules and Have I Been Pwned</div>
        <label>Password to test</label>
        <input id="pw-test" type="text" value="password123" />
        <label>AAL level</label>
        <select id="pw-aal" style="width:100%;padding:7px;font-family:var(--font);font-size:13px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);margin-bottom:8px;">
          <option value="AAL1">AAL1 (customer, min 15 chars)</option>
          <option value="AAL2">AAL2 (provider, min 8 chars)</option>
        </select>
        <button onclick="checkPassword()">Check</button>
        <div id="pw-result"></div>
      </div>
    </div>

    <!-- SESSION MANAGEMENT -->
    <div class="section" style="margin-top:12px;">
      <h3>Active sessions</h3>
      <div id="sessions-list"><span class="hint">Login to see sessions here</span></div>
    </div>
  </div>

  <!-- Right panel: email log -->
  <div class="panel">
    <h2>Email log</h2>
    <div class="hint">Emails sent by the system (captured in memory, not actually delivered)</div>
    <div id="emailLog"><span class="hint">No emails sent yet</span></div>
  </div>
</main>

<script>
// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let activeSessions = [];

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------
function switchMain(tab) {
  document.querySelectorAll("#mainTabs button").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");
  document.getElementById("tab-" + tab).classList.add("active");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function showResult(elId, data) {
  const el = document.getElementById(elId);
  const isError = data.success === false || data.error || data.valid === false;
  const isInfo = data.valid !== undefined && !isError;
  el.className = "result " + (isError ? "err" : isInfo ? "info" : "ok");
  el.textContent = JSON.stringify(data, null, 2);
}

function time() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

// ---------------------------------------------------------------------------
// Customer auth
// ---------------------------------------------------------------------------
async function customerRegister() {
  const email = document.getElementById("c-reg-email").value;
  const password = document.getElementById("c-reg-pass").value;
  const result = await api("/api/customer/register", { email, password });
  showResult("c-reg-result", result);
  if (result.success) refreshEmails();
}

async function customerConfirm() {
  const email = document.getElementById("c-conf-email").value;
  const code = document.getElementById("c-conf-code").value;
  const result = await api("/api/customer/confirm", { email, code });
  showResult("c-conf-result", result);
}

async function customerLogin() {
  const email = document.getElementById("c-login-email").value;
  const password = document.getElementById("c-login-pass").value;
  const result = await api("/api/customer/login", { email, password });
  showResult("c-login-result", result);
  if (result.success && result.session) {
    activeSessions.push({ ...result.session, role: "customer", email });
    renderSessions();
  }
}

// ---------------------------------------------------------------------------
// Provider auth
// ---------------------------------------------------------------------------
async function providerRegister() {
  const email = document.getElementById("p-reg-email").value;
  const password = document.getElementById("p-reg-pass").value;
  const result = await api("/api/provider/register", { email, password });
  showResult("p-reg-result", result);
  if (result.success && result.userId) {
    document.getElementById("p-totp-uid").value = result.userId;
  }
}

async function providerEnrollTOTP() {
  const userId = document.getElementById("p-totp-uid").value;
  const result = await api("/api/provider/enroll-totp", { userId });
  if (result.success) {
    showResult("p-totp-result", { secret: result.secret, uri: result.uri });
    document.getElementById("p-qr").innerHTML =
      '<img src="' + result.qrCodeDataUrl + '" width="200" height="200" />' +
      '<div style="margin-top:6px;font-size:11px;color:var(--text2)">Secret: ' + result.secret + '</div>';
  } else {
    showResult("p-totp-result", result);
  }
}

async function providerLogin() {
  const email = document.getElementById("p-login-email").value;
  const password = document.getElementById("p-login-pass").value;
  const totpCode = document.getElementById("p-login-totp").value;
  const result = await api("/api/provider/login", { email, password, totpCode });
  showResult("p-login-result", result);
  if (result.success && result.session) {
    activeSessions.push({ ...result.session, role: "provider", email });
    renderSessions();
  }
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------
async function requestVerification() {
  const contactEmail = document.getElementById("v-contact").value;
  const customerName = document.getElementById("v-name").value;
  const institution = document.getElementById("v-inst").value;
  const result = await api("/api/verification/request", { contactEmail, customerName, institution });
  showResult("v-req-result", result);
  if (result.verificationId) {
    document.getElementById("v-check-id").value = result.verificationId;
    document.getElementById("v-resp-token").value = result.token;
  }
  refreshEmails();
}

async function checkVerificationStatus() {
  const verificationId = document.getElementById("v-check-id").value;
  const result = await api("/api/verification/status", { verificationId });
  showResult("v-check-result", result);
}

async function respondVerification(decision) {
  const token = document.getElementById("v-resp-token").value;
  const result = await api("/api/verification/respond", { token, decision });
  showResult("v-resp-result", result);
}

// ---------------------------------------------------------------------------
// Password check
// ---------------------------------------------------------------------------
async function checkPassword() {
  const password = document.getElementById("pw-test").value;
  const aal = document.getElementById("pw-aal").value;
  const result = await api("/api/password/check", { password, aal });
  showResult("pw-result", result);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
function renderSessions() {
  const el = document.getElementById("sessions-list");
  if (!activeSessions.length) {
    el.innerHTML = '<span class="hint">No active sessions</span>';
    return;
  }
  el.innerHTML = activeSessions.map((s, i) =>
    '<div class="session-card">' +
      '<div>' +
        '<span class="badge ' + s.aal.toLowerCase() + '">' + s.aal + '</span> ' +
        '<span>' + (s.email || s.userId) + '</span>' +
      '</div>' +
      '<div class="meta">' +
        '<span>' + s.id.slice(0, 12) + '...</span> ' +
        '<button class="small" onclick="validateSession(' + i + ')">Validate</button>' +
        '<button class="small red" onclick="logoutSession(' + i + ')">Logout</button>' +
      '</div>' +
    '</div>'
  ).join("");
}

async function validateSession(idx) {
  const s = activeSessions[idx];
  const result = await api("/api/session/validate", { sessionId: s.id });
  if (result.valid) {
    alert("Session valid\\n\\nAAL: " + result.session.aal +
      "\\nExpires: " + new Date(result.session.expiresAt).toLocaleString() +
      "\\nCSRF token: " + (result.csrfToken || "").slice(0, 16) + "...");
  } else {
    alert("Session invalid or expired");
    activeSessions.splice(idx, 1);
    renderSessions();
  }
}

async function logoutSession(idx) {
  const s = activeSessions[idx];
  await api("/api/session/logout", { sessionId: s.id });
  activeSessions.splice(idx, 1);
  renderSessions();
}

// ---------------------------------------------------------------------------
// Email log
// ---------------------------------------------------------------------------
async function refreshEmails() {
  const res = await fetch("/api/emails");
  const emails = await res.json();
  const el = document.getElementById("emailLog");
  if (!emails.length) {
    el.innerHTML = '<span class="hint">No emails sent yet</span>';
    return;
  }
  el.innerHTML = emails.map((e, i) => {
    // Extract confirmation code if present
    const codeMatch = e.textBody.match(/code is: (\\d{6})/);
    const tokenMatch = e.textBody.match(/token: ([a-f0-9]{64})/);

    return '<div class="log">' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">' +
        '<span class="tag email">Email #' + (i + 1) + '</span>' +
        '<strong>' + esc(e.subject) + '</strong>' +
      '</div>' +
      '<div style="margin-left:4px">' +
        '<div><span style="color:var(--text2)">To:</span> ' + esc(e.to) + '</div>' +
        '<div><span style="color:var(--text2)">From:</span> ' + esc(e.from) + '</div>' +
        (codeMatch ? '<div style="margin-top:4px;font-size:14px;font-weight:700;color:var(--green)">Code: ' + codeMatch[1] + ' <button class="small" onclick="document.getElementById(\\'c-conf-code\\').value=\\'' + codeMatch[1] + '\\'">Copy to form</button></div>' : '') +
        (tokenMatch ? '<div style="margin-top:4px;font-size:11px;color:var(--orange);word-break:break-all">Token: ' + tokenMatch[1].slice(0, 24) + '...</div>' : '') +
        '<details style="margin-top:4px"><summary style="cursor:pointer;font-size:11px;color:var(--text2)">Full body</summary><pre style="font-size:11px;margin-top:4px;white-space:pre-wrap;color:var(--text2)">' + esc(e.textBody) + '</pre></details>' +
      '</div>' +
    '</div>';
  }).join("");
}

function esc(s) { return s ? s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : ""; }

// Initial state
renderSessions();
</script>

</body>
</html>
`;
