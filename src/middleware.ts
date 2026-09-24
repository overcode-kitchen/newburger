import { NextResponse, type NextRequest } from "next/server";
import { CLIENT_ID_COOKIE, CLIENT_ID_MAX_AGE } from "@/lib/client-id";

/**
 * 디자인 시스템 페이지는 컴포넌트 파일 목록과 수정 시각까지 뿌리는 내부 도구다.
 * 프로덕션에서만 닫는다 — 레이아웃에서 notFound() 를 호출하는 방식은 이 경로가 정적으로
 * 프리렌더되기 때문에 내용이 그대로 빌드 산출물에 남아 듣지 않는다. 요청 앞단에서 끊는다.
 *
 * NODE_ENV 가 아니라 VERCEL_ENV 로 가른다. 프리뷰 배포도 NODE_ENV=production 으로 빌드되므로
 * NODE_ENV 로 막으면 UX 확인용 프리뷰에서도 같이 사라진다.
 */
const INTERNAL_ONLY_PREFIX = "/design-system";

/** 첫 방문에 익명 ID 쿠키를 발급한다. 서버 컴포넌트는 쿠키를 못 쓰므로 여기서 */
export function middleware(request: NextRequest) {
  if (process.env.VERCEL_ENV === "production" && request.nextUrl.pathname.startsWith(INTERNAL_ONLY_PREFIX)) {
    return new NextResponse(null, { status: 404 });
  }

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
