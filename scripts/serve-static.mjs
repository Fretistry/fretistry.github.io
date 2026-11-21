// Serves the static website in `out/` the way GitHub Pages does, so the
// published version can be checked locally before pushing:
//   STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/fretistry npm run build
//   node scripts/serve-static.mjs [port] [base path]     → http://localhost:3200/fretistry/
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.argv[2] ?? 3200);
const base = (process.argv[3] ?? "/fretistry").replace(/\/$/, "");
const root = resolve(import.meta.dirname, "..", "out");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function send(res, status, file) {
  res.writeHead(status, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  if (path === "/" || path === base) {
    res.writeHead(302, { Location: `${base}/` });
    return res.end();
  }
  if (!path.startsWith(`${base}/`)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  let file = normalize(join(root, path.slice(base.length)));
  if (!file.startsWith(root)) {
    res.writeHead(403);
    return res.end();
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  else if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (existsSync(file)) return send(res, 200, file);
  return send(res, 404, join(root, "404.html"));
}).listen(port, () => console.log(`Static site: http://localhost:${port}${base}/`));
