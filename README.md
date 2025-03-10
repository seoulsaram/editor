## 소개

재미삼아 `fabric.js`를 사용해 인스타그램 스토리에서 처럼 간단하게 동영상/사진 위에 스티커나 텍스트를 올릴 수 있는 캔버스를 만들어보았습니다.

---

## 폴더 구조

```bash
src
    ㄴapp
    ㄴclass
        ㄴeditor.class.ts   #텍스트, 이모지 등을 관리하는 class. 아래의 fabric class를 상속받음
        ㄴfabric.class.ts   #캔버스의 기본 동작을 관리하는 class.
    ㄴcomponents
        ㄴEditor.tsx        #editor.class의 인스턴스를 생성해 실제 사용하는 컴포넌트
    ㄴutils
        ㄴcolor.utils.ts    #색상 조작, 컬러 추출 등 색과 관련된 유틸함수 모음
        ㄴimage.utils.ts    #이미지 사이즈 조절, 프레임 추출, 이미지 변환 등 이미지 관련된 유틸함수 모음
```

---

## Getting Started

```bash
# 1. 디팬던시 설치
npm i
# or
yarn

# 2. 개발모드로 실행
npm run dev
# or
yarn dev
# or
pnpm dev

```
