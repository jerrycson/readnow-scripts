# 책방 친구 작업 환경

로컬과 Codex Cloud에서 같은 판을 열 때 쓰는 안내다. 공유 저장소는 `jerrycson/readnow-scripts`, 전환용 가지는 `codex/friend-cloud-work`다.

## 시작

1. 로컬에서는 이 저장소를 연다. 클라우드에서는 Codex의 **Work in → Cloud → Default environment**를 선택하고 저장소와 가지 이름을 지정한다.
2. `git status --short --branch`와 `git rev-parse HEAD`로 현재 가지, 미저장 변경, 마지막으로 전달받은 커밋을 확인한다. 두 환경 중 한 곳에서 한 번에 작업한다.
3. 저장소 루트의 `AGENTS.md`에 있는 협업 절차를 따른다. 책방 친구 연구실의 시작 페이지는 `friend/research/hub/index.html`, 기본형 연구실은 `friend/pixel-lab/index.html`, 31차 옆얼굴 비교는 `friend/pixel-lab/profile31.html`이다.

## 파일을 수정하지 않는 빠른 검사

저장소 루트에서 Node.js로 아래 명령을 실행한다. 설치할 패키지는 없다. 실패한 항목은 이름과 원인을 출력한다.

```sh
node --input-type=module -e "import {runPureTests} from './friend/pixel-lab/tests.mjs'; const r=await runPureTests({full:false}); console.log(r.passed+'/'+r.total); for(const t of r.results.filter(t=>!t.ok)) console.error(t.name,t.error); if(r.passed!==r.total) process.exitCode=1"
```

## 다른 환경으로 이어가기

- **출발하는 곳**에서 공유 가능한 변경 파일을 골라 이 가지에 커밋하고 GitHub에 저장한다. Codex의 GitHub 연결로도 저장할 수 있다. 다음 작업자에게 가지 이름, 원격 커밋 SHA, 확인한 결과, 다음 할 일을 전한다.
- **도착하는 곳**에서 같은 가지를 열고 작업 폴더가 깨끗한지 확인한 뒤 `git pull --ff-only origin codex/friend-cloud-work`를 실행한다. `git rev-parse HEAD`가 전달받은 SHA와 같은지 확인한다. 양쪽에 서로 다른 수정이 있으면 두 판을 보존한 채 차이를 확인한다.
- 클라우드에서 별도 작업 가지로 결과를 냈다면 그 가지와 SHA를 그대로 전달한다. 로컬은 해당 원격 가지를 가져와 이어간다. 전환에 main 병합은 필요하지 않다.
- 이 방식으로 전달되는 범위는 GitHub에 저장한 파일이다. 개인 작업 메모와 비공개 원본은 허용된 비공개 경로에서 다룬다. Firebase 관리 작업과 운영 배포는 저장소의 기존 검토 절차를 따른다.
