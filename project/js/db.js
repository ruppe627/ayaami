const DB_NAME = "ayachan-knitting-note";
const DB_VERSION = 3;

export const STORE_NAMES = [
  "works",
  "work_images",
  "yarns",
  "yarn_purchase_histories",
  "shopping_sites",
  "work_yarns",
  "patterns",
  "pattern_files",
  "work_patterns",
  "work_logs",
  "tools",
  "tool_purchase_histories",
  "work_tools",
  "wish_list",
  "blobs",
];

const INDEXES = {
  work_images: ["work_id", "blob_key"],
  yarn_purchase_histories: ["yarn_id", "site_id"],
  shopping_sites: ["name"],
  tool_purchase_histories: ["tool_id", "site_id"],
  work_yarns: ["work_id", "yarn_id"],
  pattern_files: ["pattern_id", "blob_key"],
  work_patterns: ["work_id", "pattern_id"],
  work_logs: ["work_id", "log_date"],
  work_tools: ["work_id", "tool_id"],
  wish_list: ["image_blob_key"],
};

let dbPromise;

export function openDatabase() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of STORE_NAMES) {
        const store = db.objectStoreNames.contains(storeName)
          ? request.transaction.objectStore(storeName)
          : db.createObjectStore(storeName, { keyPath: "id" });

        for (const indexName of INDEXES[storeName] || []) {
          if (!store.indexNames.contains(indexName)) {
            store.createIndex(indexName, indexName, { unique: false });
          }
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function withStore(storeName, mode, callback) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let callbackResult;

    tx.oncomplete = () => resolve(callbackResult);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);

    callbackResult = callback(store);
  });
}

export async function withStores(storeNames, mode, callback) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    const stores = Object.fromEntries(storeNames.map((name) => [name, tx.objectStore(name)]));
    let callbackResult;

    tx.oncomplete = () => resolve(callbackResult);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);

    callbackResult = callback(stores);
  });
}

export function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllFromStore(storeName) {
  return withStore(storeName, "readonly", (store) => requestToPromise(store.getAll()));
}

export async function clearStore(storeName) {
  return withStore(storeName, "readwrite", (store) => requestToPromise(store.clear()));
}
