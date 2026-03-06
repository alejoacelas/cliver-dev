import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";

/**
 * A minimal HTTP stub server for testing. Registers route handlers
 * and responds to requests. Routes match on "METHOD /path".
 */
export type RouteHandler = (
  req: IncomingMessage,
  body: string,
) => { status: number; headers?: Record<string, string>; body?: string };

export interface StubServer {
  url: string;
  server: Server;
  addRoute(method: string, path: string, handler: RouteHandler): void;
  /** Remove all registered routes. Call in beforeEach to prevent leaks between tests. */
  clearRoutes(): void;
  /** Returns all requests received as { method, path, headers, body }. */
  requests: Array<{
    method: string;
    path: string;
    headers: Record<string, string | string[] | undefined>;
    body: string;
  }>;
  close(): Promise<void>;
}

export async function createStubServer(): Promise<StubServer> {
  const routes = new Map<string, RouteHandler>();
  const requests: StubServer["requests"] = [];

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      const method = req.method ?? "GET";
      const urlObj = new URL(req.url ?? "/", `http://localhost`);
      const path = urlObj.pathname;

      requests.push({
        method,
        path,
        headers: req.headers as Record<string, string | string[] | undefined>,
        body,
      });

      const key = `${method} ${path}`;
      const handler = routes.get(key);

      if (handler) {
        const result = handler(req, body);
        res.writeHead(result.status, result.headers ?? {});
        res.end(result.body ?? "");
      } else {
        res.writeHead(404);
        res.end(`No stub route for ${key}`);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as { port: number };
      resolve({
        url: `http://127.0.0.1:${addr.port}`,
        server,
        requests,
        addRoute(method: string, path: string, handler: RouteHandler) {
          routes.set(`${method} ${path}`, handler);
        },
        clearRoutes() {
          routes.clear();
        },
        async close() {
          return new Promise<void>((res, rej) =>
            server.close((err) => (err ? rej(err) : res())),
          );
        },
      });
    });
  });
}
