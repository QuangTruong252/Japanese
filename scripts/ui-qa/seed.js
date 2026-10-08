// Seed IndexedDB + localStorage cho QA giao diện. Trạng thái: 'new' | 'normal' | 'many' | 'done';
// theme: 'light' | 'dark'. Đặt window.__STATE / window.__THEME rồi eval file này, sau đó tải lại trang.
(async () => {
  const state = window.__STATE || 'normal';
  const theme = window.__THEME || 'light';
  const DAY = 86400000;
  const now = Date.now();
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('JapaneseLearningDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const tx = db.transaction(['reviewItems', 'practiceSessions'], 'readwrite');
  tx.objectStore('reviewItems').clear();
  tx.objectStore('practiceSessions').clear();
  const item = (lesson, i, dueOffset) => {
    const due = new Date(now + dueOffset);
    const last = new Date(now - 2 * DAY);
    return {
      targetId: `vocab-${String(lesson).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      targetType: 'vocab',
      lesson,
      incorrectCount: 0,
      correctCount: 2,
      dueAt: due,
      fsrsCard: { due, stability: 3, difficulty: 5, elapsed_days: 2, scheduled_days: 2, learning_steps: 0, reps: 2, lapses: 0, state: 2, last_review: last },
      updatedAt: last.toISOString(),
      // 'done': items created today use up dailyNewLimit, so no new items are queued.
      createdAt: new Date(state === 'done' ? now : now - 5 * DAY).toISOString(),
      recentElapsedMs: [3000, 4000],
    };
  };
  const plan = { new: [], normal: [[1, 10, 12], [2, 10, 0], [3, 10, 0], [4, 8, 0]], many: [[1, 12, 12], [2, 12, 12], [3, 10, 6], [4, 8, 0]], done: [[1, 10, 0], [2, 10, 0], [3, 10, 0], [4, 8, 0]] }[state];
  const store = tx.objectStore('reviewItems');
  for (const [lesson, count, dueCount] of plan) {
    for (let i = 1; i <= count; i++) store.put(item(lesson, i, i <= dueCount ? -DAY : 3 * DAY));
  }
  await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  db.close();
  for (const k of Object.keys(localStorage)) if (k.startsWith('jp:vocab-draft:') || k === 'jp:practice-draft') localStorage.removeItem(k);
  if (state === 'many') {
    localStorage.setItem('jp:vocab-draft:4', JSON.stringify({ version: 1, targetIds: ['vocab-04-01', 'vocab-04-02', 'vocab-04-03', 'vocab-04-04'], currentIndex: 1 }));
  }
  const settings = JSON.parse(localStorage.getItem('jp:settings') || '{}');
  settings.theme = theme;
  localStorage.setItem('jp:settings', JSON.stringify(settings));
  return `seeded ${state}/${theme}`;
})();
