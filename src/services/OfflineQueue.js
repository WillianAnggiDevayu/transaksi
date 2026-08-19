import localforage from "localforage";

// Semua data offline (antrian perubahan) disimpan di IndexedDB,
// terpisah dari cache HTTP milik service worker.
const store = localforage.createInstance({
  name: "pms-offline",
  storeName: "mutation_queue",
});

const QUEUE_KEY = "items";

async function loadQueue() {
  return (await store.getItem(QUEUE_KEY)) || [];
}

async function saveQueue(items) {
  await store.setItem(QUEUE_KEY, items);
  window.dispatchEvent(
    new CustomEvent("pms-queue-changed", { detail: { length: items.length } })
  );
}

/**
 * Menyimpan satu permintaan (create/update/delete) yang gagal terkirim
 * karena offline, supaya bisa dikirim ulang nanti.
 */
async function addToQueue({ entity, method, path, payload, targetId, tempId }) {
  const items = await loadQueue();

  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    entity,
    method,
    path,
    payload,
    targetId: targetId ?? null,
    tempId: tempId ?? null,
  };

  items.push(record);
  await saveQueue(items);
  return record;
}

async function getQueue() {
  return loadQueue();
}

async function removeFromQueue(id) {
  const items = await loadQueue();
  await saveQueue(items.filter((item) => item.id !== id));
}

async function getPendingCount() {
  return (await loadQueue()).length;
}

/**
 * Menggabungkan data dari server dengan perubahan yang masih
 * tertunda (belum tersinkron), supaya perubahan yang dibuat saat
 * offline langsung terlihat di UI tanpa menunggu sinkronisasi.
 *
 * @param {string} entity        nama resource, harus sama dengan segmen pertama path API (mis. "items")
 * @param {string} idField       nama field id pada data ternormalisasi (mis. "item_id")
 * @param {Array}  serverItems   hasil dari server (sudah dinormalisasi)
 * @param {Function} normalizeFn fungsi normalize milik service terkait
 */
async function mergeOptimistic(entity, idField, serverItems, normalizeFn = (x) => x) {
  const queue = await loadQueue();
  const relevant = queue.filter((q) => q.entity === entity);

  if (relevant.length === 0) return serverItems;

  let result = [...serverItems];

  for (const q of relevant) {
    if (q.method === "POST") {
      result.push({
        ...normalizeFn({ ...q.payload, [idField]: q.tempId }),
        _pendingSync: true,
        _pendingAction: "create",
        _queueId: q.id,
      });
    } else if (q.method === "PUT" || q.method === "PATCH") {
      result = result.map((item) =>
        item[idField] === q.targetId
          ? {
              ...item,
              ...normalizeFn({ ...q.payload, [idField]: q.targetId }),
              _pendingSync: true,
              _pendingAction: "update",
              _queueId: q.id,
            }
          : item
      );
    } else if (q.method === "DELETE") {
      result = result.filter((item) => item[idField] !== q.targetId);
    }
  }

  return result;
}

export default {
  addToQueue,
  getQueue,
  removeFromQueue,
  getPendingCount,
  mergeOptimistic,
};
