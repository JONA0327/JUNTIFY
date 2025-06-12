import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET as string)
    );
    const username = (payload as any).username;
    if (username) {
      req.headers.set("X-Username", String(username));
    }
  } catch (err) {
    console.error("JWT verification failed", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next({ request: { headers: req.headers } });
}

export const config = {
  matcher: ["/api/:path*"],
};
