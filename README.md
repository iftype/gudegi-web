# 치지직 방송 타임라인 웹

채팅 반응 밀도, 급증 구간, 반복 문구와 익명 대표 채팅을 탐색하는 공개 Next.js 애플리케이션입니다.

## 로컬 실행

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

서버는 기본적으로 `http://localhost:4000`을 사용합니다.

## 검증

```bash
pnpm check
```

## 배포

- `dev`: Vercel 개발 환경, `https://api-dev.chzzk.iftype.store`
- `main`: Vercel 운영 환경, `https://api.chzzk.iftype.store`

Vercel 프로젝트의 Production Branch는 `main`으로 두고 `dev`에 고정 Preview 도메인을 연결합니다.
