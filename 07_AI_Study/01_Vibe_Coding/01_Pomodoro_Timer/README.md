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
