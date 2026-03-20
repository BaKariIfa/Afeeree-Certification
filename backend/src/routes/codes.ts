import { Hono } from "hono";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const codesRouter = new Hono();

const ADMIN_PASSWORD = "BAKARI2024";
const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "codes.json");
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface AccessCode {
  code: string;
  createdAt: string;
  usedBy: string | null;
  usedAt: string | null;
}

function readCodes(): AccessCode[] {
  try {
    if (!existsSync(DATA_FILE)) return [];
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as AccessCode[];
  } catch {
    return [];
  }
}

function writeCodes(codes: AccessCode[]): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(codes, null, 2), "utf-8");
}

function generateRandomCode(): string {
  let code = "AF-";
  for (let i = 0; i < 6; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

// GET /api/codes — list all codes (admin only)
codesRouter.get("/", (c) => {
  const password = c.req.header("x-admin-password");
  if (password?.toUpperCase() !== ADMIN_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json({ codes: readCodes() });
});

// POST /api/codes/generate — create a new code (admin only)
codesRouter.post("/generate", (c) => {
  const password = c.req.header("x-admin-password");
  if (password?.toUpperCase() !== ADMIN_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const codes = readCodes();
  const newCode: AccessCode = {
    code: generateRandomCode(),
    createdAt: new Date().toISOString(),
    usedBy: null,
    usedAt: null,
  };
  codes.push(newCode);
  writeCodes(codes);
  return c.json({ code: newCode.code });
});

// POST /api/codes/validate — check if a code is valid (public)
codesRouter.post("/validate", async (c) => {
  const body = await c.req.json<{ code?: string }>();
  const normalised = (body.code ?? "").toUpperCase().trim();
  const codes = readCodes();
  const found = codes.find((entry) => entry.code === normalised);
  const valid = found !== undefined && found.usedBy === null;
  return c.json({ valid });
});

// POST /api/codes/use — mark a code as used (public)
codesRouter.post("/use", async (c) => {
  const body = await c.req.json<{ code?: string; email?: string }>();
  const normalised = (body.code ?? "").toUpperCase().trim();
  const codes = readCodes();
  const idx = codes.findIndex((entry) => entry.code === normalised);
  if (idx === -1 || codes[idx]!.usedBy !== null) {
    return c.json({ error: "Code not found or already used" }, 400);
  }
  const existing = codes[idx]!;
  codes[idx] = {
    code: existing.code,
    createdAt: existing.createdAt,
    usedBy: body.email ?? "unknown",
    usedAt: new Date().toISOString(),
  };
  writeCodes(codes);
  return c.json({ ok: true });
});

// DELETE /api/codes/:code — delete a code (admin only)
codesRouter.delete("/:code", (c) => {
  const password = c.req.header("x-admin-password");
  if (password?.toUpperCase() !== ADMIN_PASSWORD) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const code = c.req.param("code").toUpperCase();
  writeCodes(readCodes().filter((entry) => entry.code !== code));
  return c.json({ ok: true });
});

export { codesRouter };
