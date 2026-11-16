// readnow-research 조회 계약. 업로더는 인덱스를 생성하거나 변경하지 않는다.
// releases는 project 동등 조건 하나로 구독하고, 날짜 정렬은 브라우저에서 한다.
// readers와 blobs는 문서 ID로 조회한다. 복합 인덱스 정의가 필요하지 않다.
export const requiredIndexes = Object.freeze({
  database: 'readnow-research',
  singleField: Object.freeze([{collection: 'releases', field: 'project', query: '=='}]),
  composite: Object.freeze([]),
});
