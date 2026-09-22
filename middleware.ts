import { NextRequest, NextResponse } from "next/server";

const encoder = new TextEncoder();

function base64Url(bytes: ArrayBuffer) {
  const values = new Uint8Array(bytes);
  let binary = "";
  for (let index = 0; index < values.length; index += 1) binary += String.fromCharCode(values[index]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function validSession(token: string) {
  const [userId, role, expiresAt, signature, ...extra] = token.split(".");
  if (!userId || !role || !expiresAt || !signature || extra.length || !/^\d+$/.test(expiresAt)) return null;
  if (role !== "ADMIN" && role !== "CALLING_EXECUTIVE") return null;
  if (Number(expiresAt) < Math.floor(Date.now() / 1000)) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = base64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(`${userId}.${role}.${expiresAt}`)));
  if (expected !== signature) return null;
  return role;
}

export async function middleware(request: NextRequest) {
  const role = await validSession(request.cookies.get("dwa_session")?.value || "");
  if (!role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const { pathname } = request.nextUrl;
  if (["/analytics", "/duplicates", "/queue"].includes(pathname)) {
    return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin/dashboard" : "/executive/dashboard", request.url));
  }
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/") || ["/leads", "/follow-ups", "/executives", "/imports", "/activity", "/settings"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isExecutivePath = pathname === "/executive" || pathname.startsWith("/executive/");
  if (role === "ADMIN" && isExecutivePath) return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  if (role === "CALLING_EXECUTIVE" && isAdminPath) return NextResponse.redirect(new URL("/executive/dashboard", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|login|_next|favicon.ico).*)"],
};
