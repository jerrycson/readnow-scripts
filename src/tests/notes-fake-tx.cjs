'use strict';
// 기존 노트 시험의 가짜 저장소에 트랜잭션 계약을 추가. 운영 코드의 우회 경로가 아님.
module.exports = function withTransactions(collection) {
  let tail = Promise.resolve();
  const db = { runTransaction(fn) {
    const run = tail.then(async () => {
      const pending = []; let wrote = false;
      const result = await fn({
        get: ref => { if (wrote) throw Error('read after write'); return ref.get(); },
        set: (ref, data, opts) => { wrote = true; pending.push([ref, data, opts]); }
      });
      for (const [ref, data, opts] of pending) await ref.set(data, opts);
      return result;
    });
    tail = run.catch(() => {}); return run;
  } };
  return name => ({ ...collection(name), firestore: db });
};
