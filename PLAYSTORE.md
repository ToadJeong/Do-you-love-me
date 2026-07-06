# 럽노트 — Google Play 출시 체크리스트

코드로 준비된 것 ✅ / 콘솔·스튜디오에서 직접 해야 하는 것 🔲 으로 구분.

## 1. 기술 요건 (코드 완료)

- ✅ targetSdk 36 / compileSdk 36 (Play 최신 요건 충족, `android/variables.gradle`)
- ✅ 앱 이름 "럽노트", appId `me.doyoulove.app`
- ✅ **브랜드 어댑티브 아이콘** (벡터 하트 + 연핑크 배경) — API 26+ 자동 적용
- ✅ **브랜드 스플래시** (연베이지 + 하트)
- ✅ HTTPS 전용 (cleartext 금지), 위젯 알람은 inexact (특수 권한 불필요)
- ✅ 권한 최소화: INTERNET 만 사용
- ✅ **오프라인 화면**: 네트워크 없을 때 브랜드 안내 페이지 표시(웹뷰 스팸 정책 대응)
- 🔲 `capacitor.config.json` 의 `server.url` 을 **실제 배포 도메인**으로 변경 후
  `npx cap sync android`

## 2. 정책 필수 기능 (코드 완료)

- ✅ **개인정보처리방침**: `/privacy` (공개 URL — 콘솔 입력용)
- ✅ **이용약관**: `/terms`
- ✅ **앱 내 계정 삭제** (설정 → 위험 구역 → 계정 삭제) — Play 사용자 데이터 정책 필수
  - 웹 삭제 안내 URL(콘솔 "계정 삭제 URL"란): `https://<도메인>/privacy#delete`
  - ⚠️ 동작하려면 Vercel에 `SUPABASE_SERVICE_ROLE_KEY` 환경변수 필수
- ✅ 커플 연결 해제, 데이터 내보내기(JSON)

## 3. 서명 & 빌드 🔲

```bash
# 1) 업로드 키 생성 (한 번만, 안전 보관!)
keytool -genkey -v -keystore luvnote-upload.keystore \
  -alias luvnote -keyalg RSA -keysize 2048 -validity 10000

# 2) android/keystore.properties 생성 (gitignore 됨)
#    storeFile=../luvnote-upload.keystore
#    storePassword=... keyAlias=luvnote keyPassword=...
#    (build.gradle 에 signingConfig 연결 — Android Studio UI로도 가능)

# 3) AAB 빌드
cd android && ./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab
```

## 4. Play Console 등록 🔲

1. [play.google.com/console](https://play.google.com/console) — 개발자 계정($25, 1회)
2. 앱 만들기: 이름 "럽노트 - 커플 다이어리", 기본 언어 한국어, 앱/무료
3. **스토어 등록정보**: 짧은 설명(80자), 전체 설명, 스크린샷(폰 최소 2장 —
   배포된 웹을 폰에서 캡처), 앱 아이콘 512px, 피처 그래픽 1024×500
   (`design/brand-keyvisual.html` 활용 가능)
4. **개인정보처리방침 URL**: `https://<도메인>/privacy`
5. **데이터 보안 양식** — 아래대로 답변:
   - 수집: 이메일(계정 관리, 필수) / 사진·동영상(앱 기능) / 메시지(앱 기능) /
     사용자 생성 콘텐츠(앱 기능)
   - 모두 전송 중 암호화 ✅, 삭제 요청 가능 ✅ (앱 내 삭제 제공)
   - 제3자 공유 ❌, 광고 목적 수집 ❌
6. **콘텐츠 등급 설문**: 소셜/커뮤니케이션 → 사용자 간 메시지 교환 있음 →
   보통 "만 3세 이상"~"청소년" 등급
7. **대상 연령**: 18세 이상 권장(커플 서비스) 또는 13+ — 14세 미만 비대상 명시됨
8. **테스트 트랙**: 내부 테스트로 먼저 올려 두 계정으로 검증 → 프로덕션 승격

## 5. 출시 전 실기기 확인 🔲

- 로그인 → 커플 연결 → 홈 D-Day 표시
- 채팅 실시간(두 계정) + 이모티콘/게임/사진 전송
- 지도 핀치줌 / 위젯 D-Day / 다크모드 / 비행기모드에서 오프라인 화면
