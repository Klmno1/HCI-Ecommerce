import { readFileSync, existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const baseDir = path.join(process.cwd(), "db", "Data", "images");

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const filename = segments.join("/");
  const fullPath = path.join(baseDir, filename);

  if (!existsSync(fullPath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const buffer = readFileSync(fullPath);
  const extension = path.extname(fullPath).toLowerCase();
  const contentType =
    extension === ".png"
      ? "image/png"
      : extension === ".jpg" || extension === ".jpeg"
        ? "image/jpeg"
        : extension === ".webp"
          ? "image/webp"
          : "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600"
    }
  });
}
