/**
 * Integration test: p4-auth SendGridEmailTransport
 * Replicates the same fetch logic as the class.
 */
const API_KEY = process.env.SENDGRID_API_KEY;
if (!API_KEY) throw new Error("SENDGRID_API_KEY not set");

const FROM = "noreply@cliver.bio";
const TO = "alejoacelas@gmail.com";

console.log("--- p4: Auth email transport ---");
const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: TO }] }],
    from: { email: FROM },
    subject: "[p4 test] Auth confirmation code",
    content: [
      { type: "text/plain", value: "Your Cliver login code is: 529384\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email." },
      { type: "text/html", value: "<p>Your Cliver login code is: <strong>529384</strong></p><p>This code expires in 10 minutes. If you did not request this, please ignore this email.</p>" },
    ],
  }),
});

if (!res.ok) {
  const body = await res.text();
  throw new Error(`SendGrid API error ${res.status}: ${body}`);
}
const messageId = res.headers.get("X-Message-Id") ?? "unknown";
console.log("✓ p4 auth email sent OK, messageId:", messageId);

console.log("\nAll p4 integration tests passed! (1 email sent)");
