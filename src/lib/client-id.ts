import { cookies } from "next/headers";

/**
 * 브라우저 익명 ID. 로그인 전 기록·후기의 주인.
 * middleware 가 첫 방문에 httpOnly 쿠키로 발급하고, 서버 액션·서버 컴포넌트는 여기서 읽기만 한다.
 * 쿠키 삭제·기기 변경으로 잃을 수 있다 — 그래서 개인화 기대치는 낮추고, 로그인은 "사진 잃지 않으려면"으로 유도한다 (Phase 3).
 */
export const CLIENT_ID_COOKIE = "nb_cid";
export const CLIENT_ID_MAX_AGE = 60 * 60 * 24 * 365;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getClientId(): Promise<string | null> {
  const value = (await cookies()).get(CLIENT_ID_COOKIE)?.value;
  return value && UUID.test(value) ? value : null;
}
