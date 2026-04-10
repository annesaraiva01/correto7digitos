import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { RenderInputProps } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ENTRY_POINT = path.resolve(PROJECT_ROOT, "src/index.ts");
const RENDERS_DIR = path.resolve(PROJECT_ROOT, "renders");
const PORT = Number(process.env.PORT || 3000);
const RENDER_TOKEN = process.env.RENDER_TOKEN || "change-me";
const BASE_URL = process.env.BASE_URL || "";

type JobStatus = "rendering" | "done" | "failed";
type RenderJob = {
  renderId: string;
  status: JobStatus;
  progress: number;
  composition: string;
  createdAt: string;
  outputPath: string | null;
  error: string | null;
};

const app = express();
const jobs = new Map<string, RenderJob>();
let bundlePromise: Promise<string> | null = null;

const ensureAuth = (auth?: string) => auth === `Bearer ${RENDER_TOKEN}`;
const getOrigin = (req: express.Request) => {
  if (BASE_URL) return BASE_URL.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  return `${proto}://${req.get("host")}`;
};
const getServeUrl = () => {
  if (!bundlePromise) {
    bundlePromise = bundle({ entryPoint: ENTRY_POINT, webpackOverride: (c) => c });
  }
  return bundlePromise;
};

const renderInBackground = async (job: RenderJob, inputProps: RenderInputProps, codec: string) => {
  try {
    await fs.mkdir(RENDERS_DIR, { recursive: true });
    const serveUrl = await getServeUrl();

    const composition = await selectComposition({
      serveUrl,
      id: job.composition,
      inputProps,
      chromeMode: "headless-shell",
      browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      logLevel: "error",
    });

    const outputLocation = path.join(RENDERS_DIR, `${job.renderId}.mp4`);

    await renderMedia({
      serveUrl,
      composition,
      codec: "h264",
      inputProps,
      outputLocation,
      concurrency: 1,
      logLevel: "error",
      chromeMode: "headless-shell",
      browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      onProgress: (p) => { job.progress = p.progress; },
    });

    job.progress = 1;
    job.status = "done";
    job.outputPath = `/renders/${job.renderId}.mp4`;
  } catch (error) {
    console.error("[remotion-renderer] render failed", error);
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Render failed";
  }
};

app.use(express.json({ limit: "2mb" }));
app.use("/renders", express.static(RENDERS_DIR));

// Auth middleware (skip OPTIONS and root health check)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  if (req.path === "/" && req.method === "GET") { next(); return; }
  if (!ensureAuth(req.header("authorization"))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

// Health check — no auth required
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "remotion-render-api",
    routes: ["/render", "/status"],
    composition: "faceless-video",
  });
});

// Start render
app.post("/render", (req, res) => {
  const { composition, inputProps, codec } = req.body as {
    composition?: string; inputProps?: RenderInputProps; codec?: string;
  };
  if (!composition || composition !== "faceless-video") {
    res.status(400).json({ error: "Invalid composition. Use 'faceless-video'." }); return;
  }
  if (!inputProps?.audioUrl || !Array.isArray(inputProps?.slides)) {
    res.status(400).json({ error: "audioUrl e slides sao obrigatorios." }); return;
  }

  const renderId = randomUUID();
  const job: RenderJob = {
    renderId, status: "rendering", progress: 0,
    composition, createdAt: new Date().toISOString(),
    outputPath: null, error: null,
  };
  jobs.set(renderId, job);
  void renderInBackground(job, inputProps, codec || "h264");
  res.json({ renderId, bucketName: null, status: "rendering" });
});

// Poll status
app.get("/status", (req, res) => {
  const renderId = String(req.query.renderId || "").trim();
  if (!renderId) { res.status(400).json({ error: "renderId is required" }); return; }

  const job = jobs.get(renderId);
  if (!job) { res.status(404).json({ error: "Render not found", renderId }); return; }

  res.json({
    renderId: job.renderId,
    status: job.status,
    done: job.status === "done",
    overallProgress: job.progress,
    outputFile: job.outputPath ? `${getOrigin(req)}${job.outputPath}` : null,
    error: job.error,
    errors: job.error ? [{ message: job.error }] : [],
    fatalErrorEncountered: job.status === "failed",
    createdAt: job.createdAt,
  });
});

app.listen(PORT, async () => {
  await fs.mkdir(RENDERS_DIR, { recursive: true });
  console.log(`[remotion-render-api] listening on http://0.0.0.0:${PORT}`);
  console.log("[remotion-render-api] pre-bundling Remotion composition...");
  try {
    await getServeUrl();
    console.log("[remotion-render-api] bundle ready!");
  } catch (err) {
    console.error("[remotion-render-api] bundle failed:", err);
  }
});
