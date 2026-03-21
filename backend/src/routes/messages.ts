import { Hono } from "hono";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const messagesRouter = new Hono();

const ADMIN_PASSWORD = "BAKARI2024";
const DATA_DIR = join(process.cwd(), "data");
const MESSAGES_FILE = join(DATA_DIR, "messages.json");

interface Message {
  id: string;
  senderId: "participant" | "admin";
  senderName: string;
  text: string;
  timestamp: string;
  readByAdmin: boolean;
  readByParticipant: boolean;
  mediaUrl?: string;
  mediaType?: "audio" | "video";
}

type MessagesStore = Record<string, Message[]>;

function readMessages(): MessagesStore {
  try {
    if (!existsSync(MESSAGES_FILE)) return {};
    return JSON.parse(readFileSync(MESSAGES_FILE, "utf-8")) as MessagesStore;
  } catch {
    return {};
  }
}

function writeMessages(store: MessagesStore): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(MESSAGES_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// GET /api/messages/unread-count — total unread messages for admin (admin only)
messagesRouter.get("/unread-count", (c) => {
  const password = c.req.header("x-admin-password");
  if (password?.toUpperCase() !== ADMIN_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const store = readMessages();
  let total = 0;
  for (const msgs of Object.values(store)) {
    total += msgs.filter((m) => !m.readByAdmin && m.senderId === "participant").length;
  }
  return c.json({ count: total });
});

// GET /api/messages/unread-counts — per-conversation unread counts (admin only)
messagesRouter.get("/unread-counts", (c) => {
  const password = c.req.header("x-admin-password");
  if (password?.toUpperCase() !== ADMIN_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const store = readMessages();
  const counts: Record<string, number> = {};
  for (const [code, msgs] of Object.entries(store)) {
    counts[code] = msgs.filter((m) => !m.readByAdmin && m.senderId === "participant").length;
  }
  return c.json({ counts });
});

// GET /api/messages/:code — get all messages for a conversation
messagesRouter.get("/:code", (c) => {
  const code = c.req.param("code").toUpperCase();
  const store = readMessages();
  return c.json({ messages: store[code] ?? [] });
});

// POST /api/messages/:code — send a message
messagesRouter.post("/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const body = await c.req.json<{
    senderId: "participant" | "admin";
    senderName: string;
    text?: string;
    mediaUrl?: string;
    mediaType?: "audio" | "video";
  }>();

  const hasText = body.text?.trim();
  const hasMedia = body.mediaUrl && body.mediaType;
  if (!hasText && !hasMedia) return c.json({ error: "Empty message" }, 400);

  const store = readMessages();
  if (!store[code]) store[code] = [];

  const message: Message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    senderId: body.senderId,
    senderName: body.senderName ?? (body.senderId === "admin" ? "Admin" : "Participant"),
    text: body.text?.trim() ?? "",
    timestamp: new Date().toISOString(),
    readByAdmin: body.senderId === "admin",
    readByParticipant: body.senderId === "participant",
    ...(body.mediaUrl && { mediaUrl: body.mediaUrl }),
    ...(body.mediaType && { mediaType: body.mediaType }),
  };

  store[code].push(message);
  writeMessages(store);
  return c.json({ message });
});

// POST /api/messages/:code/read — mark conversation as read by admin
messagesRouter.post("/:code/read", (c) => {
  const code = c.req.param("code").toUpperCase();
  const password = c.req.header("x-admin-password");
  const store = readMessages();
  if (store[code]) {
    store[code] = store[code].map((m) => ({ ...m, readByAdmin: true }));
    writeMessages(store);
  }
  return c.json({ ok: true });
});

export { messagesRouter };
