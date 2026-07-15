import { STORE_NAMES, getAllFromStore, requestToPromise, withStore } from "./db.js?v=31";

export const WORK_STATUSES = ["構想中", "制作予定", "制作中", "完成", "保留"];

export function uid(prefix = "id") {
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${id}`;
}

export function nowIso() {
  return new Date().toISOString();
}

function cleanNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeRecord(storeName, data, existing = null) {
  const timestamp = nowIso();
  const record = { ...existing, ...data };
  if (!record.id) record.id = uid(storeName);
  if (!record.created_at) record.created_at = timestamp;
  if (["works", "yarns", "patterns", "work_logs", "tools", "wish_list", "shopping_sites"].includes(storeName)) {
    record.updated_at = timestamp;
  }
  return record;
}

export function makeCrudRepository(storeName) {
  return {
    all() {
      return getAllFromStore(storeName);
    },
    get(id) {
      return withStore(storeName, "readonly", (store) => requestToPromise(store.get(id)));
    },
    async save(data) {
      const existing = data.id ? await this.get(data.id) : null;
      const record = normalizeRecord(storeName, data, existing);
      await withStore(storeName, "readwrite", (store) => {
        store.put(record);
        return record;
      });
      return record;
    },
    delete(id) {
      return withStore(storeName, "readwrite", (store) => requestToPromise(store.delete(id)));
    },
  };
}

export const repositories = Object.fromEntries(STORE_NAMES.map((name) => [name, makeCrudRepository(name)]));

export async function getByIndex(storeName, indexName, value) {
  return withStore(storeName, "readonly", (store) => requestToPromise(store.index(indexName).getAll(value)));
}

export async function deleteByIndex(storeName, indexName, value) {
  const records = await getByIndex(storeName, indexName, value);
  await Promise.all(records.map((record) => repositories[storeName].delete(record.id)));
  return records;
}

export async function saveWork(data) {
  return repositories.works.save({
    ...data,
    title: data.title?.trim(),
    category: data.category?.trim() || "",
    recipient: data.recipient?.trim() || "",
    selling_price: cleanNumber(data.selling_price),
    is_for_sale: Boolean(data.is_for_sale),
    work_minutes_total: cleanNumber(data.work_minutes_total) || 0,
  });
}

export async function deleteWork(id) {
  await Promise.all([
    deleteByIndex("work_images", "work_id", id),
    deleteByIndex("work_yarns", "work_id", id),
    deleteByIndex("work_patterns", "work_id", id),
    deleteByIndex("work_logs", "work_id", id),
    deleteByIndex("work_tools", "work_id", id),
  ]);
  await repositories.works.delete(id);
}

export async function saveYarn(data) {
  return repositories.yarns.save({
    ...data,
    manufacturer: data.manufacturer?.trim() || "",
    name: data.name?.trim(),
    weight_g: cleanNumber(data.weight_g),
    price_reference: cleanNumber(data.price_reference),
    stock_g: cleanNumber(data.stock_g),
  });
}

export async function saveWorkYarn(data) {
  const used = cleanNumber(data.used_g) || 0;
  let unit = cleanNumber(data.unit_price_per_g);
  if (unit === null && data.yarn_id) {
    const yarn = await repositories.yarns.get(data.yarn_id);
    unit = yarn?.price_reference && yarn?.weight_g ? yarn.price_reference / yarn.weight_g : 0;
  }
  const cost = Math.round(used * (unit || 0));
  return repositories.work_yarns.save({
    ...data,
    used_g: used,
    unit_price_per_g: unit || 0,
    cost,
  });
}

export async function saveWorkLog(data) {
  const work_minutes = calculateMinutes(data.start_time, data.end_time, data.work_minutes);
  const record = await repositories.work_logs.save({ ...data, work_minutes });
  await refreshWorkMinutes(data.work_id);
  return record;
}

export async function deleteWorkLog(id, workId) {
  await repositories.work_logs.delete(id);
  await refreshWorkMinutes(workId);
}

export function calculateMinutes(start, end, fallback) {
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.round((endDate - startDate) / 60000);
    if (Number.isFinite(diff) && diff >= 0) return diff;
  }
  return cleanNumber(fallback) || 0;
}

export async function refreshWorkMinutes(workId) {
  const logs = await getByIndex("work_logs", "work_id", workId);
  const total = logs.reduce((sum, log) => sum + (Number(log.work_minutes) || 0), 0);
  const work = await repositories.works.get(workId);
  if (work) {
    await repositories.works.save({ ...work, work_minutes_total: total });
  }
  return total;
}

export async function getWorkBundle(workId) {
  const [work, images, yarnLinks, logs, patternLinks, toolLinks] = await Promise.all([
    repositories.works.get(workId),
    getByIndex("work_images", "work_id", workId),
    getByIndex("work_yarns", "work_id", workId),
    getByIndex("work_logs", "work_id", workId),
    getByIndex("work_patterns", "work_id", workId),
    getByIndex("work_tools", "work_id", workId),
  ]);
  const [yarns, patterns, tools] = await Promise.all([
    repositories.yarns.all(),
    repositories.patterns.all(),
    repositories.tools.all(),
  ]);
  return {
    work,
    images: images.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    yarnLinks,
    logs: logs.sort((a, b) => (b.log_date || "").localeCompare(a.log_date || "")),
    patternLinks,
    toolLinks,
    yarns,
    patterns,
    tools,
  };
}

export async function seedSampleData() {
  const seedVersion = "sample-v2";
  if (localStorage.getItem("ayachanSeedVersion") === seedVersion) return;

  const existingWorks = await repositories.works.all();
  const existingYarns = await repositories.yarns.all();
  const existingPatterns = await repositories.patterns.all();
  const existingTools = await repositories.tools.all();
  const existingWishes = await repositories.wish_list.all();

  const findBy = (items, key, value) => items.find((item) => item[key] === value);
  const today = new Date();
  const date = (daysOffset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().slice(0, 10);
  };

  async function sampleBlob(label, palette, kind = "work") {
    const [bg, main, accent] = palette;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650">
        <defs>
          <pattern id="stitch" width="42" height="42" patternUnits="userSpaceOnUse">
            <path d="M0 20 Q10 0 21 20 T42 20" fill="none" stroke="${accent}" stroke-width="4" opacity=".28"/>
            <path d="M0 36 Q10 16 21 36 T42 36" fill="none" stroke="${accent}" stroke-width="3" opacity=".2"/>
          </pattern>
        </defs>
        <rect width="900" height="650" rx="34" fill="${bg}"/>
        <rect x="38" y="38" width="824" height="574" rx="28" fill="url(#stitch)"/>
        <circle cx="690" cy="160" r="82" fill="${accent}" opacity=".32"/>
        <circle cx="205" cy="485" r="120" fill="${main}" opacity=".22"/>
        <path d="M245 280 C335 130 555 130 650 280 C700 360 650 470 546 500 C450 528 314 498 254 408 C225 365 221 322 245 280Z" fill="${main}" opacity=".9"/>
        <path d="M314 242 C392 315 508 315 586 242" fill="none" stroke="#fffaf2" stroke-width="28" stroke-linecap="round" opacity=".72"/>
        <path d="M312 394 C402 350 492 350 584 394" fill="none" stroke="#fffaf2" stroke-width="20" stroke-linecap="round" opacity=".58"/>
        <text x="72" y="96" font-family="sans-serif" font-size="34" font-weight="700" fill="#2f2a24">${label}</text>
        <text x="72" y="138" font-family="sans-serif" font-size="20" fill="#766b5f">${kind === "pattern" ? "Pattern file sample" : "Photo sample"}</text>
      </svg>`;
    return repositories.blobs.save({
      blob: new Blob([svg], { type: "image/svg+xml" }),
      file_name: `${label}.svg`,
      mime_type: "image/svg+xml",
      size: svg.length,
    });
  }

  async function ensureYarn(data) {
    return findBy(existingYarns, "name", data.name) || saveYarn(data);
  }

  async function ensureWork(data) {
    return findBy(existingWorks, "title", data.title) || saveWork(data);
  }

  async function ensurePattern(data) {
    return findBy(existingPatterns, "title", data.title) || repositories.patterns.save(data);
  }

  async function ensureTool(data) {
    return findBy(existingTools, "name", data.name) || repositories.tools.save(data);
  }

  async function ensureWish(data) {
    return findBy(existingWishes, "title", data.title) || repositories.wish_list.save(data);
  }

  const yarns = {
    wool: await ensureYarn({
      manufacturer: "DARUMA",
      name: "空気をまぜて糸にしたウールアルパカ",
      color: "きなり",
      material: "ウール・アルパカ",
      weight_g: 30,
      price_reference: 660,
      stock_g: 180,
      memo: "ふんわり軽い。価格や購入URLはメモに残す。",
    }),
    cotton: await ensureYarn({
      manufacturer: "ハマナカ",
      name: "ポーム コットンリネン",
      color: "ミントグレー",
      material: "綿・麻",
      weight_g: 25,
      price_reference: 520,
      stock_g: 210,
      memo: "春夏小物向き。さらっとしている。",
    }),
    sock: await ensureYarn({
      manufacturer: "Opal",
      name: "ソックヤーン ぽかぽか段染め",
      color: "ベリー",
      material: "ウール・ナイロン",
      weight_g: 100,
      price_reference: 1980,
      stock_g: 95,
      memo: "靴下用。左右の色合わせはゆるめでOK。",
    }),
    mohair: await ensureYarn({
      manufacturer: "ROWAN",
      name: "Kidsilk Haze",
      color: "Dusty Rose",
      material: "モヘア・シルク",
      weight_g: 25,
      price_reference: 1760,
      stock_g: 50,
      memo: "引き揃え用。ほどくとき慎重に。",
    }),
  };

  await repositories.yarn_purchase_histories.save({ yarn_id: yarns.wool.id, purchase_date: date(-18), price: 1320, weight_g: 60, shop_name: "手芸店A", memo: "セールで2玉" });
  await repositories.yarn_purchase_histories.save({ yarn_id: yarns.cotton.id, purchase_date: date(-9), price: 2080, weight_g: 100, shop_name: "オンライン", memo: "送料無料調整" });
  await repositories.yarn_purchase_histories.save({ yarn_id: yarns.sock.id, purchase_date: date(-35), price: 1980, weight_g: 100, shop_name: "イベント", memo: "色に一目ぼれ" });

  const works = {
    cardigan: await ensureWork({
      title: "冬のカーディガン",
      category: "カーディガン",
      status: "制作中",
      recipient: "自分",
      start_date: date(-12),
      concept: "軽く羽織れる、長く着たい一枚。",
      selling_price: "",
    }),
    socks: await ensureWork({
      title: "ベリー色の靴下",
      category: "靴下",
      status: "制作中",
      recipient: "妹",
      start_date: date(-4),
      concept: "冷え性対策。洗濯しやすい実用品にする。",
      selling_price: "",
    }),
    bag: await ensureWork({
      title: "ミントの透かし編みバッグ",
      category: "バッグ",
      status: "完成",
      recipient: "友人",
      start_date: date(-40),
      completed_date: date(-28),
      concept: "夏に持てる軽いバッグ。",
      review: "持ち手をもう少し短くしてもよかった。",
      selling_price: 6800,
    }),
    shawl: await ensureWork({
      title: "ローズモヘアのショール",
      category: "ショール",
      status: "制作予定",
      recipient: "母",
      start_date: "",
      concept: "軽くて暖かい、肩にのせるショール。",
      selling_price: "",
    }),
  };

  const images = [
    [works.cardigan, "カーディガン試着メモ", ["#e8d8c3", "#8b6f47", "#557b68"]],
    [works.socks, "靴下片足め", ["#ead7df", "#a9496a", "#6f5634"]],
    [works.bag, "完成バッグ", ["#d9e8df", "#557b68", "#8b6f47"]],
    [works.shawl, "ショール糸合わせ", ["#f0dce4", "#b76e79", "#7b6b91"]],
  ];

  for (const [work, label, palette] of images) {
    const existing = await getByIndex("work_images", "work_id", work.id);
    if (!existing.length) {
      const blob = await sampleBlob(label, palette);
      await repositories.work_images.save({
        work_id: work.id,
        blob_key: blob.id,
        file_name: blob.file_name,
        mime_type: blob.mime_type,
        caption: label,
        sort_order: 1,
      });
    }
  }

  const existingWorkYarns = await repositories.work_yarns.all();
  async function addWorkYarnOnce(work, yarn, used, memo) {
    if (existingWorkYarns.some((row) => row.work_id === work.id && row.yarn_id === yarn.id)) return;
    await saveWorkYarn({ work_id: work.id, yarn_id: yarn.id, used_g: used, memo });
  }
  await addWorkYarnOnce(works.cardigan, yarns.wool, 105, "身頃と袖の途中まで");
  await addWorkYarnOnce(works.cardigan, yarns.mohair, 18, "襟ぐりに引き揃え予定");
  await addWorkYarnOnce(works.socks, yarns.sock, 46, "片足と履き口");
  await addWorkYarnOnce(works.bag, yarns.cotton, 92, "本体と持ち手");
  await addWorkYarnOnce(works.shawl, yarns.mohair, 25, "試し編み分込み");

  const existingLogs = await repositories.work_logs.all();
  async function addLogOnce(work, logDate, start, end, content) {
    if (existingLogs.some((log) => log.work_id === work.id && log.content === content)) return;
    await saveWorkLog({
      work_id: work.id,
      log_date: logDate,
      start_time: `${logDate}T${start}`,
      end_time: `${logDate}T${end}`,
      content,
    });
  }
  await addLogOnce(works.cardigan, date(-12), "10:00", "11:30", "ゲージ確認と作り目。");
  await addLogOnce(works.cardigan, date(-8), "21:00", "22:20", "後ろ身頃を進めた。");
  await addLogOnce(works.socks, date(-4), "20:30", "22:00", "片足目の履き口からかかと手前まで。");
  await addLogOnce(works.bag, date(-33), "14:00", "16:10", "本体を編み終わり。");
  await addLogOnce(works.bag, date(-28), "09:30", "10:40", "持ち手を付けて完成写真を撮った。");

  const patterns = {
    yoke: await ensurePattern({ title: "丸ヨークの参考編み図", memo: "カーディガンの増し目位置を見るための参考。" }),
    socks: await ensurePattern({ title: "つま先から編む靴下メモ", memo: "かかとの引き返し部分だけ確認する。" }),
    lace: await ensurePattern({ title: "透かし模様バッグ図案", memo: "模様の段数確認用。URL管理はしない。" }),
  };

  const existingPatternFiles = await repositories.pattern_files.all();
  async function addPatternFileOnce(pattern, label, palette) {
    if (existingPatternFiles.some((file) => file.pattern_id === pattern.id)) return;
    const blob = await sampleBlob(label, palette, "pattern");
    await repositories.pattern_files.save({
      pattern_id: pattern.id,
      file_type: "image",
      blob_key: blob.id,
      file_name: blob.file_name,
      mime_type: blob.mime_type,
      sort_order: 1,
    });
  }
  await addPatternFileOnce(patterns.yoke, "丸ヨーク編み図サンプル", ["#efe2cc", "#8b6f47", "#557b68"]);
  await addPatternFileOnce(patterns.socks, "靴下編み図サンプル", ["#ead7df", "#a9496a", "#6f5634"]);
  await addPatternFileOnce(patterns.lace, "透かし模様サンプル", ["#d9e8df", "#557b68", "#8b6f47"]);

  const existingWorkPatterns = await repositories.work_patterns.all();
  async function linkPatternOnce(work, pattern) {
    if (existingWorkPatterns.some((row) => row.work_id === work.id && row.pattern_id === pattern.id)) return;
    await repositories.work_patterns.save({ work_id: work.id, pattern_id: pattern.id });
  }
  await linkPatternOnce(works.cardigan, patterns.yoke);
  await linkPatternOnce(works.socks, patterns.socks);
  await linkPatternOnce(works.bag, patterns.lace);

  const tools = {
    needle5: await ensureTool({ name: "輪針 5号 80cm", category: "棒針", maker: "近畿編針", size: "5号", memo: "カーディガン用" }),
    needle1: await ensureTool({ name: "輪針 1号 60cm", category: "棒針", maker: "Seeknit", size: "1号", memo: "靴下用" }),
    hook6: await ensureTool({ name: "かぎ針 6/0号", category: "かぎ針", maker: "Clover", size: "6/0号", memo: "バッグの縁編み" }),
    marker: await ensureTool({ name: "段数マーカー", category: "小物", maker: "Clover", size: "S", memo: "増し目位置に使う" }),
  };

  const existingWorkTools = await repositories.work_tools.all();
  async function linkToolOnce(work, tool) {
    if (existingWorkTools.some((row) => row.work_id === work.id && row.tool_id === tool.id)) return;
    await repositories.work_tools.save({ work_id: work.id, tool_id: tool.id });
  }
  await linkToolOnce(works.cardigan, tools.needle5);
  await linkToolOnce(works.cardigan, tools.marker);
  await linkToolOnce(works.socks, tools.needle1);
  await linkToolOnce(works.bag, tools.hook6);

  await ensureWish({
    title: "春色の三角ショール",
    desired_date: date(-2),
    deadline: date(42),
    recipient: "母",
    priority: 4,
    memo: "軽い糸で作りたい。",
  });
  await ensureWish({
    title: "甥っ子の耳あて帽子",
    desired_date: date(-1),
    deadline: date(25),
    recipient: "甥っ子",
    priority: 5,
    memo: "洗える糸。ポンポンは取り外し式にしたい。",
  });
  await ensureWish({
    title: "余り糸のコースターセット",
    desired_date: date(-6),
    deadline: "",
    recipient: "家用",
    priority: 2,
    memo: "色合わせの練習にもよさそう。",
  });

  localStorage.setItem("ayachanSeedVersion", seedVersion);
}
