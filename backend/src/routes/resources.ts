import { Hono } from "hono";
import { join } from "path";

const resourcesRouter = new Hono();
const DATA_FILE = join(import.meta.dir, "../../data/resources.json");

async function readResources(): Promise<Record<string, string | null>> {
  try {
    const text = await Bun.file(DATA_FILE).text();
    return JSON.parse(text);
  } catch {
    return { notationPdfUrl: null, historyPdfUrl: null };
  }
}

async function writeResources(data: Record<string, string | null>) {
  await Bun.write(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all resource URLs
resourcesRouter.get("/", async (c) => {
  const data = await readResources();
  return c.json(data);
});

// PUT a single resource URL  e.g. { key: "historyPdfUrl", url: "https://..." }
resourcesRouter.put("/", async (c) => {
  const body = await c.req.json<{ key: string; url: string }>();
  if (!body.key || !body.url) {
    return c.json({ error: "Missing key or url" }, 400);
  }
  const data = await readResources();
  data[body.key] = body.url;
  await writeResources(data);
  return c.json({ ok: true, key: body.key, url: body.url });
});

export { resourcesRouter };
