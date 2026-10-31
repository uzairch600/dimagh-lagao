// Custom Next.js server: Next.js renders the app, Express serves /api, Socket.io runs live matches.
// A custom server is needed because 1v1 matches use websockets, which Next.js route handlers don't support.
import http from "node:http";
import next from "next";
import express from "express";
import { api, attachRealtime, startBackground } from "./server/api.js";

const port = Number(process.env.PORT || 3000);
const dev = !process.argv.includes("--prod");
process.env.NODE_ENV ??= dev ? "development" : "production";

const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
await nextApp.prepare();

const app = express();
app.use(api);
app.use((req, res) => handle(req, res));

const server = http.createServer(app);
attachRealtime(server);

// Socket.io handles its own upgrades; hand everything else (Next.js HMR in dev) to Next.
const nextUpgrade = nextApp.getUpgradeHandler();
server.on("upgrade", (req, socket, head) => {
  if (!req.url?.startsWith("/socket.io")) nextUpgrade(req, socket, head);
});

server.listen(port, () => {
  console.log(`\n  Dimagh Lagao: http://localhost:${port}  (${dev ? "development" : "production"})`);
  startBackground();
});
