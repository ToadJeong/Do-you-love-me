# Android 홈 위젯 (D-Day) 통합 가이드

이 앱은 **웹은 그대로 두고**, 안드로이드에서는 Capacitor 웹뷰로 감싸 배포하고
홈 화면 위젯으로 D-Day를 띄우는 하이브리드 구조를 지원합니다.

## 데이터 흐름

```
웹뷰(Next.js Hero)  --@capacitor/preferences-->  SharedPreferences("CapacitorStorage", key="dday")
                                                              |
                                                              v
                                          DdayWidgetProvider (AppWidgetProvider)
                                          매 자정 AlarmManager로 갱신 → "D+N" 표시
```

- 웹 코드는 `src/lib/widgetSync.ts` 의 `syncDdayToWidget()` 로 `{startDate, dayCount}` 를
  네이티브 저장소에 기록합니다 (홈 화면 진입 시 자동 호출, 일반 웹에선 no-op).
- 위젯은 그 값을 읽어 **스스로 D+N 을 재계산**(앱을 안 열어도 정확)하고,
  배터리 절약을 위해 **자정에 한 번만** 새로고침합니다.

## 통합 절차

1. Capacitor 설치 및 안드로이드 플랫폼 추가
   ```bash
   npm i -D @capacitor/cli
   npm i @capacitor/core @capacitor/preferences
   npx cap add android
   ```
   - `capacitor.config.json` 의 `server.url` 을 실제 배포 주소(Vercel)로 바꾸세요.
     이렇게 하면 웹뷰가 원격 PWA를 그대로 로드합니다.

2. 위젯 소스 복사 (이 폴더 → 안드로이드 프로젝트)
   - `DdayWidgetProvider.kt` → `android/app/src/main/java/me/doyoulove/app/widget/`
   - `res/layout/dday_widget.xml` → `android/app/src/main/res/layout/`
   - `res/xml/dday_widget_info.xml` → `android/app/src/main/res/xml/`
   - 배경 드로어블 `dday_widget_bg`(둥근 모서리 + 브랜드 그라데이션)을
     `res/drawable/dday_widget_bg.xml` 로 추가 (예시는 아래).

3. `AndroidManifest.snippet.xml` 의 `<receiver>` 를
   `android/app/src/main/AndroidManifest.xml` 의 `<application>` 안에 병합.

4. 빌드/실행
   ```bash
   npm run build && npx cap sync android
   npx cap open android   # Android Studio에서 실행
   ```

5. 기기 홈 화면 → 위젯 추가 → "Do you love me" 선택.

## 예시: res/drawable/dday_widget_bg.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <corners android:radius="20dp" />
    <gradient
        android:startColor="#EF8F9B"
        android:endColor="#C8546B"
        android:angle="135" />
</shape>
```

## 위젯 디자인 변형

- `res/layout/dday_widget.xml` — 기본(소형 2x1).
- `res/layout/dday_widget_large.xml` — 대형(2x2, "Do you love me 💕" 캡션 포함).
  - `DdayWidgetProvider` 의 `RemoteViews(..., R.layout.dday_widget)` 를
    `R.layout.dday_widget_large` 로 바꾸면 큰 위젯이 됩니다.
  - 두 종류를 동시에 제공하려면 provider-info XML과 `<receiver>` 를 하나 더 추가하세요.

## 주의사항

- 위젯 UI는 HTML/CSS가 아니라 **안드로이드 네이티브(XML)** 입니다. 디자인은 위 XML에서 조정하세요.
- `@capacitor/preferences` 는 기본적으로 SharedPreferences 파일명 `CapacitorStorage` 를 사용합니다.
  `DdayWidgetProvider` 가 이 파일의 `dday` 키를 읽습니다 — 변경 시 양쪽을 함께 맞추세요.
- 위젯의 즉시 갱신이 필요하면, 데이터 기록 후 `APPWIDGET_UPDATE` 브로드캐스트를 보내도록
  커스텀 Capacitor 플러그인을 추가할 수 있습니다(선택).
