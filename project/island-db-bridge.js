import { STORE_NAMES } from "./js/db.js?v=31";
import {
  deleteByIndex,
  deleteWork,
  deleteWorkLog,
  getByIndex,
  repositories,
  saveWork,
  saveWorkLog,
  saveWorkYarn,
  saveYarn,
  seedSampleData,
} from "./js/repositories.js?v=31";
import { downloadBackup, importBackup } from "./js/export-import.js?v=31";

const acClasses = ["ac-flower", "ac-coral", "ac-teal", "ac-grape", "ac-leaf", "ac-lemon", "ac-sky"];
const workEmojiByCategory = {
  "ウェア": "🧥",
  "カーディガン": "🧥",
  "ヨガソックス": "🧦",
  "靴下": "🧦",
  "レッグウォーマー": "🦵",
  "帽子": "🧢",
  "ミニ靴下": "🧦",
  "バッグ": "👜",
  "ショール": "🧣",
  "こもの": "🌸",
  "アミグルミ": "🐰",
  "ブランケット": "🧶",
  "ベビー": "👶",
};
const statusToUi = {
  "構想中": "idea",
  "制作予定": "plan",
  "制作中": "making",
  "完成": "done",
  "保留": "hold",
  idea: "idea",
  plan: "plan",
  making: "making",
  done: "done",
  hold: "hold",
};
const uiToStatus = {
  idea: "構想中",
  plan: "制作予定",
  making: "制作中",
  done: "完成",
  hold: "保留",
};

function pick(items, index) {
  return items[Math.abs(index) % items.length];
}

function groupBy(items, keyFn) {
  const grouped = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  return grouped;
}

function formatDate(value) {
  if (!value) return "";
  return String(value).replaceAll("-", ".");
}

function timePart(value) {
  if (!value) return "";
  const text = String(value);
  if (text.includes("T")) return text.slice(11, 16);
  return text.slice(0, 5);
}

function priority(value) {
  const number = Number(value);
  if (number >= 1 && number <= 3) return number;
  return 1;
}

function workProgress(status, minutes) {
  if (status === "making") return Math.max(15, Math.min(90, Math.round((Number(minutes) || 0) / 30)));
  if (status === "done") return 100;
  return 0;
}

async function readAllStores() {
  const entries = await Promise.all(STORE_NAMES.map(async (name) => [name, await repositories[name].all()]));
  return Object.fromEntries(entries);
}

function buildData(stores) {
  const workLogsByWork = groupBy(stores.work_logs, (log) => log.work_id);
  const workYarnsByWork = groupBy(stores.work_yarns, (link) => link.work_id);
  const workPatternsByWork = groupBy(stores.work_patterns, (link) => link.work_id);
  const workToolsByWork = groupBy(stores.work_tools, (link) => link.work_id);
  const purchasesByYarn = groupBy(stores.yarn_purchase_histories, (purchase) => purchase.yarn_id);
  const toolPurchasesByTool = groupBy(stores.tool_purchase_histories, (purchase) => purchase.tool_id);
  const patternFilesByPattern = groupBy(stores.pattern_files, (file) => file.pattern_id);
  const workImagesByWork = groupBy(stores.work_images, (image) => image.work_id);
  const blobsById = new Map(stores.blobs.map((blob) => [blob.id, blob]));
  const sitesById = new Map((stores.shopping_sites || []).map((site) => [site.id, site]));

  const workYarns = {};
  for (const link of stores.work_yarns) {
    workYarns[link.id] = {
      yarn: link.yarn_id,
      used: Number(link.used_g) || 0,
      unit: Number(link.unit_price_per_g) || 0,
      cost: Number(link.cost) || 0,
    };
  }

  const logs = {};
  for (const log of stores.work_logs) {
    logs[log.id] = {
      id: log.id,
      work: log.work_id,
      date: formatDate(log.log_date),
      start: timePart(log.start_time),
      end: timePart(log.end_time),
      minutes: Number(log.work_minutes) || 0,
      content: log.content || "",
    };
  }

  const works = stores.works.map((work, index) => {
    const status = statusToUi[work.status] || "idea";
    const category = work.category || "こもの";
    const minutes = Number(work.work_minutes_total) || (workLogsByWork.get(work.id) || []).reduce((sum, log) => sum + (Number(log.work_minutes) || 0), 0);
    const images = (workImagesByWork.get(work.id) || [])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((image) => {
        const blob = blobsById.get(image.blob_key);
        return {
          id: image.id,
          blobKey: image.blob_key,
          url: blob?.blob ? URL.createObjectURL(blob.blob) : "",
          caption: image.caption || image.file_name || blob?.file_name || "",
          fileName: image.file_name || blob?.file_name || "",
          mime: image.mime_type || blob?.mime_type || "",
          kind: "image",
        };
      });
    return {
      id: work.id,
      title: work.title || "無題の作品",
      en: category.toUpperCase(),
      category,
      status,
      recipient: work.recipient || "じぶん用",
      start: formatDate(work.start_date),
      completed: formatDate(work.completed_date),
      minutes,
      price: Number(work.selling_price) || 0,
      isForSale: Boolean(work.is_for_sale),
      progress: workProgress(status, minutes),
      concept: work.concept || "",
      review: work.review || "",
      knit: pick(["#ece1cb", "#ecdfc8", "#efe6cf", "#e4eedd", "#f2dde2", "#dcecd9", "#e9e1cc", "#efe1e4"], index),
      emoji: workEmojiByCategory[category] || "🧶",
      ac: pick(acClasses, index),
      images,
      yarns: (workYarnsByWork.get(work.id) || []).map((link) => link.id),
      patterns: (workPatternsByWork.get(work.id) || []).map((link) => link.pattern_id),
      tools: (workToolsByWork.get(work.id) || []).map((link) => link.tool_id),
      logs: (workLogsByWork.get(work.id) || []).map((log) => log.id),
    };
  });

  const yarns = stores.yarns.map((yarn, index) => {
    const imageBlob = blobsById.get(yarn.image_blob_key);
    return {
      id: yarn.id,
      maker: yarn.manufacturer || "",
      name: yarn.name || "無題の毛糸",
      color: yarn.color || "",
      material: yarn.material || "",
      weight: Number(yarn.weight_g) || 0,
      price: Number(yarn.price_reference) || 0,
      stock: Number(yarn.stock_g) || 0,
      ac: pick(acClasses, index + 1),
      emoji: yarn.material?.includes("綿") || yarn.material?.includes("麻") ? "🧵" : "🧶",
      image: imageBlob?.blob ? {
        blobKey: yarn.image_blob_key,
        url: URL.createObjectURL(imageBlob.blob),
        fileName: imageBlob.file_name || "",
        mime: imageBlob.mime_type || "",
      } : null,
    };
  });

  const purchases = {};
  for (const [yarnId, rows] of purchasesByYarn.entries()) {
    purchases[yarnId] = rows.map((row) => ({
      date: formatDate(row.purchase_date),
      shop: sitesById.get(row.site_id)?.name || row.shop_name || "",
      siteId: row.site_id || "",
      siteUrl: sitesById.get(row.site_id)?.url || "",
      price: Number(row.price) || 0,
      weight: Number(row.weight_g) || 0,
    }));
  }

  const sites = (stores.shopping_sites || [])
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ja"))
    .map((site, index) => ({
      id: site.id,
      name: site.name || "無題のサイト",
      url: site.url || "",
      memo: site.memo || "",
      ac: pick(acClasses, index + 5),
    }));

  const patterns = stores.patterns.map((pattern, index) => {
    const files = patternFilesByPattern.get(pattern.id) || [];
    return {
      id: pattern.id,
      title: pattern.title || "無題の編み図",
      memo: pattern.memo || "",
      updated: formatDate(pattern.updated_at?.slice(0, 10) || pattern.created_at?.slice(0, 10)),
      files: files
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((file) => {
          const blob = blobsById.get(file.blob_key);
          const mime = file.mime_type || blob?.mime_type || "";
          return {
            id: file.id,
            blobKey: file.blob_key,
            url: blob?.blob ? URL.createObjectURL(blob.blob) : "",
            fileName: file.file_name || blob?.file_name || "",
            mime,
            type: mime === "application/pdf" ? "pdf" : "image",
          };
        }),
      ac: pick(acClasses, index + 3),
      emoji: pick(["📘", "📕", "📗", "📙"], index),
    };
  });

  const tools = stores.tools
    .slice()
    .sort((a, b) => {
      const category = (a.category || "その他").localeCompare(b.category || "その他", "ja");
      if (category) return category;
      const order = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
      if (order) return order;
      return (a.name || "").localeCompare(b.name || "", "ja");
    })
    .map((tool, index) => {
      const imageBlob = blobsById.get(tool.image_blob_key);
      return {
        id: tool.id,
        name: tool.name || "無題の用具",
        category: tool.category || "その他",
        maker: tool.manufacturer || tool.maker || "",
        size: tool.size || "—",
        memo: tool.memo || "",
        sortOrder: Number(tool.sort_order) || 0,
        purchases: (toolPurchasesByTool.get(tool.id) || []).map((row) => ({
          date: formatDate(row.purchase_date),
          shop: sitesById.get(row.site_id)?.name || row.shop_name || "",
          siteId: row.site_id || "",
          siteUrl: sitesById.get(row.site_id)?.url || "",
          price: Number(row.price) || 0,
          quantity: Number(row.quantity) || 0,
          memo: row.memo || "",
        })),
        ac: pick(acClasses, index + 4),
        emoji: pick(["🪝", "🥢", "🪡", "➰", "🔖"], index),
        image: imageBlob?.blob ? {
          blobKey: tool.image_blob_key,
          url: URL.createObjectURL(imageBlob.blob),
          fileName: imageBlob.file_name || "",
          mime: imageBlob.mime_type || "",
        } : null,
      };
    });

  const wishlist = stores.wish_list.map((wish, index) => {
    const imageBlob = blobsById.get(wish.image_blob_key);
    return {
      id: wish.id,
      title: wish.title || "無題",
      deadline: formatDate(wish.deadline),
      recipient: wish.recipient || "じぶん用",
      priority: priority(wish.priority),
      registered: formatDate(wish.created_at?.slice(0, 10)),
      memo: wish.memo || wish.concept || "",
      knit: pick(["#f6e0e8", "#efe6d2", "#e4eef0", "#eef0dc"], index),
      emoji: pick(["👜", "🧸", "🧣", "🏠"], index),
      image: imageBlob?.blob ? {
        blobKey: wish.image_blob_key,
        url: URL.createObjectURL(imageBlob.blob),
        fileName: imageBlob.file_name || "",
        mime: imageBlob.mime_type || "",
      } : null,
      ac: pick(acClasses, index + 2),
    };
  });

  return {
    works,
    yarns,
    purchases,
    sites,
    patterns,
    tools,
    logs,
    workYarns,
    wishlist,
    statusMap: window.DATA.statusMap,
    priorityMap: window.DATA.priorityMap,
  };
}

async function refreshData() {
  const stores = await readAllStores();
  window.DATA = buildData(stores);
  window.DATA_SOURCE = "indexeddb";
  return window.DATA;
}

function value(data, key) {
  const item = data[key];
  if (Array.isArray(item)) return item.filter(Boolean);
  return item ?? "";
}

async function replaceLinks(storeName, workId, key, ids) {
  await deleteByIndex(storeName, "work_id", workId);
  for (const id of ids) {
    await repositories[storeName].save({ work_id: workId, [key]: id });
  }
}

window.AyaamiDB = {
  refresh: refreshData,
  async saveWork(id, data) {
    const record = await saveWork({
      id: id === "new" ? "" : id,
      title: value(data, "title"),
      category: value(data, "category"),
      status: uiToStatus[value(data, "status")] || value(data, "status"),
      recipient: value(data, "recipient"),
      start_date: value(data, "start_date"),
      completed_date: value(data, "completed_date"),
      concept: value(data, "concept"),
      review: value(data, "review"),
      selling_price: value(data, "selling_price"),
      is_for_sale: value(data, "is_for_sale") === "1",
    });
    await refreshData();
    return record;
  },
  async saveYarn(id, data) {
    const record = await saveYarn({
      id: id === "new" ? "" : id,
      manufacturer: value(data, "manufacturer"),
      name: value(data, "name"),
      color: value(data, "color"),
      material: value(data, "material"),
      weight_g: value(data, "weight_g"),
      price_reference: value(data, "price_reference"),
      stock_g: value(data, "stock_g"),
      memo: value(data, "memo"),
    });
    await refreshData();
    return record;
  },
  async savePattern(id, data) {
    const record = await repositories.patterns.save({
      id: id === "new" ? "" : id,
      title: value(data, "title").trim(),
      memo: value(data, "memo"),
    });
    await refreshData();
    return record;
  },
  async saveTool(id, data) {
    const existing = id === "new" ? null : await repositories.tools.get(id);
    const sameCategory = await repositories.tools.all();
    const nextOrder = sameCategory.filter((tool) => (tool.category || "その他") === (value(data, "category") || "その他")).length + 1;
    const record = await repositories.tools.save({
      ...existing,
      id: id === "new" ? "" : id,
      name: value(data, "name").trim(),
      category: value(data, "category"),
      maker: value(data, "maker"),
      manufacturer: value(data, "maker"),
      size: value(data, "size"),
      memo: value(data, "memo"),
      sort_order: existing?.sort_order || nextOrder,
    });
    await refreshData();
    return record;
  },
  async saveSite(id, data) {
    const record = await repositories.shopping_sites.save({
      id: id === "new" ? "" : id,
      name: value(data, "name").trim(),
      url: value(data, "url").trim(),
      memo: value(data, "memo"),
    });
    await refreshData();
    return record;
  },
  async copyYarn(id) {
    const yarn = await repositories.yarns.get(id);
    if (!yarn) throw new Error("毛糸が見つかりません。");
    let imageBlobKey = "";
    if (yarn.image_blob_key) {
      const imageBlob = await repositories.blobs.get(yarn.image_blob_key);
      if (imageBlob?.blob) {
        const copiedBlob = await repositories.blobs.save({
          blob: imageBlob.blob,
          file_name: imageBlob.file_name,
          mime_type: imageBlob.mime_type,
          size: imageBlob.size,
        });
        imageBlobKey = copiedBlob.id;
      }
    }
    const record = await saveYarn({
      ...yarn,
      id: "",
      name: `${yarn.name || "無題の毛糸"}（コピー）`,
      image_blob_key: imageBlobKey,
      created_at: "",
      updated_at: "",
    });
    await refreshData();
    return record;
  },
  async copyTool(id) {
    const tool = await repositories.tools.get(id);
    if (!tool) throw new Error("用具が見つかりません。");
    let imageBlobKey = "";
    if (tool.image_blob_key) {
      const imageBlob = await repositories.blobs.get(tool.image_blob_key);
      if (imageBlob?.blob) {
        const copiedBlob = await repositories.blobs.save({
          blob: imageBlob.blob,
          file_name: imageBlob.file_name,
          mime_type: imageBlob.mime_type,
          size: imageBlob.size,
        });
        imageBlobKey = copiedBlob.id;
      }
    }
    const record = await repositories.tools.save({
      ...tool,
      id: "",
      name: `${tool.name || "無題の用具"}（コピー）`,
      image_blob_key: imageBlobKey,
      created_at: "",
      updated_at: "",
    });
    await refreshData();
    return record;
  },
  async saveWish(id, data) {
    const record = await repositories.wish_list.save({
      id: id === "new" ? "" : id,
      title: value(data, "title").trim(),
      recipient: value(data, "recipient"),
      desired_date: value(data, "registered"),
      deadline: value(data, "deadline"),
      priority: Number(value(data, "priority")) || 1,
      memo: value(data, "memo"),
    });
    await refreshData();
    return record;
  },
  async saveWishImage(wishId, file) {
    const wish = await repositories.wish_list.get(wishId);
    if (!wish) throw new Error("編みたいものが見つかりません。");
    if (wish.image_blob_key) await repositories.blobs.delete(wish.image_blob_key);
    const blob = await repositories.blobs.save({
      blob: file,
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
    });
    await repositories.wish_list.save({ ...wish, image_blob_key: blob.id });
    await refreshData();
  },
  async saveYarnImage(yarnId, file) {
    const yarn = await repositories.yarns.get(yarnId);
    if (!yarn) throw new Error("毛糸が見つかりません。");
    if (yarn.image_blob_key) await repositories.blobs.delete(yarn.image_blob_key);
    const blob = await repositories.blobs.save({
      blob: file,
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
    });
    await repositories.yarns.save({ ...yarn, image_blob_key: blob.id });
    await refreshData();
  },
  async saveToolImage(toolId, file) {
    const tool = await repositories.tools.get(toolId);
    if (!tool) throw new Error("用具が見つかりません。");
    if (tool.image_blob_key) await repositories.blobs.delete(tool.image_blob_key);
    const blob = await repositories.blobs.save({
      blob: file,
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
    });
    await repositories.tools.save({ ...tool, image_blob_key: blob.id });
    await refreshData();
  },
  async savePurchase(yarnId, data) {
    const siteId = value(data, "site_id");
    const site = siteId ? await repositories.shopping_sites.get(siteId) : null;
    const record = await repositories.yarn_purchase_histories.save({
      yarn_id: yarnId,
      purchase_date: value(data, "purchase_date"),
      price: value(data, "price"),
      weight_g: value(data, "weight_g"),
      site_id: siteId,
      shop_name: site?.name || value(data, "shop_name"),
      memo: value(data, "memo"),
    });
    await refreshData();
    return record;
  },
  async saveToolPurchase(toolId, data) {
    const siteId = value(data, "site_id");
    const site = siteId ? await repositories.shopping_sites.get(siteId) : null;
    const record = await repositories.tool_purchase_histories.save({
      tool_id: toolId,
      purchase_date: value(data, "purchase_date"),
      price: value(data, "price"),
      quantity: value(data, "quantity"),
      site_id: siteId,
      shop_name: site?.name || value(data, "shop_name"),
      memo: value(data, "memo"),
    });
    await refreshData();
    return record;
  },
  async moveTool(id, direction) {
    const tool = await repositories.tools.get(id);
    if (!tool) throw new Error("用具が見つかりません。");
    const all = (await repositories.tools.all())
      .filter((item) => (item.category || "その他") === (tool.category || "その他"))
      .sort((a, b) => {
        const order = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
        if (order) return order;
        return (a.name || "").localeCompare(b.name || "", "ja");
      });
    const index = all.findIndex((item) => item.id === id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= all.length) return tool;
    const current = all[index];
    const target = all[targetIndex];
    const currentOrder = Number(current.sort_order) || index + 1;
    const targetOrder = Number(target.sort_order) || targetIndex + 1;
    await repositories.tools.save({ ...current, sort_order: targetOrder });
    await repositories.tools.save({ ...target, sort_order: currentOrder });
    await refreshData();
    return current;
  },
  async saveWorkYarn(workId, data) {
    const record = await saveWorkYarn({
      work_id: workId,
      yarn_id: value(data, "yarn_id"),
      used_g: value(data, "used_g"),
      unit_price_per_g: value(data, "unit_price_per_g"),
      memo: value(data, "memo"),
    });
    await refreshData();
    return record;
  },
  async saveWorkLog(workId, data) {
    const date = value(data, "log_date");
    const start = value(data, "start_time");
    const end = value(data, "end_time");
    const record = await saveWorkLog({
      work_id: workId,
      log_date: date,
      start_time: date && start ? `${date}T${start}` : "",
      end_time: date && end ? `${date}T${end}` : "",
      work_minutes: value(data, "work_minutes"),
      content: value(data, "content"),
    });
    await refreshData();
    return record;
  },
  async saveWorkImages(workId, files) {
    const existing = await getByIndex("work_images", "work_id", workId);
    let sortOrder = existing.length;
    for (const file of files) {
      const blob = await repositories.blobs.save({
        blob: file,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
      });
      sortOrder += 1;
      await repositories.work_images.save({
        work_id: workId,
        blob_key: blob.id,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        caption: file.name,
        sort_order: sortOrder,
      });
    }
    await refreshData();
  },
  async moveWorkImage(id, direction) {
    const image = await repositories.work_images.get(id);
    if (!image) throw new Error("写真が見つかりません。");
    const all = (await getByIndex("work_images", "work_id", image.work_id))
      .sort((a, b) => {
        const order = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
        if (order) return order;
        return (a.created_at || "").localeCompare(b.created_at || "");
      });
    const index = all.findIndex((item) => item.id === id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= all.length) return image;
    const current = all[index];
    const target = all[targetIndex];
    const currentOrder = Number(current.sort_order) || index + 1;
    const targetOrder = Number(target.sort_order) || targetIndex + 1;
    await repositories.work_images.save({ ...current, sort_order: targetOrder });
    await repositories.work_images.save({ ...target, sort_order: currentOrder });
    await refreshData();
    return current;
  },
  async savePatternFiles(patternId, files) {
    const existing = await getByIndex("pattern_files", "pattern_id", patternId);
    let sortOrder = existing.length;
    for (const file of files) {
      const blob = await repositories.blobs.save({
        blob: file,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        size: file.size,
      });
      sortOrder += 1;
      await repositories.pattern_files.save({
        pattern_id: patternId,
        file_type: file.type === "application/pdf" ? "pdf" : "image",
        blob_key: blob.id,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        sort_order: sortOrder,
      });
    }
    await refreshData();
  },
  async deleteMedia(kind, id, blobKey) {
    if (kind === "work-image") await repositories.work_images.delete(id);
    else if (kind === "pattern-file") await repositories.pattern_files.delete(id);
    else if (kind === "tool-image") {
      const tool = await repositories.tools.get(id);
      if (tool) await repositories.tools.save({ ...tool, image_blob_key: "" });
    } else if (kind === "yarn-image") {
      const yarn = await repositories.yarns.get(id);
      if (yarn) await repositories.yarns.save({ ...yarn, image_blob_key: "" });
    }
    if (blobKey) await repositories.blobs.delete(blobKey);
    await refreshData();
  },
  async exportBackup() {
    await downloadBackup();
  },
  async importBackup(file) {
    await importBackup(file);
    await refreshData();
  },
  async linkPatterns(workId, patternIds) {
    await replaceLinks("work_patterns", workId, "pattern_id", patternIds);
    await refreshData();
  },
  async linkTools(workId, toolIds) {
    await replaceLinks("work_tools", workId, "tool_id", toolIds);
    await refreshData();
  },
  async wishToWork(wishId) {
    const wish = await repositories.wish_list.get(wishId);
    if (!wish) return null;
    const work = await saveWork({
      title: wish.title,
      category: "こもの",
      status: "制作予定",
      recipient: wish.recipient,
      concept: wish.memo,
    });
    await repositories.wish_list.delete(wishId);
    await refreshData();
    return work;
  },
  async deleteRecord(kind, id, extra = {}) {
    if (kind === "work") await deleteWork(id);
    else if (kind === "work-log") await deleteWorkLog(id, extra.workId);
    else if (kind === "yarn") {
      const yarn = await repositories.yarns.get(id);
      if (yarn?.image_blob_key) await repositories.blobs.delete(yarn.image_blob_key);
      await deleteByIndex("yarn_purchase_histories", "yarn_id", id);
      await deleteByIndex("work_yarns", "yarn_id", id);
      await repositories.yarns.delete(id);
    } else if (kind === "pattern") {
      await deleteByIndex("pattern_files", "pattern_id", id);
      await deleteByIndex("work_patterns", "pattern_id", id);
      await repositories.patterns.delete(id);
    } else if (kind === "tool") {
      const tool = await repositories.tools.get(id);
      if (tool?.image_blob_key) await repositories.blobs.delete(tool.image_blob_key);
      await deleteByIndex("tool_purchase_histories", "tool_id", id);
      await deleteByIndex("work_tools", "tool_id", id);
      await repositories.tools.delete(id);
    } else if (kind === "site") {
      const yarnPurchases = await getByIndex("yarn_purchase_histories", "site_id", id);
      await Promise.all(yarnPurchases.map((row) => repositories.yarn_purchase_histories.save({ ...row, site_id: "" })));
      const toolPurchases = await getByIndex("tool_purchase_histories", "site_id", id);
      await Promise.all(toolPurchases.map((row) => repositories.tool_purchase_histories.save({ ...row, site_id: "" })));
      await repositories.shopping_sites.delete(id);
    } else if (kind === "wish") {
      await repositories.wish_list.delete(id);
    }
    await refreshData();
  },
};

window.DATA_READY = (async () => {
  try {
    if (new URLSearchParams(location.search).get("seed") === "1") {
      await seedSampleData();
    }
    await refreshData();
  } catch (error) {
    console.error("IndexedDB data bridge failed. Falling back to sample DATA.", error);
    window.DATA_SOURCE = "sample";
  }
})();
