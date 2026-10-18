# RemoteUpdate Frontend

프로젝트별 **초기 세팅 가이드**와 **업데이트 파일**을 배포하는 사내 시스템의 화면(Vue 3 SPA)입니다.

> Backend: [RemoteUpdateBackend](https://github.com/goshin1/RemoteUpdateBackend)

## 기술 스택

| 구분 | 사용 |
|---|---|
| 프레임워크 | Vue 3 (`<script setup>`) + TypeScript |
| 빌드 | Vite 8 |
| 라우팅 / 상태 | Vue Router 5 / Pinia 4 |
| HTTP | axios |
| 마크다운 | markdown-it (HTML 비활성으로 XSS 방지) |

## 빠른 시작 (개발)

Backend 를 먼저 실행해 두세요 (`http://localhost:8080`).

```powershell
npm install
npm run dev
```

- 접속: `http://localhost:5173`
- `/api` 요청은 Vite 가 `localhost:8080` 으로 전달합니다 (`vite.config.ts`). 브라우저 입장에서 같은 출처라 세션 쿠키·CSRF 가 그대로 동작하고 CORS 설정이 필요 없습니다.
- 최초 관리자: `admin@onpoom.co.kr` / `ChangeMe!2026` (첫 로그인 때 비밀번호 변경)

### 빌드

```powershell
npm run build      # 타입 검사(vue-tsc) + dist 폴더 생성
```

운영에서는 Backend 가 `dist` 폴더를 함께 제공합니다 (Backend 환경 변수 `FRONTEND_DIST`). 자세한 방법은 Backend 의 `docs/operations.md` 를 참고하세요.

## 화면

| 경로 | 화면 | 권한 |
|---|---|---|
| `/login` | 로그인 | 공개 |
| `/password` | 비밀번호 변경 (첫 로그인 시 강제) | 로그인 |
| `/projects` | 프로젝트 목록 | 로그인 |
| `/projects/:id` | 최신 버전, 가이드 목록, 업데이트 목록 | 로그인 |
| `/updates/:id` | 업데이트 상세, 다운로드, 체크섬 확인 / (개발자) 수정·배포 중단·변경 이력 | 로그인 |
| `/guides/:id` | 가이드 본문, 첨부 파일 | 로그인 |
| `/projects/:id/updates/new`, `/updates/:id/edit` | 업데이트 등록(업로드 진행률)·수정 | DEVELOPER |
| `/projects/:id/guides/new`, `/guides/:id/edit` | 가이드 작성(마크다운 미리보기)·첨부 교체 | DEVELOPER |
| `/downloads` | 다운로드 이력 (검색 조건이 주소에 저장됨) | DEVELOPER |
| `/projects/new`, `/projects/:id/edit` | 프로젝트 등록·수정 | ADMIN |
| `/admin/users` | 사용자 관리 (발급·역할·중지·비밀번호 초기화) | ADMIN |
| `/admin/allowed-ips` | 관리 기능 허용 IP | ADMIN |

메뉴·버튼 숨김과 라우터 가드는 **사용 편의**를 위한 것이고, 실제 권한 검사는 모두 Backend 가 합니다.

## 폴더 구조

```
src
├── api           Backend 호출 함수와 타입 (http.ts: axios 공통 설정)
├── stores        Pinia — 로그인 사용자(auth)
├── router        라우트와 이동 전 검사(로그인·비밀번호 변경·역할)
├── layouts       공통 레이아웃 (상단 메뉴, IP 안내 배너)
├── views         화면
├── components    공통 컴포넌트 (페이징, 상태 배지, 파일 선택, 업로드 진행률, 모달, 변경 이력 등)
├── composables   재사용 로직 (업로드 정책)
└── utils         날짜·크기 표시, 안전한 마크다운 변환
```

## 설계 메모

- **세션 쿠키 인증**: 로그인 상태는 서버 세션에 있고, `stores/auth.ts` 는 화면 표시용 사본입니다. 401 을 받으면 사본을 지우고 로그인 화면으로 이동하며, 돌아갈 주소를 기억합니다.
- **CSRF**: 상태 변경 요청 전에 `XSRF-TOKEN` 쿠키가 없으면 `/api/v1/auth/csrf` 로 먼저 받고, axios 가 `X-XSRF-TOKEN` 헤더로 자동 첨부합니다 (`api/http.ts`).
- **다운로드는 `<a href>`**: 최대 500MB 파일을 axios 로 받으면 브라우저 메모리에 통째로 올라가므로, 링크로 받아 브라우저가 디스크에 바로 저장하게 합니다.
- **마크다운 XSS 방지**: `utils/markdown.ts` 에서 HTML 태그를 글자로 처리하고 `javascript:` 링크를 막습니다. `v-html` 은 이 함수의 결과에만 씁니다.
- **오류 메시지**: Backend 의 `{ code, message }` 를 그대로 보여주고(`errorMessage()`), 특정 상황은 `code` 로 분기합니다.
