import { openDB } from 'idb';

type QueueItem = {
  id: string;
  type: 'report';
  payload: any;
};

const DB_NAME = 'trailshare-queue';
const STORE = 'queue';

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore(STORE, { keyPath: 'id' });
    }
  });
}

export async function enqueue(item: QueueItem) {
  const d = await db();
  await d.put(STORE, item);
}

export async function drain(processor: (item: QueueItem) => Promise<void>) {
  const d = await db();
  const tx = d.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const all: QueueItem[] = await store.getAll();
  for (const it of all) {
    try {
      await processor(it);
      await store.delete(it.id);
    } catch (e) {
      console.warn('Retry later for', it.id, e);
    }
  }
  await tx.done;
}

export function setupAutoDrain(processor: (item: QueueItem) => Promise<void>) {
  window.addEventListener('online', () => drain(processor));
}
