import { NextResponse, type NextRequest } from "next/server";
import { CLIENT_ID_COOKIE, CLIENT_ID_MAX_AGE } from "@/lib/client-id";

/** 첫 방문에 익명 ID 쿠키를 발급한다. 서버 컴포넌트는 쿠키를 못 쓰므로 여기서 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.get(CLIENT_ID_COOKIE)) {
    response.cookies.set({
      name: CLIENT_ID_COOKIE,
      value: crypto.randomUUID(),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CLIENT_ID_MAX_AGE,
    });
  }
  return response;
}

export const config = {
  // 정적 파일·이미지 최적화 경로는 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
