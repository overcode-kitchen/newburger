import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 디렉터리 등 다른 lockfile 때문에 추적 루트가 어긋나는 것을 막음
  outputFileTracingRoot: process.cwd(),
  images: {
    // 메뉴 이미지는 저장하지 않고 브랜드 원본 URL을 직접 참조한다.
    // 수집 브랜드가 늘면 여기에 도메인을 추가한다.
    remotePatterns: [
      // 디자인 시스템 프리뷰 샘플 이미지
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // 맥도날드 — 공개 API의 pcImageUrl 이 이 호스트를 가리킴
      {
        protocol: "https",
        hostname: "www.mcdonalds.co.kr",
        pathname: "/upload/**",
      },
      // 버거킹 — 트랜잭션 API 의 menuImgPath 호스트
      {
        protocol: "https",
        hostname: "mob-prd.burgerking.co.kr",
        pathname: "/images/**",
      },
      // 롯데리아 (롯데잇츠)
      {
        protocol: "https",
        hostname: "img.lotteeatz.com",
        pathname: "/upload/**",
      },
      // 맘스터치
      {
        protocol: "https",
        hostname: "momstouch.co.kr",
        pathname: "/upload_file/**",
      },
    ],
  },
};

export default nextConfig;
