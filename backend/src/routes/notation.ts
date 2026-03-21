import { Hono } from "hono";
import { PDFDocument, rgb, degrees } from "pdf-lib";

const notationRouter = new Hono();

// Convert Google Drive view/sharing URLs to direct download URLs
function resolveDownloadUrl(url: string): string {
  // Handle: https://drive.google.com/file/d/{ID}/view?...
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
  }
  // Handle: https://drive.google.com/open?id={ID}
  const openMatch = url.match(/drive\.google\.com\/open\?.*id=([^&]+)/);
  if (openMatch) {
    return `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
  }
  return url;
}

// Serve a watermarked version of a PDF given its URL, optionally extracting a page range
notationRouter.get("/view", async (c) => {
  const rawUrl = c.req.query("url");
  const startPageParam = c.req.query("startPage");
  const endPageParam = c.req.query("endPage");
  // Legacy param kept for compatibility
  const maxPagesParam = c.req.query("maxPages");

  if (!rawUrl) {
    return c.text("Missing url parameter", 400);
  }

  const url = resolveDownloadUrl(rawUrl);

  let pdfBytes: ArrayBuffer;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    console.log(`[notation] fetch status=${res.status} content-type=${res.headers.get("content-type")} url=${url.substring(0, 80)}`);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
    pdfBytes = await res.arrayBuffer();
    console.log(`[notation] fetched ${pdfBytes.byteLength} bytes`);
  } catch (err) {
    console.error(`[notation] fetch error:`, err);
    return c.text("Could not load notation file", 502);
  }

  let srcDoc: PDFDocument;
  try {
    srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    console.log(`[notation] parsed PDF, totalPages=${srcDoc.getPageCount()}`);
  } catch (parseErr) {
    // Google Drive returned HTML (confirmation page) instead of PDF bytes
    console.error(`[notation] pdf-lib parse failed — likely got HTML instead of PDF:`, parseErr);
    // Try to follow the Google Drive confirm flow
    const html = Buffer.from(pdfBytes).toString("utf8").substring(0, 2000);
    console.log(`[notation] response body preview:`, html.substring(0, 500));
    return c.text("Could not parse notation file. The PDF may require authentication.", 502);
  }

  const totalPages = srcDoc.getPageCount();

  // Determine which pages to include (1-based from user, 0-based for pdf-lib)
  let firstPage = 1;
  let lastPage = totalPages;

  if (startPageParam) {
    const s = parseInt(startPageParam, 10);
    if (!isNaN(s) && s >= 1) firstPage = Math.min(s, totalPages);
  }

  if (endPageParam) {
    const e = parseInt(endPageParam, 10);
    if (!isNaN(e) && e >= firstPage) lastPage = Math.min(e, totalPages);
  } else if (maxPagesParam && !startPageParam) {
    // Legacy: maxPages limits from page 1
    const m = parseInt(maxPagesParam, 10);
    if (!isNaN(m) && m > 0) lastPage = Math.min(m, totalPages);
  }

  // Build a new document with only the requested pages
  const outDoc = await PDFDocument.create();
  const pageIndices: number[] = [];
  for (let i = firstPage - 1; i <= lastPage - 1; i++) {
    pageIndices.push(i);
  }
  const copiedPages = await outDoc.copyPages(srcDoc, pageIndices);
  copiedPages.forEach((p: import('pdf-lib').PDFPage) => outDoc.addPage(p));
  console.log(`[notation] extracted pages ${firstPage}-${lastPage} → ${copiedPages.length} pages in output PDF`);

  // Add watermark to every page
  const watermarkText = "AFeeree Certification Program — Confidential";
  for (const page of outDoc.getPages()) {
    const { width, height } = page.getSize();
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

  const watermarkedBytes = await outDoc.save();

  return new Response(watermarkedBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="notation-p${firstPage}-${lastPage}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});

export { notationRouter };
