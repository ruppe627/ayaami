import { STORE_NAMES, clearStore } from "./db.js?v=28";
import { repositories } from "./repositories.js?v=28";

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function exportBackup() {
  const data = {
    app: "ayachan-knitting-note",
    version: 1,
    exported_at: new Date().toISOString(),
    stores: {},
  };

  for (const storeName of STORE_NAMES) {
    const records = await repositories[storeName].all();
    if (storeName === "blobs") {
      data.stores[storeName] = await Promise.all(records.map(async (record) => ({
        ...record,
        blob: record.blob ? await blobToDataUrl(record.blob) : null,
      })));
    } else {
      data.stores[storeName] = records;
    }
  }

  return data;
}

export async function downloadBackup() {
  const data = await exportBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ayachan-knitting-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file) {
  const text = await file.text();
  const backup = JSON.parse(text);
  if (backup.app !== "ayachan-knitting-note" || !backup.stores) {
    throw new Error("対応していないバックアップファイルです。");
  }

  for (const storeName of [...STORE_NAMES].reverse()) {
    await clearStore(storeName);
  }

  for (const storeName of STORE_NAMES) {
    const records = backup.stores[storeName] || [];
    for (const rawRecord of records) {
      const record = { ...rawRecord };
      if (storeName === "blobs" && typeof record.blob === "string") {
        record.blob = dataUrlToBlob(record.blob);
      }
      await repositories[storeName].save(record);
    }
  }
}
