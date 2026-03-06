# P5: Event routing and SSE

## What problem this solves

Cliver is a KYC (Know Your Customer) screening platform. When a screening runs, the backend performs multiple checks in sequence or in parallel: searching the web, querying sanctions databases, verifying email domains, and so on. These checks can take seconds to minutes. The user needs to see progress as it happens, not wait for everything to finish.

P5 solves the real-time communication problem: how does the backend push updates to the browser as they happen?

There are three types of users, each with different needs:

- **Customers** are the people being screened. They should see that a screening is happening and whether they need to give consent, but they should never see the detailed evidence or tool calls that the system is performing. When the screening finishes, they see only the final pass/flag decision with no supporting details.

- **Providers** are the compliance officers running the screening. They see everything: which checks are running, what evidence was found, what the AI determined for each criterion, and the full audit trail.

- **Debug** users (developers) see raw pipeline internals, including timing data, token counts, and internal state.

P5 is the layer that takes a stream of events from the backend, decides which events each user type is allowed to see, and delivers those events over the network in real time.

## How it works at a high level

The system has four components that work together:

### Event router (the filter)

When an event is produced by the backend pipeline, the event router decides whether a particular user should see it. For a customer, it blocks events like `tool_call` (which tool the AI is using), `tool_result` (what the tool returned), `delta` (streaming AI text), and `error` (internal errors). It lets through `status` messages ("Running identity check..."), consent requests, and a stripped-down version of the completion result that contains only the decision, not the evidence.

For a provider, everything passes through unmodified. For debug, everything passes through unmodified.

### Event bus (the switchboard)

The event bus is an in-memory publish/subscribe system. Think of it as a telephone switchboard: when the backend produces an event for screening session "abc-123", the bus delivers that event to every client that has subscribed to session "abc-123". Each subscriber also has a view filter (customer, provider, or debug), so the bus runs each event through the event router before delivering it.

Events for one screening session are completely isolated from events for another. If two different screenings are running simultaneously, subscribers to one session never see events from the other.

### SSE emitter (the server-side sender)

SSE (Server-Sent Events) is a standard web protocol where the server keeps an HTTP connection open and pushes text messages to the browser. Unlike WebSockets (which allow two-way communication), SSE is one-way: server to client only. This is exactly what is needed here, since the client only needs to receive updates, not send them.

The emitter takes events from an asynchronous generator (a programming pattern where values are produced one at a time, on demand) and writes them to the HTTP response in the SSE format: each event is written as `data: ` followed by the event encoded as JSON, followed by two newlines.

The emitter also sends periodic "heartbeat" comments (every 15 seconds) to keep the connection alive. Without heartbeats, network intermediaries like load balancers or proxies might close an idle connection, causing the client to lose its stream.

If the event generator encounters an error, the emitter sends an error event to the client before closing the connection. If the client disconnects (closes their browser tab, for example), the emitter stops consuming events from the generator.

### SSE client (the browser-side receiver)

The client connects to the SSE endpoint using the Fetch API (a built-in browser capability for making HTTP requests) and reads the response as a stream. It parses each `data: JSON` line, validates the structure against the known event schema, and calls a callback function with each valid event.

If the connection drops (network interruption, server restart), the client automatically reconnects with exponential backoff: it waits 500 milliseconds before the first retry, then 1 second, then 2 seconds, and so on, up to a maximum of 30 seconds between attempts. This prevents the client from flooding the server with reconnection attempts.

Malformed events (invalid JSON, missing required fields) are skipped and reported via an optional error callback, rather than crashing the client.

Calling `close()` on the connection terminates it cleanly: the underlying HTTP request is aborted, and no further events are delivered.

## Boundaries

P5 handles only the transport and filtering of events. It does not:

- Decide what events to produce (that is the pipeline's job, covered by other prototypes).
- Store events persistently (the audit logger handles that).
- Authenticate users or determine their role (the auth layer, P4, handles that). P5 trusts that it is told the correct view filter for each subscriber.
- Map pipeline events to SSE events (the mapping logic sits at the boundary between the pipeline and this layer).

The event bus is in-memory and single-process. If the server restarts, all subscriptions are lost and clients must reconnect. This is acceptable because SSE clients already handle reconnection, and the event bus is not a durable store. A future version could swap the in-memory bus for a Redis-backed pub/sub system without changing the rest of the code.
