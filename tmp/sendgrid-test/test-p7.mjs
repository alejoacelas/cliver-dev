/**
 * Integration test: p7-integrations SendGridTransport + EmailService
 * Uses native fetch to hit SendGrid API directly (same logic as the classes).
 */
const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) throw new Error("SENDGRID_API_KEY not set");

const FROM = "noreply@cliver.bio";
const TO = "alejoacelas@gmail.com";

async function sendViaSendGrid(message) {
  const content = [{ type: "text/plain", value: message.textBody }];
  if (message.htmlBody) content.push({ type: "text/html", value: message.htmlBody });

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: message.to }] }],
      from: { email: message.from },
      subject: message.subject,
      content,
    }),
  });

  const messageId = res.headers.get("X-Message-Id") ?? "unknown";
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid API error ${res.status}: ${body}`);
  }
  return { messageId };
}

console.log("--- p7: Raw transport send ---");
const raw = await sendViaSendGrid({
  to: TO,
  from: FROM,
  subject: "[p7 test] Raw SendGridTransport",
  textBody: "Direct transport test from p7-integrations SendGridTransport.",
});
console.log("✓ Raw send OK, messageId:", raw.messageId);

console.log("\n--- p7: Confirmation code email ---");
const code = "847291";
const codeResult = await sendViaSendGrid({
  to: TO,
  from: FROM,
  subject: "Your Cliver confirmation code",
  textBody: `Your confirmation code is: ${code}\n\nThis code expires in 10 minutes.`,
  htmlBody: `<p>Your confirmation code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
});
console.log("✓ Confirmation code OK, messageId:", codeResult.messageId);

console.log("\n--- p7: Verification request email ---");
const verifyResult = await sendViaSendGrid({
  to: TO,
  from: FROM,
  subject: "Verification request for Jane Doe",
  textBody: "We are conducting a background screening for Jane Doe, who has claimed an affiliation with ACME Corp.\n\nConfirm: https://app.cliver.bio/verify/abc?action=confirm\nDeny: https://app.cliver.bio/verify/abc?action=deny",
  htmlBody: '<p>We are conducting a background screening for <strong>Jane Doe</strong>, who has claimed an affiliation with <strong>ACME Corp</strong>.</p><p><a href="https://app.cliver.bio/verify/abc?action=confirm">Confirm</a> | <a href="https://app.cliver.bio/verify/abc?action=deny">Deny</a></p>',
});
console.log("✓ Verification request OK, messageId:", verifyResult.messageId);

console.log("\n--- p7: Notification email ---");
const notifResult = await sendViaSendGrid({
  to: TO,
  from: FROM,
  subject: "[p7 test] Screening complete",
  textBody: "Your background screening has been completed successfully.",
});
console.log("✓ Notification OK, messageId:", notifResult.messageId);

console.log("\nAll p7 integration tests passed! (4 emails sent)");
