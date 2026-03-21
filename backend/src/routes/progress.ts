import { Hono } from "hono";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const progressRouter = new Hono();

const ADMIN_PASSWORD = "BAKARI2024";
const DATA_DIR = join(process.cwd(), "data");
const PROGRESS_FILE = join(DATA_DIR, "progress.json");
const FEEDBACK_FILE = join(DATA_DIR, "feedback.json");

interface ParticipantProgress {
  code: string;
  name: string;
  email: string;
  completedLessons: string[];
  lessonStudyTime: Record<string, number>;
  lastSyncedAt: string;
}

interface FeedbackEntry {
  id: string;
  participantCode: string;
  moduleId?: string;
  message: string;
  instructorName: string;
  createdAt: string;
  readByParticipant: boolean;
}

type ProgressStore = Record<string, ParticipantProgress>;
type FeedbackStore = Record<string, FeedbackEntry[]>;

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readProgress(): ProgressStore {
  try {
    if (!existsSync(PROGRESS_FILE)) return {};
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8")) as ProgressStore;
  } catch {
    return {};
  }
}

function writeProgress(store: ProgressStore): void {
  ensureDataDir();
  writeFileSync(PROGRESS_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function readFeedback(): FeedbackStore {
  try {
    if (!existsSync(FEEDBACK_FILE)) return {};
    return JSON.parse(readFileSync(FEEDBACK_FILE, "utf-8")) as FeedbackStore;
  } catch {
    return {};
  }
}

function writeFeedback(store: FeedbackStore): void {
  ensureDataDir();
  writeFileSync(FEEDBACK_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// POST /api/progress/sync — participant syncs their progress
progressRouter.post("/sync", async (c) => {
  try {
    const body = await c.req.json() as {
      code: string;
      name: string;
      email: string;
      completedLessons: string[];
      lessonStudyTime: Record<string, number>;
    };
    if (!body.code) return c.json({ error: "Missing code" }, 400);
    const store = readProgress();
    store[body.code] = {
      code: body.code,
      name: body.name || "Participant",
      email: body.email || "",
      completedLessons: body.completedLessons || [],
      lessonStudyTime: body.lessonStudyTime || {},
      lastSyncedAt: new Date().toISOString(),
    };
    writeProgress(store);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Failed to sync" }, 500);
  }
});

// GET /api/progress/all — admin gets all participants' progress
progressRouter.get("/all", (c) => {
  const password = c.req.header("x-admin-password");
  if (password?.toUpperCase() !== ADMIN_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const store = readProgress();
  const participants = Object.values(store).sort(
    (a, b) => new Date(b.lastSyncedAt).getTime() - new Date(a.lastSyncedAt).getTime()
  );
  return c.json({ participants });
});

// POST /api/progress/feedback — admin posts feedback for a participant
progressRouter.post("/feedback", async (c) => {
  const password = c.req.header("x-admin-password");
  if (password?.toUpperCase() !== ADMIN_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const body = await c.req.json() as {
      participantCode: string;
      moduleId?: string;
      message: string;
      instructorName: string;
    };
    if (!body.participantCode || !body.message) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    const store = readFeedback();
    const entry: FeedbackEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      participantCode: body.participantCode,
      moduleId: body.moduleId,
      message: body.message,
      instructorName: body.instructorName || "Instructor",
      createdAt: new Date().toISOString(),
      readByParticipant: false,
    };
    const existing = store[body.participantCode] ?? [];
    store[body.participantCode] = [entry, ...existing];
    writeFeedback(store);
    return c.json({ success: true, feedback: entry });
  } catch {
    return c.json({ error: "Failed to save feedback" }, 500);
  }
});

// GET /api/progress/feedback/:code — participant fetches their own feedback
progressRouter.get("/feedback/:code", (c) => {
  const code = c.req.param("code");
  const accessCode = c.req.header("x-access-code");
  const adminPass = c.req.header("x-admin-password");
  const isAdmin = adminPass?.toUpperCase() === ADMIN_PASSWORD;
  const isParticipant = accessCode === code;
  if (!isAdmin && !isParticipant) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const store = readFeedback();
  const feedback = store[code] ?? [];
  // Mark as read by participant if they're accessing
  if (isParticipant) {
    const updated = feedback.map((f) => ({ ...f, readByParticipant: true }));
    store[code] = updated;
    writeFeedback(store);
  }
  return c.json({ feedback });
});

// GET /api/progress/unread-feedback/:code — count unread feedback for participant
progressRouter.get("/unread-feedback/:code", (c) => {
  const code = c.req.param("code");
  const accessCode = c.req.header("x-access-code");
  if (accessCode !== code) return c.json({ count: 0 });
  const store = readFeedback();
  const feedback = store[code] ?? [];
  const count = feedback.filter((f) => !f.readByParticipant).length;
  return c.json({ count });
});

export { progressRouter };
