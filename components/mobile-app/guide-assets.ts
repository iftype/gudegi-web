/**
 * 실제 기기 캡처를 받으면 각 항목에 `/guide/...webp` 경로만 넣으면 됩니다.
 * null인 동안에는 레이아웃이 깨지지 않도록 구데기 예시 화면을 사용합니다.
 */
export const GUIDE_SCREENSHOTS: Record<"ios" | "android", Array<string | null>> = {
  ios: [
    null, // Safari 공유 버튼
    null, // 홈 화면에 추가
    null  // 구데기 알림 허용
  ],
  android: [
    null, // Chrome 메뉴
    null, // 앱 설치
    null  // 구데기 알림 허용
  ]
};
