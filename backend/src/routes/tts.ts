import { Hono } from "hono";

const ttsRouter = new Hono();

ttsRouter.post("/", async (c) => {
  const body = await c.req.json<{ text?: string }>();
  const text = body?.text;

  if (!text || typeof text !== "string") {
    return c.json({ error: "text is required" }, 400);
  }

  const response = await fetch(
    `${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/audio/speech`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: "onyx",
        speed: 0.85,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("[TTS] OpenAI error:", err);
    return c.json({ error: "TTS generation failed" }, 500);
  }

  const audioBuffer = await response.arrayBuffer();
  return new Response(audioBuffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
});

export { ttsRouter };
