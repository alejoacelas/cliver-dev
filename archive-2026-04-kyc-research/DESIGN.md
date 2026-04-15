# Cliver — KYC Verification Showcase Design Doc

## Motivation

A user-facing website that showcases the different automated tools you could have for KYC verification of DNA and nucleic acid synthesis orders. The central interface should show:

1. **Provider view** — what the verification process looks like from the provider/screening side.
2. **Customer view** — what the process looks like from the customer placing a synthesis order.
3. **Individual tool showcase** — a breakdown of each verification tool on its own. E.g., "here is identity verification with brief", "here is checking online presence", etc.

These are three different layouts or conceptual spaces the page should have.

Everything on the page should be really easy to orient towards — "what's this?" should be answered immediately. The default presentation is quite terse if you know what you're doing, but there should be more to understand or read or clarification in case you want it (hover/tooltip for additional context).

Response times should be as short as we can for many of these things. The user should not be left waiting without feedback. If a process takes longer than ~5 seconds, ideally we give them something — one option is recording how long the process has taken in the past and giving an estimated wait time, or some sort of rolling indicator that helps them track the time.

The website should be really intuitive. It should be helpful even for people that don't have that much context on KYC, but assuming some context on DNA and DNA orders.

## Design Decisions

- **Model:** Use Gemini 3 Flash (`google/gemini-3-flash-preview` on OpenRouter) for all AI-driven verification steps. Good turnaround time and performs well in testing.
- **Information density:** Default to terse, expert-friendly UI. Layer in explanatory context via hover/tooltips so newcomers can self-serve without cluttering the view for power users.
- **Progress feedback:** Any operation exceeding ~5 seconds should show progress. Options include historical average wait times, rolling progress indicators, or both.
- **Three-panel structure:** Provider view, customer view, and tool showcase as distinct sections/routes — each is its own conceptual space.
