import { Hono } from "hono";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const submissionsRouter = new Hono();

const DATA_DIR = join(process.cwd(), "data");
const SUBMISSIONS_FILE = join(DATA_DIR, "submissions.json");

export interface Submission {
  id: string;
  participantCode: string;
  participantName: string;
  assignmentTitle: string;
  type: "video" | "file" | "reflection";
  fileUrl?: string;
  fileName?: string;
  reflection?: string;
  submittedAt: string;
  notes?: string;
}

type SubmissionsStore = Submission[];

function readSubmissions(): SubmissionsStore {
  try {
    if (!existsSync(SUBMISSIONS_FILE)) return [];
    return JSON.parse(readFileSync(SUBMISSIONS_FILE, "utf-8")) as SubmissionsStore;
  } catch {
    return [];
  }
}

function writeSubmissions(store: SubmissionsStore): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SUBMISSIONS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// GET /api/submissions — get all submissions (instructor)
submissionsRouter.get("/", (c) => {
  const store = readSubmissions();
  // optionally filter by participantCode
  const code = c.req.query("code");
  if (code) {
    return c.json({ submissions: store.filter(s => s.participantCode.toUpperCase() === code.toUpperCase()) });
  }
  return c.json({ submissions: store });
});

// GET /api/submissions/my/:code — get submissions for a specific participant
submissionsRouter.get("/my/:code", (c) => {
  const code = c.req.param("code").toUpperCase();
  const store = readSubmissions();
  return c.json({ submissions: store.filter(s => s.participantCode === code) });
});

// POST /api/submissions — participant submits
submissionsRouter.post("/", async (c) => {
  const body = await c.req.json<{
    participantCode: string;
    participantName: string;
    assignmentTitle: string;
    type: "video" | "file" | "reflection";
    fileUrl?: string;
    fileName?: string;
    reflection?: string;
    notes?: string;
  }>();

  if (!body.participantCode || !body.assignmentTitle || !body.type) {
    return c.json({ error: "Missing required fields" }, 400);
  }
  if (body.type !== "reflection" && !body.fileUrl) {
    return c.json({ error: "fileUrl required for video/file submissions" }, 400);
  }
  if (body.type === "reflection" && !body.reflection?.trim()) {
    return c.json({ error: "reflection text required" }, 400);
  }

  const submission: Submission = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    participantCode: body.participantCode.toUpperCase(),
    participantName: body.participantName ?? "Participant",
    assignmentTitle: body.assignmentTitle,
    type: body.type,
    submittedAt: new Date().toISOString(),
    ...(body.fileUrl && { fileUrl: body.fileUrl }),
    ...(body.fileName && { fileName: body.fileName }),
    ...(body.reflection && { reflection: body.reflection }),
    ...(body.notes && { notes: body.notes }),
  };

  const store = readSubmissions();
  store.push(submission);
  writeSubmissions(store);
  return c.json({ submission }, 201);
});

// DELETE /api/submissions/:id — delete a submission (admin)
submissionsRouter.delete("/:id", (c) => {
  const id = c.req.param("id");
  const store = readSubmissions();
  const updated = store.filter(s => s.id !== id);
  writeSubmissions(updated);
  return c.json({ ok: true });
});

export { submissionsRouter };
