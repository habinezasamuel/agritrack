import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InflightReads } from './inflightReads.ts';

test('simultaneous reads send one request and later reads fetch again', async () => {
  const reads = new InflightReads();
  let calls = 0;
  const load = async () => { calls++; return ['saved record']; };
  const [first, second] = await Promise.all([reads.run('user:page', load), reads.run('user:page', load)]);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
  await reads.run('user:page', load);
  assert.equal(calls, 2);
});

test('failed reads can be retried and users have separate requests', async () => {
  const reads = new InflightReads();
  await assert.rejects(reads.run('user:page', async () => { throw new Error('offline'); }));
  assert.equal(await reads.run('user:page', async () => 'restored'), 'restored');
  let calls = 0;
  await Promise.all(['farmer:page', 'officer:page'].map((key) => reads.run(key, async () => { calls++; return key; })));
  assert.equal(calls, 2);
});
