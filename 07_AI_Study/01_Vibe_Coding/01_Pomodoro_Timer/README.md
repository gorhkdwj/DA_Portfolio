# Pomodoro Timer

A modern, glassmorphic Pomodoro Timer built with React and Vite.

## Features

- Customizable Pomodoro intervals
- Dark mode/Glassmorphism UI
- Audio synthesis for alarms (No external files)
- Analytics Dashboard
- Localization (Korean/English)
- Multiple background themes

> **Design Acknowledgment**: The background themes, minimalist aesthetic, and visual layout inspiration for this application were borrowed from [mohakdev/focus-timer](https://github.com/mohakdev/focus-timer). We appreciate the open-source contribution!

## Setup

```bash
npm install
npm run dev
```

---

## 🤖 바이브 코딩 (Vibe Coding) 수행 기록

이 프로젝트는 코드를 직접 작성하는 대신, AI와의 대화와 프롬프트 엔지니어링만을 활용하여 초기 기획부터 데스크탑 앱 배포까지 완성한 **바이브 코딩(Vibe Coding)** 실험작입니다.

### 1. 초기 기획 및 설정 (Prompting & Scaffolding)

- **요구사항 정의**: 커스텀 가능한 포모도로 타이머, 통계 대시보드 그리고 최신 트렌드의 유리질감(Glassmorphism) 및 다크모드 UI를 명확히 요구했습니다.
- **기술 스택 통제**: AI에게 React+Vite 환경 위에서 전역 상태 관리를 위한 `Zustand`, 통계 차트를 위한 `Chart.js`를 사용하도록 구체적인 프레임워크와 라이브러리를 지정했습니다.

### 2. 기능 확장 및 보완 지시 (Iterative Improvements)

- **UI/UX 폴리싱**: 초기 버전의 딱딱한 느낌을 지우고자, 둥근 폰트(Quicksand) 적용, 파스텔톤 컬러(Mint, Peach) 및 타이머 진행률에 따른 Glow 효과 등 디테일한 미적 개선을 지시했습니다.
- **편의성 보완 지시**:
  - 마우스 클릭 없이 조작 가능한 **키보드 단축키**(스페이스바, 1, 2, 3 등)를 전역 이벤트로 추가하도록 지시했습니다.
  - 포모도로 기법의 핵심인 **'긴 휴식(Long Break)'** 기능을 추가 기획하여, 타이머 훅(Custom Hook)의 사이클 로직을 전면 수정하도록 유도했습니다.
  - 단조로운 웹 오디오 API 알람 대신, 사용자가 직접 mp3/wav **커스텀 사운드를 업로드**할 수 있도록 기능을 고도화했습니다.

### 3. 트러블 슈팅 (Troubleshooting)

- **Local Storage 용량 한계 극복 (QuotaExceededError)**:
  - **문제**: 사용자가 고화질 배경화면이나 사운드를 업로드할 때, 브라우저 Local Storage의 5MB 용량 제한에 걸려 앱이 크러시되는 현상을 발견했습니다.
  - **해결 지시**: 웹 브라우저의 한계를 벗어나기 위해 **Electron 데스크탑 앱으로의 전환**을 전격 지시했습니다. Node.js의 `fs` 모듈을 이용해 OS의 로컬 AppData 폴더에 원본 파일을 저장하고 읽어오도록 아키텍처를 재설계했습니다.
- **Windows 빌드 및 심볼릭 링크 오류 (EPERM / Symlink)**:
  - **문제**: 배포용 설치 파일(`.exe`)을 만들기 위해 `electron-builder`를 구동하는 과정에서, Windows 권한 문제로 인해 winCodeSign 캐시에 심볼릭 링크를 생성하지 못하는 빌드 에러가 발생했습니다.
  - **해결 지시**: 오류 로그를 복사해 AI에게 전달한 뒤, 코드 서명(Code Signing) 프로세스를 우회(`"signAndEditExecutable": false`)하도록 `package.json`의 빌드 설정을 강제 수정하게 하여 NSIS Installer 구축을 성공적으로 마쳤습니다.

### 4. 회고 (Retrospective)

- **AI의 역할 완수**: AI는 단순한 코드 스니펫 제공자를 넘어 프론트엔드 개발자, UI/UX 디자이너, 빌드 엔지니어의 역할을 아우르며 지시된 요구사항을 훌륭히 코드로 구현해냈습니다.
- **디렉터(인간)의 역할**: 코드를 1줄도 짜지 않았음에도, **애플리케이션의 결함을 테스트하여 찾아내고**, **더 나은 방향(UX/기능)을 기획하여 지시하며**, **발생한 에러(Error Log)를 적절히 던져주어 AI가 올바른 아키텍처 결정을 내리도록 유도**하는 완벽한 방향타(Director)의 역할을 수행했습니다.

---

### 5. 최종 폴리싱 및 버그 픽스 세션 (Final Polish & Bug Fixes)

초기 배포 이후, 추가 사용 테스트를 통해 발견된 세부 결함들을 집중적으로 수정한 세션입니다.

#### 5-1. UX 개선 지시

- **볼륨 분리**: 집중 알람과 휴식 알람이 하나의 볼륨 슬라이더를 공유하던 구조에서, 각각 독립적으로 조절 가능한 **집중 볼륨 / 휴식 볼륨** 두 개의 슬라이더로 분리하도록 지시했습니다. 이를 위해 `settingsStore.js`의 상태 구조와 `useTimer.js`의 사운드 재생 로직까지 전면 수정이 필요했습니다.
- **설정 종료 UX 개선**: 미저장 변경사항이 있을 때 표시되는 확인 다이얼로그의 버튼을 "취소/폐기" 에서 **"저장하고 나가기 / 저장 없이 나가기"** 로 명확하게 개선하도록 지시했습니다.
- **커스텀 스크롤바**: 기본 Windows 흰색 스크롤바 대신 앱의 다크 테마에 어울리는 커스텀 스크롤바 스타일을 `index.css`에 적용했습니다.
- **앱 이름 변경**: 폴더명(`01-pomodoro-timer`)이 그대로 프로그램 이름으로 노출되는 문제를 발견하고, `index.html` 타이틀과 `package.json` 이름을 **FocusFlow**로 변경했습니다.

#### 5-2. 심층 버그 트러블슈팅

- **소리 미리듣기 버튼 먹통**:
  - **원인**: 볼륨을 둘로 분리하는 과정에서 미리듣기 함수(`previewSound`)가 더 이상 존재하지 않는 `localVolume` 변수를 참조하고 있었습니다.
  - **해결**: 재생 중인 사운드 타입(집중/휴식)을 판별하여 올바른 볼륨 변수(`localFocusVolume` 또는 `localBreakVolume`)를 호출하도록 코드를 수정했습니다.

- **저장 후 배경 테마 미반영 (Web → Electron 차이)**:
  - **원인 1 (Web)**: `SettingsModal`이 닫힐 때 실행되는 cleanup `useEffect`가 **클로저(Closure)로 낡은 `bgTheme` 값을 기억**하고 있었습니다. `handleSave()`가 store를 업데이트한 직후임에도 cleanup이 이전 테마로 배경을 덮어쓰는 경쟁 조건(Race Condition)이 발생했습니다.
  - **해결 1**: cleanup 함수 내 배경 관련 코드를 전부 제거하고, 이미 Zustand store를 정확히 구독하고 있는 **`App.jsx`의 `useEffect`에 배경 적용 책임을 완전히 위임**했습니다.
  - **원인 2 (Electron)**: `App.jsx`에서 배경 이미지 경로를 `/themes/Wallpaper1.jpg`와 같이 **절대 경로**로 지정했습니다. 웹 서버에서는 서버 루트(`/`)를 기준으로 올바르게 해석되지만, Electron이 사용하는 `file://` 프로토콜에서는 파일시스템의 루트(`C:\themes\`)를 가리켜 이미지를 로드하지 못했습니다.
  - **해결 2**: `App.jsx`와 `SettingsModal.jsx`의 모든 테마 경로를 `/themes/` → **`./themes/`** (상대 경로)로 통일하여 `file://` 환경에서도 `dist/themes/` 폴더를 정확히 참조하도록 수정했습니다.

- **한국어 설정 시 입력 칸 레이아웃 붕괴**:
  - **원인**: "긴 휴식 주기 (뽀모도로 수, 0=사용안함)"처럼 긴 한국어 레이블이 두 줄로 넘어가면서, CSS Flex 컨테이너의 높이를 밀어 다른 입력 칸의 위치가 틀어졌습니다.
  - **해결**: `SettingsModal.css`의 `.time-inputs div`에 `justify-content: flex-end`를 추가하여 레이블 줄 수에 관계없이 입력 박스가 항상 **하단 기준으로 정렬**되도록 수정했습니다.

#### 5-3. 최종 배포

- 위 모든 수정사항을 GitHub에 푸쉬하여 **Vercel 웹 버전**에 자동 반영했습니다.
- `electron-builder`로 Windows 설치 파일(`.exe`)을 재빌드하여 **데스크탑 버전**에도 모든 픽스를 적용했습니다.
- GitHub Releases에 최신 설치 파일을 업로드하여 배포를 완료했습니다.

---

### 6. 로컬 어셋 렌더링 안정화 및 커스텀 프로토콜 도입 (Local Asset & Protocol Update)

커스텀 이미지와 사운드 파일을 로드하는 과정에서 Chromium 브라우저의 로컬 파일 보안 정책(CORS) 및 절대 경로 파싱 버그 이슈가 발견되었습니다. 이를 항구적으로 해결하기 위해 다음 사항들을 대폭 개선했습니다.

- **통합 로컬 디렉토리 아키텍처**: 모든 기본 제공 자산(배경, 효과음)과 사용자 업로드 커스텀 자산을 Windows OS 데이터 영역(`AppData\Roaming\focusflow\`) 내의 `backgrounds\`, `sounds\` 폴더로 일원화하고 원본을 복사하여 관리하도록 파일 시스템 구조(`fsHelper.js`)를 개편했습니다.
- **안전한 가상 경로 프로토콜 (`asset://`)**: Chromium이 Windows의 드라이브 문자(`C:`)를 호스트 네임으로 오인하여 파일의 절대 경로를 망가뜨리는 치명적인 파싱 버그를 우회하기 위해, 프론트엔드에서는 `asset://backgrounds/파일.jpg` 형태의 짧고 캡슐화된 가상 경로만 사용하도록 수정했습니다.
- **메인 프로세스 라우팅**: Electron의 백엔드 리스너(`main.js`)에서 위 가상 경로를 중간에 가로채어 정확한 `AppData` 내부 절대 경로로 매핑(Mapping)해주는 라우팅 로직을 구현하여, 사용자의 커스텀 테마 파일이나 효과음이 어떠한 OS 환경에서도 버그 없이 100% 안정적으로스트리밍되도록 아키텍처를 고도화했습니다.
