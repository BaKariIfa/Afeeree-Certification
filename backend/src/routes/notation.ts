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

  async function fetchPdfBytes(fetchUrl: string): Promise<ArrayBuffer> {
    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf,*/*",
      },
      redirect: "follow",
    });
    console.log(`[notation] fetch status=${res.status} content-type=${res.headers.get("content-type")} url=${fetchUrl.substring(0, 100)}`);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
    return res.arrayBuffer();
  }

  let pdfBytes: ArrayBuffer;
  try {
    pdfBytes = await fetchPdfBytes(url);
    console.log(`[notation] fetched ${pdfBytes.byteLength} bytes`);

    // Check if we got HTML instead of PDF (Google Drive confirmation page)
    const firstBytes = Buffer.from(pdfBytes.slice(0, 5)).toString("utf8");
    if (!firstBytes.startsWith("%PDF")) {
      const html = Buffer.from(pdfBytes).toString("utf8");
      console.log(`[notation] got non-PDF response, first 500 chars:`, html.substring(0, 500));

      // Try to extract Google Drive confirm token
      const confirmMatch = html.match(/[?&]confirm=([^&"']+)/);
      const idMatch = url.match(/[?&]id=([^&]+)/);
      if (confirmMatch && idMatch) {
        const confirmToken = confirmMatch[1];
        const fileId = idMatch[1];
        const retryUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
        console.log(`[notation] retrying with confirm token: ${confirmToken}`);
        pdfBytes = await fetchPdfBytes(retryUrl);
        console.log(`[notation] retry fetched ${pdfBytes.byteLength} bytes`);
      } else {
        // Try the alternate export URL format
        const fileIdMatch = rawUrl!.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
        if (fileIdMatch) {
          const altUrl = `https://drive.usercontent.google.com/download?id=${fileIdMatch[1]}&export=download&confirm=t`;
          console.log(`[notation] trying alternate Google Drive URL`);
          pdfBytes = await fetchPdfBytes(altUrl);
          console.log(`[notation] alt fetch got ${pdfBytes.byteLength} bytes`);
        }
      }
    }
  } catch (err) {
    console.error(`[notation] fetch error:`, err);
    return c.text("Could not load notation file", 502);
  }

  let srcDoc: PDFDocument;
  try {
    srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    console.log(`[notation] parsed PDF, totalPages=${srcDoc.getPageCount()}`);
  } catch (parseErr) {
    // Still got HTML or invalid bytes
    console.error(`[notation] pdf-lib parse failed:`, parseErr);
    const preview = Buffer.from(pdfBytes.slice(0, 500)).toString("utf8");
    console.log(`[notation] response body preview:`, preview);
    return c.text("Could not parse notation file. The PDF may require authentication or the link may be restricted.", 502);
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
