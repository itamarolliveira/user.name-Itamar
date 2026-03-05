import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, "src");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

const server = http.createServer((req, res) => {
  const rawPath = req.url === "/" ? "index.html" : (req.url || "").replace(/^\/+/, "");
  const filePath = path.resolve(srcDir, rawPath);

  if (!filePath.startsWith(srcDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain; charset=utf-8" });
    res.end(data);
  });
});

const port = Number(process.env.PORT || 5173);
server.listen(port, () => {
  console.log(`Snake game running at http://localhost:${port}`);
});