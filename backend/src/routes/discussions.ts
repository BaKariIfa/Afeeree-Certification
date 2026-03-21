import { Hono } from "hono";
import { join } from "path";
import { randomUUID } from "crypto";

const discussionsRouter = new Hono();
const DATA_FILE = join(import.meta.dir, "../../data/discussions.json");

interface DiscussionReply {
  id: string;
  authorName: string;
  isAdmin: boolean;
  text: string;
  postedAt: string;
}

interface DiscussionPost {
  id: string;
  moduleId: string;
  lessonIndex: number;
  participantCode: string;
  participantName: string;
  question: string;
  postedAt: string;
  replies: DiscussionReply[];
}

async function readPosts(): Promise<DiscussionPost[]> {
  try {
    const data = JSON.parse(await Bun.file(DATA_FILE).text());
    return data.posts ?? [];
  } catch {
    return [];
  }
}

async function writePosts(posts: DiscussionPost[]) {
  await Bun.write(DATA_FILE, JSON.stringify({ posts }, null, 2));
}

// GET all posts (optionally filtered by moduleId & lessonIndex)
discussionsRouter.get("/", async (c) => {
  const moduleId = c.req.query("moduleId");
  const lessonIndex = c.req.query("lessonIndex");
  let posts = await readPosts();
  if (moduleId) posts = posts.filter((p) => p.moduleId === moduleId);
  if (lessonIndex !== undefined)
    posts = posts.filter((p) => p.lessonIndex === parseInt(lessonIndex));
  return c.json(posts);
});

// POST a new question
discussionsRouter.post("/", async (c) => {
  const body = await c.req.json<{
    moduleId: string;
    lessonIndex: number;
    participantCode: string;
    participantName: string;
    question: string;
  }>();
  if (!body.moduleId || !body.question?.trim())
    return c.json({ error: "Missing required fields" }, 400);

  const posts = await readPosts();
  const post: DiscussionPost = {
    id: randomUUID(),
    moduleId: body.moduleId,
    lessonIndex: body.lessonIndex,
    participantCode: body.participantCode,
    participantName: body.participantName,
    question: body.question.trim(),
    postedAt: new Date().toISOString(),
    replies: [],
  };
  posts.push(post);
  await writePosts(posts);
  return c.json(post, 201);
});

// POST a reply to a post
discussionsRouter.post("/:postId/reply", async (c) => {
  const postId = c.req.param("postId");
  const body = await c.req.json<{ authorName: string; isAdmin: boolean; text: string }>();
  if (!body.text?.trim()) return c.json({ error: "Missing text" }, 400);

  const posts = await readPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return c.json({ error: "Post not found" }, 404);

  const reply: DiscussionReply = {
    id: randomUUID(),
    authorName: body.authorName,
    isAdmin: body.isAdmin,
    text: body.text.trim(),
    postedAt: new Date().toISOString(),
  };
  post.replies.push(reply);
  await writePosts(posts);
  return c.json(reply, 201);
});

export { discussionsRouter };
