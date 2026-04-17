import { CORS_HEADERS } from "@/lib/http/cors";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getRawApiKey(request: NextRequest): string | null {
  const direct = request.headers.get("x-api-key");
  if (direct?.trim()) return direct.trim();

  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  return m?.[1]?.trim() ?? null;
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405, headers: CORS_HEADERS }
    );
  }

  if (!getRawApiKey(request)) {
    return NextResponse.json(
      { error: "Missing x-api-key header" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/v1/social-proof-screenshot"]
};
