import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {mkdtemp, readFile, rm, rmdir, writeFile} from 'node:fs/promises';
import {syncBuiltinESMExports} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {requiredIndexes} from './firestore.indexes.mjs';

test('전용 DB·규칙 경로, 재실행, 충돌 보존을 외부 접속 없이 검사', async () => {
  const project = 'projects/readnow-3a385';
  const db = project + '/databases/readnow-research';
  const base = 'https://firestore.googleapis.com/v1/' + db;
  const rulesBase = 'https://firebaserules.googleapis.com/v1/' + project;
  const release = project + '/releases/cloud.firestore/readnow-research';
  const ruleSet = project + '/rulesets/mock';
  const reviewRules = await readFile(new URL('./firestore.rules', import.meta.url), 'utf8');
  const folder = await mkdtemp(path.join(tmpdir(), 'bookfriend-import-test-'));
  const fixturePath = path.join(folder, 'synthetic-input');
  const sha = value => createHash('sha256').update(value).digest('hex');
  const cards = JSON.stringify({schema: 1, cards: []});
  const archive = JSON.stringify({title: '시험'});
  const fixture = {
    project: 'readnow-3a385', facts: [], archive: JSON.parse(archive),
    reader: {key: randomBytes(32).toString('base64')},
    release: {project: 'bookfriend', at: new Date().toISOString(), sources: 0,
      cardsSha: sha(cards), adminSha: sha(archive), id: sha(cards + archive).slice(0, 24)},
  };
  const docs = new Map();
  let databaseExists = false;
  let deployedRules = '';
  let released = false;
  let databaseCreates = 0;
  let rulesCreates = 0;
  const originalExec = childProcess.execFileSync;
  const originalFetch = globalThis.fetch;
  const originalArgs = process.argv;
  const originalUID = process.env.RESEARCH_READER_UID;
  const response = (data, status = 200) => new Response(JSON.stringify(data), {status});
  try {
    await writeFile(fixturePath, JSON.stringify(fixture));
    process.env.RESEARCH_READER_UID = randomUUID();
    process.argv = [process.execPath, 'cloud-import.mjs', fixturePath];
    childProcess.execFileSync = (command, args) => {
      assert.equal(command, 'gcloud');
      if (args.join(' ') === 'auth print-access-token') return 'local-test';
      assert.deepEqual(args, ['firestore', 'databases', 'create', '--project=readnow-3a385',
        '--database=readnow-research', '--location=asia-northeast3', '--type=firestore-native',
        '--delete-protection', '--quiet']);
      databaseCreates++;
      databaseExists = true;
    };
    syncBuiltinESMExports();
    globalThis.fetch = async (url, options = {}) => {
      const method = options.method || 'GET';
      const payload = options.body && JSON.parse(options.body);
      if (method === 'GET' && url === base) {
        return databaseExists ? response({name: db}) : response({}, 404);
      }
      if (method === 'GET' && url === rulesBase + '/releases/cloud.firestore/readnow-research') {
        return released ? response({rulesetName: ruleSet}) : response({}, 404);
      }
      if (method === 'POST' && url === rulesBase + '/rulesets') {
        assert.equal(payload.attachmentPoint, 'firestore.googleapis.com/' + db);
        assert.deepEqual(payload.source.files, [{name: 'firestore.rules', content: reviewRules}]);
        deployedRules = reviewRules;
        rulesCreates++;
        return response({name: ruleSet});
      }
      if (method === 'POST' && url === rulesBase + '/releases') {
        assert.deepEqual(payload, {name: release, rulesetName: ruleSet});
        released = true;
        return response(payload);
      }
      if (method === 'GET' && url === rulesBase + '/rulesets/mock') {
        return response({source: {files: [{content: deployedRules}]}});
      }
      assert.ok(url.startsWith(base + '/documents/'), '전용 DB 밖의 요청');
      const address = new URL(url);
      const suffix = address.pathname.split('/documents/')[1];
      const [collection, id] = suffix.split('/');
      assert.ok(['readers', 'blobs', 'releases'].includes(collection));
      if (method === 'POST') {
        assert.equal(id, undefined);
        const key = collection + '/' + address.searchParams.get('documentId');
        if (docs.has(key)) return response({}, 409);
        docs.set(key, payload);
        return response(payload);
      }
      assert.equal(method, 'GET');
      return docs.has(suffix) ? response(docs.get(suffix)) : response({}, 404);
    };
    await import('./cloud-import.mjs?first');
    assert.ok(docs.has('releases/' + fixture.release.id));
    assert.ok(docs.has('blobs/' + sha(cards)));
    assert.ok(docs.has('blobs/' + sha(archive)));
    assert.ok(docs.has('readers/' + process.env.RESEARCH_READER_UID));
    const first = structuredClone(docs);
    await import('./cloud-import.mjs?retry');
    assert.deepEqual(docs, first);
    assert.equal(rulesCreates, 1);
    assert.equal(databaseCreates, 1);
    deployedRules += '\n// 기존 규칙의 차이';
    await assert.rejects(import('./cloud-import.mjs?different-rules'), /기존 규칙/);
    assert.deepEqual(docs, first);
    deployedRules = reviewRules;
    docs.set('blobs/' + sha(cards), {fields: {}});
    const conflict = structuredClone(docs);
    await assert.rejects(import('./cloud-import.mjs?different-content'), /같은 ID/);
    assert.deepEqual(docs, conflict);
    assert.equal(requiredIndexes.database, 'readnow-research');
    assert.deepEqual(requiredIndexes.composite, []);
  } finally {
    globalThis.fetch = originalFetch;
    childProcess.execFileSync = originalExec;
    syncBuiltinESMExports();
    process.argv = originalArgs;
    if (originalUID === undefined) delete process.env.RESEARCH_READER_UID;
    else process.env.RESEARCH_READER_UID = originalUID;
    await rm(fixturePath, {force: true});
    await rmdir(folder);
  }
});
