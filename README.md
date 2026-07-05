# Do you love me 💕

커플을 위한 **D-Day · 공유 캘린더 · 고화질 갤러리** 웹앱 (PWA).
PC 웹과 모바일을 하나의 코드베이스로 지원하며, 안드로이드는 추후 웹뷰로 감싸 출시할 수 있습니다.

## 기술 스택

- **Next.js 16** (App Router) · TypeScript · Tailwind CSS v4
- **Supabase** — 인증(Auth) + PostgreSQL(데이터) + RLS(행 수준 보안)
- **Cloudflare R2** — 사진/영상 등 대용량 미디어 저장 (S3 호환, Pre-signed URL 직접 업로드)
- zustand(상태) · date-fns(날짜) · lucide-react(아이콘) · @dnd-kit(드래그) · exifr(EXIF)

---

## 1. 사전 준비

### Supabase
1. [supabase.com](https://supabase.com) 에서 프로젝트 생성
2. **SQL Editor** 에 `supabase_schema.sql` 전체를 붙여넣고 실행
   - 4개 테이블(`couples`, `users`, `calendar_events`, `gallery_photos`) + RLS + 커플 연결 RPC가 생성됩니다.
   - 이미 한 번 실행했더라도, 파일 안의 `alter table ... add column if not exists` 덕분에 재실행해도 안전합니다(누락 컬럼 자동 추가).
3. **Authentication → Providers → Email** 활성화.
   - 테스트를 빠르게 하려면 **"Confirm email" 을 끄면** 가입 즉시 로그인됩니다.
4. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키를 복사.

### Cloudflare R2
1. R2 버킷 생성 (예: `dylm-media`)
2. **R2 → Manage API Tokens** 에서 Access Key ID / Secret Access Key 발급
3. 버킷 **Public access** 또는 커스텀 도메인/CDN을 연결하고 그 공개 URL을 확보
   (사진을 다시 읽을 때 사용 — `NEXT_PUBLIC_R2_PUBLIC_URL`)
4. **CORS 설정** (업로드/조회 시 필수). 버킷 Settings → CORS Policy:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://<your-app>.vercel.app"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
   > 배포 도메인이 확정되면 `AllowedOrigins` 에 실제 주소를 꼭 추가하세요. 안 하면 사진이 깨져 보입니다.

---

## 2. 환경 변수

루트에 `.env.local` 을 만들고 (`cp .env.local.example .env.local`) 아래를 채웁니다.

| 변수 | 위치 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | Supabase anon public 키 (노출되어도 RLS가 보호) |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** | (선택) 관리 작업용. 절대 클라이언트 노출 금지 |
| `R2_ACCESS_KEY_ID` | **서버 전용** | R2 Access Key |
| `R2_SECRET_ACCESS_KEY` | **서버 전용** | R2 Secret Key |
| `R2_ENDPOINT` | **서버 전용** | `https://<accountid>.r2.cloudflarestorage.com` |
| `R2_BUCKET_NAME` | **서버 전용** | 버킷 이름 |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | 클라이언트 | 업로드된 객체를 읽는 공개 베이스 URL |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 클라이언트 | 푸시 알림 VAPID 공개키 (`npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | **서버 전용** | 푸시 알림 VAPID 비밀키 |
| `VAPID_SUBJECT` | **서버 전용** | `mailto:` 연락처 (VAPID 식별자) |
| `CRON_SECRET` | **서버 전용** | 기념일 알림 cron 보호용 시크릿 (Vercel Cron이 Bearer로 전송) |

> `NEXT_PUBLIC_` 접두사가 붙은 값만 브라우저로 전달됩니다. R2 시크릿/Service Role 키에는 절대 붙이지 마세요.

---

## 3. 로컬 개발

```bash
npm install
npm run dev      # http://localhost:3000
```

빌드/검사:

```bash
npm run build    # 프로덕션 빌드 (타입체크 포함)
npm run lint     # ESLint
```

---

## 4. Vercel 배포

1. 이 저장소를 GitHub에 푸시 (이미 되어 있음)
2. [vercel.com](https://vercel.com) → **Add New → Project** → 저장소 선택
3. **Environment Variables** 에 위 표의 변수를 모두 입력
   (Supabase URL/anon, R2 4종, `NEXT_PUBLIC_R2_PUBLIC_URL`)
4. **Deploy**. 이후 `git push` 할 때마다 자동 재배포됩니다.
5. 배포 도메인이 나오면 **R2 CORS의 `AllowedOrigins`** 에 그 주소를 추가하세요.

> 로컬에선 되는데 배포본에서 에러가 나면 99% 환경 변수 누락입니다. Vercel → Settings → Environment Variables 를 먼저 확인하세요.

---

## 5. 폰에 설치하기 (PWA 테스트)

별도 앱스토어 등록 없이, 배포된 주소로 바로 설치형 테스트가 가능합니다.

1. 안드로이드 **Chrome** 으로 `https://<your-app>.vercel.app` 접속
2. 메뉴(⋮) → **앱 설치** 또는 **홈 화면에 추가**
3. 홈 화면에 아이콘이 생기고, 전체화면(standalone) 앱처럼 실행됩니다.
4. iOS는 **Safari → 공유 → 홈 화면에 추가**.

> 서비스 워커는 프로덕션 빌드에서만 등록됩니다(로컬 `dev` 에선 비활성). 즉 Vercel 배포본에서 설치/오프라인 캐싱이 동작합니다.

---

## 5-1. 네이티브 안드로이드 앱 (Capacitor)

웹뷰로 감싼 실제 APK/AAB. `android/` 네이티브 프로젝트가 이미 저장소에 포함되어 있고,
홈 화면 **D-Day 위젯**(`DdayWidgetProvider`)까지 통합돼 있습니다.

**전제:** Android Studio(+ JDK 17, Android SDK) 설치.

1. **접속 주소 설정** — `capacitor.config.json` 의 `server.url` 을 배포된 Vercel 주소로 변경
   (예: `https://our-love-app.vercel.app`). 이 앱은 원격 PWA를 웹뷰로 로드합니다.
2. **동기화 & 열기**
   ```bash
   npm install
   npx cap sync android
   npx cap open android      # 또는: cd android && ./gradlew assembleDebug
   ```
3. Android Studio에서 실행하면 앱이 설치됩니다.
4. **위젯**: 홈 화면 → 위젯 추가 → "Do you love me". 웹앱을 한 번 열어 로그인하면
   D-Day가 `@capacitor/preferences` 로 네이티브에 저장되어 위젯에 표시됩니다.

> **위젯 데이터 흐름**: 웹의 `syncDdayToWidget()` → SharedPreferences("CapacitorStorage")
> → `DdayWidgetProvider` 가 읽어 매 자정(AlarmManager) "D+N" 갱신.

> **푸시 알림 주의**: 현재 알림은 Web Push 기반입니다. 웹뷰 안에서는 불안정할 수 있으니
> 네이티브 앱에서 확실한 푸시가 필요하면 FCM + `@capacitor/push-notifications` 로 전환하세요.
> (테스트 단계에서는 PWA 설치본으로 푸시를 쓰는 걸 권장합니다.)

## 6. 사용 흐름

1. 회원가입/로그인 → **커플 만들기**(만난 날짜 입력) 또는 **초대 코드로 연결**
2. 홈에서 **D+OOO** 와 다가오는 기념일 확인
3. **캘린더** 에서 날짜를 눌러 일정/일기/할 일 추가 (PC는 우측 패널 + 드래그 정렬)
4. **갤러리** 에 사진 다중 업로드 (R2 직행, EXIF 촬영일 자동 인식)
5. **설정** 에서 프로필/배경 사진, 닉네임, 초대 코드 관리

---

## 폴더 구조 (요약)

```
src/
  app/
    (auth)/        로그인·회원가입 + 인증 액션
    (app)/         인증 후 화면 (사이드바/하단탭 셸): 홈·캘린더·갤러리·설정
    api/r2/presign R2 Pre-signed URL 발급 Route Handler
    onboarding/    커플 연결
    manifest.ts, icon-*/  PWA 매니페스트·아이콘
  components/      home·calendar·gallery·shell·pwa UI
  lib/            supabase 클라이언트, r2, dday, 데이터 헬퍼
  store/          zustand (user·calendar·gallery)
supabase_schema.sql  DB 스키마 + RLS + RPC
design/              브랜드 키비주얼(CI) HTML
```
