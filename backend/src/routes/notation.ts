import { Hono } from "hono";
import { PDFDocument, rgb, degrees } from "pdf-lib";

const notationRouter = new Hono();

// Serve a watermarked version of a PDF given its URL
notationRouter.get("/view", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    return c.text("Missing url parameter", 400);
  }

  let pdfBytes: ArrayBuffer;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
    pdfBytes = await res.arrayBuffer();
  } catch (err) {
    return c.text("Could not load notation file", 502);
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  } catch {
    // If pdf-lib can't parse it (e.g. it's an image), just stream it back
    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  }

  const pages = pdfDoc.getPages();
  const watermarkText = "AFeeree Certification Program — Confidential";

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Draw watermark multiple times across the page diagonally
    const positions = [
      { x: width * 0.5, y: height * 0.5 },
      { x: width * 0.25, y: height * 0.75 },
      { x: width * 0.75, y: height * 0.25 },
    ];

    for (const pos of positions) {
      page.drawText(watermarkText, {
        x: pos.x - 180,
        y: pos.y,
        size: 18,
        color: rgb(0.6, 0.35, 0.18),
        opacity: 0.18,
        rotate: degrees(40),
      });
    }
  }

  const watermarkedBytes = await pdfDoc.save();

  return new Response(watermarkedBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"notation.pdf\"",
      "Cache-Control": "no-store",
    },
  });
});

export { notationRouter };
