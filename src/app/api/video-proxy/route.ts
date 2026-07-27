import { NextRequest, NextResponse } from "next/server";

// GET /api/video-proxy?url=https://...
// Proxies video files to avoid CORS issues — streams directly, no memory buffering
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("url");

  if (!videoUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Eromusa/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch video" }, { status: 502 });
    }

    // Stream the response directly — no memory buffering
    const contentType = response.headers.get("content-type") || "video/mp4";
    const contentLength = response.headers.get("content-length");

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Video proxy error:", err);
    return NextResponse.json({ error: "Failed to proxy video" }, { status: 500 });
  }
}
