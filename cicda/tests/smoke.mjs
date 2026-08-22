// memory-core smoke test. Run after `npm run build`.

import { MemoryCore, matches, ruleAllows } from '../../dist/index.js';

let failed = 0;
function assert(cond, msg) {
  if (cond) console.log('  ok:', msg);
  else {
    console.error('  FAIL:', msg);
    failed++;
  }
}

// pure helpers
{
  assert(matches({ a: 1, b: 2 }, { a: 1 }), 'matches partial');
  assert(!matches({ a: 1 }, { a: 2 }), 'matches rejects mismatch');
  assert(ruleAllows([{ pattern: 'user-*', allow: true }], 'user-1'), 'ruleAllows user-*');
  assert(!ruleAllows([{ pattern: 'user-*', allow: false }], 'user-1'), 'ruleAllows deny');
}

// core CRUD (memory backend)
{
  const mem = new MemoryCore();
  await mem.set('k', { v: 1 });
  assert((await mem.get('k')).v === 1, 'set/get roundtrip');
  await mem.remove('k');
  assert((await mem.get('k')) === null, 'remove');
}

// fluent store selection + localStorage backend
{
  const store = new Map();
  const fakeStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  };

  const mem = new MemoryCore({ localStorage: fakeStorage });
  await mem.useStore('localStorage').set('pet', { name: 'Rex' });
  assert(JSON.parse(fakeStorage.getItem('pet')).name === 'Rex', 'localStorage serialized set');
  const pet = await mem.useStore('localStorage').get('pet');
  assert(pet.name === 'Rex', 'localStorage get roundtrip');
}

// collections
{
  const mem = new MemoryCore();
  const pets = mem.getCollection('pets');
  await pets.insert({ id: 1, name: 'Rex', status: 'available' });
  await pets.insert({ id: 2, name: 'Milo', status: 'sold' });
  assert((await pets.count()) === 2, 'collection count');
  const avail = await pets.find({ status: 'available' });
  assert(avail.length === 1 && avail[0].name === 'Rex', 'collection find');
  const updated = await pets.update({ id: 2 }, { status: 'available' });
  assert(updated === 1, 'collection update count');
  assert((await pets.count({ status: 'available' })) === 2, 'collection update applied');
  const removed = await pets.remove({ id: 1 });
  assert(removed === 1 && (await pets.count()) === 1, 'collection remove');
}

// access policy
{
  const mem = new MemoryCore();
  mem.setAccessPolicy({
    read: [{ pattern: 'public-*', allow: true }, { pattern: /.*/, allow: false }],
    write: [{ pattern: /.*/, allow: true }],
    delete: [{ pattern: /.*/, allow: false }],
  });
  await mem.set('public-x', 1);
  assert((await mem.get('public-x')) === 1, 'access policy allows public-*');
  let denied = false;
  try {
    await mem.get('secret-x');
  } catch {
    denied = true;
  }
  assert(denied, 'access policy denies non-public read');
}

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nmemory-core smoke test passed.');
