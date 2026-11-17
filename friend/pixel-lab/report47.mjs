const results = document.getElementById('results47');
const read = async file => {
  const response = await fetch(file);
  if (!response.ok) throw Error('자료 응답 '+response.status);
  return response.json();
};
const distance = (a,b) => a.toFixed(2)+' → '+b.toFixed(2)+'px';
function entry(title, lines) {
  const heading=document.createElement('h3');heading.textContent=title;
  const p=document.createElement('p');p.textContent=lines;
  results.append(heading,p);
}
try {
  const [faces,body]=await Promise.all([read('face-eval47.json'),read('chest-eval47.json')]);
  results.replaceChildren();
  for (const [id,label] of [['F02','페른'],['M01','힘멜']]) {
    const data=faces.cases[id], unseen=data.views.find(v=>v.newAfterFreeze), reg=unseen.registrations[0];
    entry(label, '설정화 측면에서 턱밑 선까지 평균 거리 '+distance(data.side.before.distance,data.side.after.distance)+
      '. 후보를 고정한 뒤 처음 본 7화 원화에서 턱선 거리는 '+distance(reg.before,reg.after)+
      '. 7화 영상에서 눈·코·입 표식으로 맞춘 카메라의 정합 잔차는 '+reg.rms.toFixed(2)+'px입니다. 수치는 원화를 248px로 맞춘 좌표계에서 잰 값입니다.');
  }
  const side=body.paper.S3;
  entry('성인 몸통 W','지정 도판 S3 측면의 밑선 오차 '+distance(side.baseline40.errorsPx[0],side.candidate47.errorsPx[0])+
    '. 교정에 쓰지 않은 같은 도판의 '+body.withheld.length+'칸 중 '+body.improvedAgainst40.length+
    '칸에서 기존 40차보다 윤곽 오차 합이 줄었습니다. 42차와의 차이, 팔을 올린 자세, 원본 사진이 없는 방향은 아래 도판에서 확인할 수 있습니다. 양팔을 90°로 올린 사선에서 국소 꺾임이 40차 25.72°, 47차 38.57°로 커져 현재 권고 원형은 40차입니다.');
} catch(error) {results.textContent='측정 원문을 열 수 없습니다. '+error.message;}
