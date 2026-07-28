# 치지직 방송 타임라인 웹

`/admin`은 Oracle API의 관리자 세션을 같은 출처 프록시로 연결하는 비공개 관제 화면입니다.
서버/SQLite 용량, 수집 신선도, 연결 공백과 등록 채널을 확인할 수 있습니다.

여러 치지직 스트리머의 다시보기 달력과 방송 중 카테고리·방제 변경 이력을
확인하고 PWA 푸시 알림을 설정하는 공개 Next.js 애플리케이션입니다.

채팅과 19세 방송은 수집하거나 표시하지 않습니다.

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

- `dev`: Vercel Preview 배포, 운영 API `https://sub.iftype.store` 사용
- `main`: Vercel Production 배포, 운영 API `https://sub.iftype.store` 사용

서버는 Oracle에서 운영 인스턴스 하나만 실행합니다. Vercel 프로젝트의 Production Branch는
`main`으로 두고, 기능은 `dev` Preview에서 같은 API를 대상으로 검증한 뒤 `main`에 병합합니다.
