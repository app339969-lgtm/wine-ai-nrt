import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getDemoCredentials,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = (body.email || "").trim();
    const password = body.password || "";
    const demo = getDemoCredentials();

    if (email !== demo.email || password !== demo.password) {
      return NextResponse.json(
        { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" },
        { status: 401 },
      );
    }

    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";
    const token = await createSessionToken(email);
    const response = NextResponse.json({ ok: true, email });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถประมวลผลคำขอเข้าสู่ระบบได้" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
