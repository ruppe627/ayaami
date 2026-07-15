/* =========================================================
   あやあみ — アプリ本体（ルーティング＋全画面）
   ========================================================= */
(function(){
  const APP_VERSION = "v27";
  let D = window.DATA;
  const fmtMin = window.fmtMin, yen = window.yen;

  /* ---- かわいいアイコン（白フィル・あつ森アプリ風） ---- */
  const ICON = {
    home:`<svg viewBox="0 0 24 24"><path fill="#fff" d="M11.1 3.6 3.9 9.2c-.5.4-.9 1-.9 1.7V19c0 .9.7 1.6 1.6 1.6h3.1V16c0-.8.6-1.4 1.4-1.4h1.8c.8 0 1.4.6 1.4 1.4v4.6h3.1c.9 0 1.6-.7 1.6-1.6v-8.1c0-.7-.3-1.3-.9-1.7L12.9 3.6a1.4 1.4 0 0 0-1.8 0Z"/></svg>`,
    works:`<svg viewBox="0 0 24 24"><g fill="#fff"><rect x="3.6" y="3.6" width="7.4" height="7.4" rx="2.2"/><rect x="13" y="3.6" width="7.4" height="7.4" rx="2.2"/><rect x="3.6" y="13" width="7.4" height="7.4" rx="2.2"/><rect x="13" y="13" width="7.4" height="7.4" rx="2.2"/></g></svg>`,
    yarns:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.6" fill="#fff"/><g stroke="rgba(0,0,0,.16)" stroke-width="1.5" fill="none" stroke-linecap="round"><path d="M8.2 4.4C10.4 8 10.4 16 8.2 19.6"/><path d="M13 3.8C16.2 8 16.2 16 13 20.2"/><path d="M3.6 8.6c4.4 1.8 12 1.8 16.8 0"/><path d="M3.6 15.2c4.4-1.8 12-1.8 16.8 0"/></g></svg>`,
    patterns:`<svg viewBox="0 0 24 24"><rect x="4.6" y="2.8" width="14.8" height="18.4" rx="3" fill="#fff"/><g stroke="rgba(0,0,0,.18)" stroke-width="1.6" stroke-linecap="round"><path d="M8.4 8h7.2M8.4 12h7.2M8.4 16h4.4"/></g></svg>`,
    wishlist:`<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 20.7S3.3 15.4 3.3 9.1A4.4 4.4 0 0 1 12 6.9a4.4 4.4 0 0 1 8.7 2.2C20.7 15.4 12 20.7 12 20.7Z"/></svg>`,
    tools:`<svg viewBox="0 0 24 24"><g stroke="#fff" stroke-width="2.7" stroke-linecap="round"><path d="M5.5 18.5 17 7"/><path d="M7 7l11.5 11.5"/></g><circle cx="17.6" cy="6.4" r="2.4" fill="#fff"/><circle cx="6.4" cy="6.4" r="2.4" fill="#fff"/></svg>`,
    backup:`<svg viewBox="0 0 24 24"><path fill="#fff" d="M4.5 8.4 12 4.6l7.5 3.8v7.2L12 19.4 4.5 15.6z"/><path fill="rgba(0,0,0,.13)" d="M12 11.8 4.5 8.4 12 4.6l7.5 3.8z"/></svg>`
  };
  // 大きいヘッダー用は同じ白アイコンでOK（背景タイルが色を持つ）
  const navItems = [
    { key:'home',     label:'ホーム',   t:'var(--teal)' },
    { key:'works',    label:'作品',     t:'var(--flower)' },
    { key:'yarns',    label:'毛糸',     t:'var(--coral)' },
    { key:'patterns', label:'編み図',   t:'var(--grape)' },
    { key:'wishlist', label:'編みたい', t:'var(--lemon)' },
    { key:'tools',    label:'用具',     t:'var(--sky-btn)' }
  ];
  const WORK_CATEGORIES = ['ウェア','ヨガソックス','靴下','レッグウォーマー','帽子','ミニ靴下','こもの','アミグルミ','ブランケット','ベビー','その他'];

  /* ---- ヘルパ ---- */
  const st = (s)=> D.statusMap[s] || {label:s,cls:'st-hold'};
  const today = ()=> new Date().toISOString().slice(0,10);
  const formDataObject = (form)=>{
    const out = {};
    for(const [key,value] of new FormData(form).entries()){
      if(out[key] === undefined) out[key] = value;
      else if(Array.isArray(out[key])) out[key].push(value);
      else out[key] = [out[key], value];
    }
    return out;
  };
  const esc = (v)=> String(v ?? '').replace(/[&<>"']/g, (c)=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const photo = (knit,item,size=50)=>{
    if(item && typeof item === 'object' && item.url){
      return `<div class="photo knit-photo" style="--knit:${knit}"><img src="${esc(item.url)}" alt="${esc(item.caption||item.fileName||'作品写真')}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
    }
    const emoji = typeof item === 'string' ? item : '🧶';
    return `<div class="photo knit-photo" style="--knit:${knit}"><span class="knit-emoji" style="font-size:${size}px">${emoji}</span></div>`;
  };
  const isoDate = (value)=> String(value || '').replace(/\./g,'-');
  const dateSelect = (name, value, { required=false } = {})=>{
    const normalized = isoDate(value);
    const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const selectedYear = m ? Number(m[1]) : '';
    const selectedMonth = m ? Number(m[2]) : '';
    const selectedDay = m ? Number(m[3]) : '';
    const currentYear = new Date().getFullYear();
    const startYear = Math.min(selectedYear || currentYear, currentYear - 15);
    const endYear = Math.max(selectedYear || currentYear, currentYear + 10);
    const years = [];
    for(let y=startYear; y<=endYear; y++) years.push(y);
    return `<input type="hidden" name="${name}" value="${m ? normalized : ''}" ${required?'required':''}>
      <div class="date-combo" data-date-combo="${name}">
        <select class="select date-year" data-date-part="year" aria-label="年">
          ${!required?'<option value="">年</option>':''}${years.map(y=>`<option value="${y}" ${y===selectedYear?'selected':''}>${y}</option>`).join('')}
        </select>
        <select class="select date-month" data-date-part="month" aria-label="月">
          <option value="">月</option>${Array.from({length:12},(_,i)=>i+1).map(v=>`<option value="${String(v).padStart(2,'0')}" ${v===selectedMonth?'selected':''}>${v}</option>`).join('')}
        </select>
        <select class="select date-day" data-date-part="day" aria-label="日" data-selected-day="${selectedDay ? String(selectedDay).padStart(2,'0') : ''}">
          <option value="">日</option>
        </select>
      </div>`;
  };
  const yarnName = (id)=>{ const y=D.yarns.find(y=>y.id===id); return y? `${y.maker} ${y.name}` : '—'; };
  const yarnColor = (id)=>{ const y=D.yarns.find(y=>y.id===id); return y? y.color : ''; };

  /* ===========================================================
     ホーム
     =========================================================== */
  function vHome(){
    const making = D.works.filter(w=>w.status==='making');
    const recent = D.works.filter(w=>w.status==='done').slice(0,3);
    return `
    <div class="home-hello">
      <div class="hh-text">
        <div class="hh-hi">おかえりなさい、あやちゃん！</div>
        <h1>今日はなにを編む？</h1>
        <div class="hh-sub">島の編み物アトリエへようこそ ♪</div>
      </div>
      <div class="hh-stats">
        <div class="hh-stat"><span class="n">${D.works.length}</span><span class="k">作品</span></div>
        <div class="hh-stat"><span class="n">${making.length}</span><span class="k">制作中</span></div>
        <div class="hh-stat"><span class="n">${D.wishlist.length}</span><span class="k">編みたい</span></div>
      </div>
    </div>

    <div class="sec-title ac-coral" style="margin-top:30px">
      <span class="ico">${ICON.works}</span>
      <div class="ttl-box"><h1>制作中の作品</h1><span class="en">IN PROGRESS</span></div>
      <span class="spacer"></span>
      <button class="btn btn-cream btn-sm" data-route="works">ぜんぶ見る →</button>
    </div>
    <div class="cards">
      ${making.length ? making.map(cardWork).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e-ico">🧺</div><div class="e-msg">制作中の作品はまだないよ</div></div>`}
    </div>

    <div class="sec-title ac-lemon" style="margin-top:34px">
      <span class="ico">${ICON.wishlist}</span>
      <div class="ttl-box"><h1>つぎ編みたいもの</h1><span class="en">WISH LIST</span></div>
      <span class="spacer"></span>
      <button class="btn btn-cream btn-sm" data-route="wishlist">ぜんぶ見る →</button>
    </div>
    <div class="cards">
      ${D.wishlist.length ? D.wishlist.slice(0,4).map(cardWish).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e-ico">💛</div><div class="e-msg">編みたいものを追加してみよう</div></div>`}
    </div>`;
  }

  /* ===========================================================
     作品一覧
     =========================================================== */
  let worksFilter='all', worksSort='updated', worksQuery='';
  function vWorks(){
    const filters = [['all','すべて'],['sale','販売用'],['other','その他']];
    return `
    <div class="sec-title ac-flower">
      <span class="ico">${ICON.works}</span>
      <div class="ttl-box"><h1>作品コレクション</h1><span class="en">MY KNIT WORKS</span></div>
      <span class="spacer"></span>
      <button class="btn btn-flower" data-route="work-edit/new">＋ 新しい作品</button>
    </div>

    <div class="toolbar">
      <div class="search">
        <span class="s-ico">🔍</span>
        <input class="input" id="workSearch" placeholder="作品をさがす…" value="${worksQuery}">
      </div>
      <select class="select sort-sel" id="workSort" style="max-width:180px">
        <option value="updated">更新が新しい順</option>
        <option value="oldest">登録が古い順</option>
        <option value="title">タイトル順</option>
        <option value="time">制作時間が長い順</option>
      </select>
    </div>
    <div class="filterbar" id="workFilters">
      ${filters.map(([value,label])=>`<button class="chip" data-f="${value}" aria-pressed="${value===worksFilter}">${label}</button>`).join('')}
      <span class="count" id="workCount"></span>
    </div>
    <div class="cards" id="workGrid"></div>`;
  }
  function renderWorkGrid(){
    let list = D.works.slice();
    if(worksFilter==='sale') list=list.filter(w=>w.isForSale);
    else if(worksFilter==='other') list=list.filter(w=>!w.isForSale);
    if(worksQuery.trim()){ const q=worksQuery.trim(); list=list.filter(w=>(w.title+w.category+w.recipient).includes(q)); }
    if(worksSort==='title') list.sort((a,b)=>a.title.localeCompare(b.title,'ja'));
    else if(worksSort==='time') list.sort((a,b)=>b.minutes-a.minutes);
    else if(worksSort==='oldest') list.reverse();
    const grid=document.getElementById('workGrid'); const cnt=document.getElementById('workCount');
    if(cnt) cnt.innerHTML=`<b>${list.length}</b> 点`;
    if(!grid) return;
    grid.innerHTML = list.length ? list.map(cardWork).join('')
      : `<div class="empty" style="grid-column:1/-1"><div class="e-ico">🧺</div><div class="e-msg">作品が見つからないみたい…</div></div>`;
    bindCards();
  }
  function cardWork(w){
    const s=st(w.status);
    const mainImage = (w.images && w.images.length) ? w.images[0] : w.emoji;
    const foot = w.status==='making'
      ? `<div class="prog-label"><span>進捗</span><b>${w.progress||0}%</b></div><div class="progress"><span style="width:${w.progress||0}%"></span></div>`
      : `<div class="row-foot"><span class="badge ${s.cls}">${s.label}</span><span class="meta">${w.completed||w.start||''}</span></div>`;
    const top = `<div class="row-foot"><span class="badge ${s.cls}">${s.label}</span><span class="meta">${w.recipient}</span></div>`;
    return `
    <div class="panel wcard ${w.ac}" data-go="work/${w.id}">
      <div class="photo-wrap">${photo(w.knit,mainImage)}<span class="corner">${w.corner}</span></div>
      <div class="body">
        <div class="ttl">${w.title}</div>
        <div class="sub">${w.category}・${w.recipient}</div>
        ${w.status==='making'?top:''}
        ${foot}
      </div>
    </div>`;
  }
  function cardWish(w){
    return `
    <div class="panel wcard ${w.ac}" data-go="wishlist">
      <div class="photo-wrap">${photo(w.knit,w.image||w.emoji)}<span class="corner">${w.corner}</span>
        <span class="prio-tag pri${w.priority}">優先度 ${D.priorityMap[w.priority]}</span></div>
      <div class="body">
        <div class="ttl">${w.title}</div>
        <div class="sub">${w.recipient}${w.deadline?'・〆 '+w.deadline:''}</div>
      </div>
    </div>`;
  }

  /* ===========================================================
     作品詳細
     =========================================================== */
  function vWork(id){
    const w=D.works.find(x=>x.id===id); if(!w) return vNotFound();
    const s=st(w.status);
    const mainImage = (w.images && w.images.length) ? w.images[0] : w.emoji;
    const wys=(w.yarns||[]).map(k=>({k,...D.workYarns[k]}));
    const costTotal=wys.reduce((a,b)=>a+(b.cost||0),0);
    const usedTotal=wys.reduce((a,b)=>a+(b.used||0),0);
    const logs=(w.logs||[]).map(k=>D.logs[k]).filter(Boolean);
    const logTotal=logs.reduce((a,b)=>a+b.minutes,0);
    const tls=(w.tools||[]).map(k=>D.tools.find(t=>t.id===k)).filter(Boolean);
    const pats=(w.patterns||[]).map(k=>D.patterns.find(p=>p.id===k)).filter(Boolean);

    return `
    <button class="backbtn" data-route="works">← 作品コレクションへ</button>
    <div class="detail-hero">
      <div class="panel hero-photo ${w.ac}">${photo(w.knit,mainImage,76)}<span class="corner big">${w.corner}</span></div>
      <div class="hero-right">
        <div class="hero-chips">
          <span class="badge ${s.cls}">${s.label}</span>
          <span class="badge st-idea">${w.category}</span>
          <span class="badge ${w.isForSale?'st-done':'st-hold'}">${w.isForSale?'販売用':'自宅用'}</span>
          <span class="badge st-plan">${w.recipient}</span>
        </div>
        <div><div class="en2">${w.en||''}</div><h2>${w.title}</h2></div>
        <div class="dates">${w.start?'開始 '+w.start:'未着手'}${w.completed?' ・ 完成 '+w.completed:(w.progress?' ・ 進捗 '+w.progress+'%':'')}</div>
        ${w.progress?`<div class="progress" style="max-width:380px"><span style="width:${w.progress}%"></span></div>`:''}
        <div class="metrics">
          <div class="metric m1"><div class="k">制作時間</div><div class="v">${fmtMin(w.minutes)}</div></div>
          <div class="metric m2"><div class="k">材料原価</div><div class="v"><span class="bell-coin">B</span>${yen(costTotal)}</div></div>
          <div class="metric m3"><div class="k">${w.isForSale?'販売価格':'区分'}</div><div class="v">${w.isForSale && w.price?'<span class="bell-coin">B</span>'+yen(w.price):(w.isForSale?'価格未定':'自宅用')}</div></div>
        </div>
        <div class="hero-actions">
          <button class="btn btn-flower btn-sm" data-route="work-images/${w.id}">写真を管理</button>
          <button class="btn btn-sky btn-sm" data-route="logs/${w.id}">制作ログ</button>
          <button class="btn btn-wood btn-sm" data-route="work-edit/${w.id}">✎ 編集</button>
          <button class="btn btn-cream btn-sm" data-delete="work" data-id="${w.id}" data-next="works">削除</button>
        </div>
      </div>
    </div>

    <div class="panels">
      <!-- 基本情報 -->
      <div class="panel">
        <div class="panel-head head-teal">基本情報<span class="en">DETAIL</span></div>
        <div class="panel-body">
          <dl class="deflist">
            <dt>作品種別</dt><dd>${w.category}</dd>
            <dt>状態</dt><dd>${s.label}</dd>
            <dt>販売区分</dt><dd>${w.isForSale?'販売用':'販売しない'}</dd>
            <dt>作成相手</dt><dd>${w.recipient}</dd>
            <dt>開始日</dt><dd>${w.start||'—'}</dd>
            <dt>完成日</dt><dd>${w.completed||'—'}</dd>
            <dt>販売価格</dt><dd>${w.price?yen(w.price)+' ベル':'—'}</dd>
          </dl>
          ${w.concept?`<div class="concept"><b><span class="leaf"></span>コンセプト</b>${w.concept}</div>`:''}
          ${w.review?`<div class="concept" style="background:#eef0dc"><b style="color:var(--leaf-d)"><span class="leaf"></span>できあがりの感想</b>${w.review}</div>`:''}
        </div>
      </div>

      <!-- 写真 -->
      <div class="panel">
        <div class="panel-head head-flower">作品写真<span class="en">PHOTO</span></div>
        <div class="panel-body">
          ${(w.images&&w.images.length)?`<div class="minigrid">${w.images.map(e=>photo(w.knit,e,28)).join('')}</div>`
            :`<div class="empty" style="padding:24px"><div class="e-ico">📷</div><div class="e-msg">まだ写真がないよ</div></div>`}
          <button class="btn btn-flower btn-sm addbtn" data-route="work-images/${w.id}">＋ 写真を管理</button>
        </div>
      </div>

      <!-- 毛糸と原価 -->
      <div class="panel">
        <div class="panel-head head-bell">使用毛糸と原価<span class="en">YARN</span></div>
        <div class="panel-body">
          ${wys.length?`<table class="gtable"><thead><tr><th>毛糸</th><th class="num">使用量</th><th class="num">g単価</th><th class="num">原価</th></tr></thead><tbody>
            ${wys.map(y=>`<tr><td>${yarnName(y.yarn)}<br><span style="font-size:11px;color:var(--ink-soft)">${yarnColor(y.yarn)}</span></td><td class="num">${y.used}g</td><td class="num">${y.unit}</td><td class="num cost">${yen(y.cost)}</td></tr>`).join('')}
            <tr class="totalrow"><td>合計</td><td class="num">${usedTotal}g</td><td></td><td class="num cost">${yen(costTotal)}</td></tr>
          </tbody></table>`:`<div class="empty" style="padding:24px"><div class="e-ico">🧶</div><div class="e-msg">毛糸が未登録だよ</div></div>`}
          <button class="btn btn-bell btn-sm addbtn" data-route="work-yarn-edit/${w.id}">＋ 毛糸を追加</button>
        </div>
      </div>

      <!-- 制作ログ -->
      <div class="panel">
        <div class="panel-head head-leaf">制作ログ<span class="en">LOG</span></div>
        <div class="panel-body">
          ${logs.length?`<table class="gtable"><thead><tr><th>日付</th><th class="num">時間</th><th>内容</th></tr></thead><tbody>
            ${logs.map(l=>`<tr><td>${l.date}</td><td class="num">${fmtMin(l.minutes)}</td><td>${l.content}</td></tr>`).join('')}
            <tr class="totalrow"><td>合計</td><td class="num">${fmtMin(logTotal)}</td><td></td></tr>
          </tbody></table>`:`<div class="empty" style="padding:24px"><div class="e-ico">📝</div><div class="e-msg">ログがまだないよ</div></div>`}
          <button class="btn btn-leaf btn-sm addbtn" data-route="logs/${w.id}">＋ ログを管理</button>
        </div>
      </div>

      <!-- 編み図 -->
      <div class="panel">
        <div class="panel-head head-wood">編み図<span class="en">PATTERN</span></div>
        <div class="panel-body">
          ${pats.length?`<div class="list-wrap">${pats.map(p=>`<div class="list-row ${p.ac}" data-go="pattern/${p.id}" style="cursor:pointer"><div class="l-ico">${p.emoji}</div><div class="l-main"><div class="l-title">${p.title}</div><div class="l-sub">ファイル ${p.files.length}件・更新 ${p.updated}</div></div><span class="meta">›</span></div>`).join('')}</div>`
            :`<div class="empty" style="padding:24px"><div class="e-ico">📄</div><div class="e-msg">編み図が未紐づけ</div></div>`}
          <button class="btn btn-wood btn-sm addbtn" data-route="work-pattern-link/${w.id}">＋ 編み図を紐づけ</button>
        </div>
      </div>

      <!-- 用具 -->
      <div class="panel">
        <div class="panel-head head-teal">用具<span class="en">TOOLS</span></div>
        <div class="panel-body">
          ${tls.length?`<div class="list-wrap">${tls.map(t=>`<div class="list-row ${t.ac}"><div class="l-ico">${t.emoji}</div><div class="l-main"><div class="l-title">${t.name}</div><div class="l-sub">${t.category}・${t.size}</div></div></div>`).join('')}</div>`
            :`<div class="empty" style="padding:24px"><div class="e-ico">🪡</div><div class="e-msg">用具が未紐づけ</div></div>`}
          <button class="btn btn-teal btn-sm addbtn" data-route="work-tool-link/${w.id}">＋ 用具を紐づけ</button>
        </div>
      </div>
    </div>`;
  }

  /* ===========================================================
     作品 登録・編集フォーム
     =========================================================== */
  function vWorkEdit(id){
    const isNew = id==='new';
    const w = isNew ? {title:'',category:'こもの',status:'plan',recipient:'じぶん用',start:'',completed:'',concept:'',review:'',price:'',isForSale:false} : D.works.find(x=>x.id===id);
    if(!w) return vNotFound();
    const stKeys=[['idea','構想中'],['plan','制作予定'],['making','制作中'],['done','完成'],['hold','保留']];
    return `
    <button class="backbtn" data-route="${isNew?'works':'work/'+id}">← もどる</button>
    <div class="sec-title ac-flower">
      <span class="ico">${ICON.works}</span>
      <div class="ttl-box"><h1>${isNew?'新しい作品を登録':'作品を編集'}</h1><span class="en">${isNew?'NEW WORK':'EDIT WORK'}</span></div>
    </div>
    <form class="panel form-panel" data-save="work" data-id="${id}">
      <div class="panel-body" style="padding:24px">
        <div class="form-grid">
          <div class="field span2"><label>作品タイトル <span class="req">必須</span></label><input class="input" name="title" value="${w.title}" placeholder="例：アミグルミうさぎ" required></div>
          <div class="field"><label>作品種別</label><select class="select" name="category">${WORK_CATEGORIES.map(c=>`<option ${c===w.category?'selected':''}>${c}</option>`).join('')}</select></div>
          <div class="field"><label>作成相手</label><input class="input" name="recipient" value="${w.recipient}" placeholder="例：じぶん用 / お母さん"></div>
          <div class="field span2"><label>状態</label><input type="hidden" name="status" value="${w.status}"><div class="seg">${stKeys.map(([k,l])=>`<button type="button" aria-pressed="${k===w.status}" data-stk="${k}">${l}</button>`).join('')}</div></div>
          <div class="field"><label>販売区分</label><input type="hidden" name="is_for_sale" value="${w.isForSale?'1':'0'}"><div class="seg">${[[0,'販売しない'],[1,'販売用']].map(([v,l])=>`<button type="button" aria-pressed="${Boolean(v)===Boolean(w.isForSale)}" data-sale="${v}">${l}</button>`).join('')}</div></div>
          <div class="field date-field"><label>開始日</label>${dateSelect('start_date', w.start)}</div>
          <div class="field date-field"><label>完成日</label>${dateSelect('completed_date', w.completed)}</div>
          <div class="field span2"><label>コンセプト（制作前メモ）</label><textarea class="textarea" name="concept" placeholder="どんな作品にしたい？">${w.concept||''}</textarea></div>
          <div class="field span2"><label>できあがりの感想</label><textarea class="textarea" name="review" placeholder="完成したら書こう">${w.review||''}</textarea></div>
          <div class="field"><label>販売価格（ベル）</label><input class="input" name="selling_price" type="number" value="${w.price||''}" placeholder="0"></div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-cream" data-route="${isNew?'works':'work/'+id}">キャンセル</button>
          <button class="btn btn-flower btn-lg">💾 保存する</button>
        </div>
      </div>
    </form>`;
  }

  /* ===========================================================
     作品 画像管理
     =========================================================== */
  function vWorkImages(id){
    const w=D.works.find(x=>x.id===id); if(!w) return vNotFound();
    const imgs=w.images||[];
    return `
    <button class="backbtn" data-route="work/${id}">← ${w.title} へ</button>
    <div class="sec-title ac-flower">
      <span class="ico">${ICON.works}</span>
      <div class="ttl-box"><h1>写真の管理</h1><span class="en">PHOTOS ・ ${w.title}</span></div>
    </div>
    <label class="uploader">
      <input type="file" accept="image/*" multiple data-upload="work-images" data-id="${id}" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px">
      <div class="up-ico">📷</div>
      <div>タップして写真を追加<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリ / ファイルから選択</span></div>
    </label>
    <div class="img-manage">
      ${imgs.length?imgs.map((e,i)=>`
        <div class="panel img-card ${w.ac}">
          <div class="ord">${i+1}</div>
          ${photo(w.knit,e,44)}
          <div class="img-cap"><input class="input" value="${esc(e.caption || ['メイン','編んでる途中','仕上げ','ディテール'][i] || '写真'+(i+1))}" style="font-size:13px;padding:8px 11px" readonly></div>
          <div class="img-tools"><button class="mini" data-action="move-work-image" data-id="${e.id}" data-dir="up" ${i===0?'disabled':''}>↑</button><button class="mini" data-action="move-work-image" data-id="${e.id}" data-dir="down" ${i===imgs.length-1?'disabled':''}>↓</button><button class="mini del" data-delete-media="work-image" data-id="${e.id}" data-blob="${e.blobKey}" data-next="work-images/${id}">🗑</button></div>
        </div>`).join('')
      :`<div class="empty" style="grid-column:1/-1"><div class="e-ico">🖼️</div><div class="e-msg">まだ写真がないよ。上から追加してね！</div></div>`}
    </div>`;
  }

  /* ===========================================================
     毛糸一覧 / 詳細
     =========================================================== */
  let yarnQuery='';
  function vYarns(){
    return `
    <div class="sec-title ac-coral">
      <span class="ico">${ICON.yarns}</span>
      <div class="ttl-box"><h1>毛糸コレクション</h1><span class="en">YARN STASH</span></div>
      <span class="spacer"></span>
      <button class="btn btn-cream btn-sm" data-route="sites">購入サイト</button>
      <button class="btn btn-coral" data-route="yarn-edit/new">＋ 毛糸を登録</button>
    </div>
    <div class="toolbar"><div class="search"><span class="s-ico">🔍</span><input class="input" id="yarnSearch" placeholder="メーカー・色・素材でさがす…" value="${yarnQuery}"></div></div>
    <div class="cards yarn-cards" id="yarnGrid"></div>`;
  }
  function renderYarnGrid(){
    let list=D.yarns.slice();
    if(yarnQuery.trim()){ const q=yarnQuery.trim(); list=list.filter(y=>(y.maker+y.name+y.color+y.material).includes(q)); }
    const g=document.getElementById('yarnGrid'); if(!g) return;
    g.innerHTML=list.length?list.map(y=>{
      const stockPill = y.stock===0?'<span class="pill pill-coral">在庫なし</span>':(y.stock<60?'<span class="pill pill-bell">のこりわずか</span>':'<span class="pill pill-leaf">在庫 '+y.stock+'g</span>');
      const mainImage = y.image || y.emoji;
      return `<div class="panel ycard ${y.ac}" data-go="yarn/${y.id}">
        <div class="y-top"><div class="y-swatch">${photo('#f3ead6',mainImage,26)}</div><div class="y-name"><div class="m">${y.maker}</div><div class="n">${y.name}</div></div></div>
        <div class="y-color">${y.color}</div>
        <div class="y-meta">${y.material}</div>
        <div class="y-foot"><span class="pill pill-bell"><span class="bell-coin">B</span>${yen(y.price)}/玉</span>${stockPill}</div>
      </div>`;
    }).join(''):`<div class="empty" style="grid-column:1/-1"><div class="e-ico">🧶</div><div class="e-msg">毛糸が見つからないみたい…</div></div>`;
    bindCards();
  }
  function vYarn(id){
    const y=D.yarns.find(x=>x.id===id); if(!y) return vNotFound();
    const mainImage = y.image || y.emoji;
    const pur=D.purchases[id]||[];
    const usedWorks=D.works.filter(w=>(w.yarns||[]).some(k=>D.workYarns[k] && D.workYarns[k].yarn===id));
    return `
    <button class="backbtn" data-route="yarns">← 毛糸コレクションへ</button>
    <div class="detail-hero">
      <div class="panel hero-photo ${y.ac}">${photo('#f3ead6',mainImage,76)}</div>
      <div class="hero-right">
        <div class="hero-chips"><span class="badge st-idea">${y.material}</span><span class="badge ${y.stock?'st-done':'st-hold'}">在庫 ${y.stock}g</span></div>
        <div><div class="en2">${y.maker}</div><h2>${y.name}</h2></div>
        <div class="dates">色：${y.color}</div>
        <div class="metrics">
          <div class="metric"><div class="k">標準重量</div><div class="v">${y.weight}g</div></div>
          <div class="metric m3"><div class="k">参考価格</div><div class="v"><span class="bell-coin">B</span>${yen(y.price)}</div></div>
          <div class="metric m1"><div class="k">g単価</div><div class="v">${(y.price/y.weight).toFixed(1)}</div></div>
        </div>
        <div class="hero-actions">
          <button class="btn btn-bell btn-sm" data-route="yarn-purchase-edit/${y.id}">＋ 購入履歴</button>
          <button class="btn btn-cream btn-sm" data-action="copy-yarn" data-id="${y.id}">⧉ 複製</button>
          <button class="btn btn-wood btn-sm" data-route="yarn-edit/${y.id}">✎ 編集</button>
          <button class="btn btn-cream btn-sm" data-delete="yarn" data-id="${y.id}" data-next="yarns">削除</button>
        </div>
      </div>
    </div>
    <div class="panels">
      <div class="panel">
        <div class="panel-head head-bell">購入履歴<span class="en">PURCHASE</span></div>
        <div class="panel-body">
          ${pur.length?`<table class="gtable"><thead><tr><th>購入日</th><th>購入元</th><th class="num">重量</th><th class="num">金額</th></tr></thead><tbody>
            ${pur.map(p=>`<tr><td>${p.date}</td><td>${p.siteUrl?`<a href="${esc(p.siteUrl)}" target="_blank" rel="noopener">${esc(p.shop)}</a>`:esc(p.shop)}</td><td class="num">${p.weight}g</td><td class="num cost">${yen(p.price)}</td></tr>`).join('')}
          </tbody></table>`:`<div class="empty" style="padding:24px"><div class="e-ico">🧾</div><div class="e-msg">購入履歴がまだないよ</div></div>`}
        </div>
      </div>
      <div class="panel">
        <div class="panel-head head-flower">この毛糸を使った作品<span class="en">USED IN</span></div>
        <div class="panel-body">
          ${usedWorks.length?`<div class="list-wrap">${usedWorks.map(w=>`<div class="list-row ${w.ac}" data-go="work/${w.id}" style="cursor:pointer"><div class="l-ico">${w.emoji}</div><div class="l-main"><div class="l-title">${w.title}</div><div class="l-sub">${w.category}・${st(w.status).label}</div></div><span class="meta">›</span></div>`).join('')}</div>`
            :`<div class="empty" style="padding:24px"><div class="e-ico">🧶</div><div class="e-msg">まだ使った作品がないよ</div></div>`}
        </div>
      </div>
    </div>`;
  }

  /* ===========================================================
     編み図一覧 / 詳細
     =========================================================== */
  function vPatterns(){
    return `
    <div class="sec-title ac-grape">
      <span class="ico">${ICON.patterns}</span>
      <div class="ttl-box"><h1>編み図ライブラリ</h1><span class="en">PATTERN LIBRARY</span></div>
      <span class="spacer"></span>
      <button class="btn btn-purple" style="--btn-edge:var(--grape-d);background:var(--grape)" data-route="pattern-edit/new">＋ 編み図を登録</button>
    </div>
    <div class="cards" id="patGrid">
      ${D.patterns.length ? D.patterns.map(p=>`<div class="panel pcard ${p.ac}" data-go="pattern/${p.id}">
        <div class="p-cover">${p.emoji}<span class="p-files">${p.files.length}枚</span></div>
        <div class="body"><div class="ttl">${p.title}</div><div class="sub">${p.memo}</div><div class="meta" style="margin-top:8px">更新 ${p.updated}</div></div>
      </div>`).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e-ico">📄</div><div class="e-msg">編み図を登録してみよう</div></div>`}
    </div>`;
  }
  function vPattern(id){
    const p=D.patterns.find(x=>x.id===id); if(!p) return vNotFound();
    const linked=D.works.filter(w=>(w.patterns||[]).includes(id));
    return `
    <button class="backbtn" data-route="patterns">← 編み図ライブラリへ</button>
    <div class="sec-title ${p.ac}">
      <span class="ico">${ICON.patterns}</span>
      <div class="ttl-box"><h1>${p.title}</h1><span class="en">PATTERN</span></div>
      <span class="spacer"></span>
      <button class="btn btn-wood btn-sm" data-route="pattern-edit/${p.id}">✎ 編集</button>
      <button class="btn btn-cream btn-sm" data-delete="pattern" data-id="${p.id}" data-next="patterns">削除</button>
    </div>
    ${p.memo?`<div class="concept" style="margin:0 2px 18px"><b><span class="leaf"></span>メモ</b>${p.memo}</div>`:''}
    <label class="uploader">
      <input type="file" accept="image/*,application/pdf" multiple data-upload="pattern-files" data-id="${id}" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px">
      <div class="up-ico">📄</div><div>編み図の画像 / PDF を追加<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリ / ファイルから選択</span></div>
    </label>
    <div class="grid-3" style="margin-top:18px">
      ${p.files.map((f,i)=>`<div class="panel file-card ${p.ac}"><span class="badge ${f.type==='pdf'?'st-done':'st-idea'} ftag">${f.type==='pdf'?'PDF':'画像'}</span>
        ${f.type==='pdf'
          ? `<div class="photo knit-photo" style="--knit:#efe6cf;aspect-ratio:3/4;border-radius:14px;overflow:hidden"><span class="knit-emoji" style="font-size:40px">📑</span></div>`
          : `<div class="photo knit-photo" style="--knit:#efe6cf;aspect-ratio:3/4;border-radius:14px;overflow:hidden"><img src="${esc(f.url)}" alt="${esc(f.fileName||'編み図')}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`}
        <div class="file-tools"><a class="mini" href="${esc(f.url)}" target="_blank" rel="noopener">表示</a><button class="mini del" data-delete-media="pattern-file" data-id="${f.id}" data-blob="${f.blobKey}" data-next="pattern/${id}">🗑</button></div></div>`).join('')}
    </div>
    <div class="panel" style="margin-top:20px">
      <div class="panel-head head-flower">紐づいている作品<span class="en">LINKED</span></div>
      <div class="panel-body">
        ${linked.length?`<div class="list-wrap">${linked.map(w=>`<div class="list-row ${w.ac}" data-go="work/${w.id}" style="cursor:pointer"><div class="l-ico">${w.emoji}</div><div class="l-main"><div class="l-title">${w.title}</div><div class="l-sub">${st(w.status).label}</div></div><span class="meta">›</span></div>`).join('')}</div>`
          :`<div class="empty" style="padding:24px"><div class="e-ico">🧶</div><div class="e-msg">まだ紐づいた作品がないよ</div></div>`}
      </div>
    </div>`;
  }

  /* ===========================================================
     制作ログ（作品別）
     =========================================================== */
  function vLogs(id){
    const w=D.works.find(x=>x.id===id); if(!w) return vNotFound();
    const logs=(w.logs||[]).map(k=>D.logs[k]).filter(Boolean);
    const total=logs.reduce((a,b)=>a+b.minutes,0);
    return `
    <button class="backbtn" data-route="work/${id}">← ${w.title} へ</button>
    <div class="sec-title ac-sky">
      <span class="ico">${ICON.tools}</span>
      <div class="ttl-box"><h1>制作ログ</h1><span class="en">WORK LOG ・ ${w.title}</span></div>
      <span class="spacer"></span>
      <div class="log-total">合計 <b>${fmtMin(total)}</b></div>
    </div>
    <form class="panel log-form" data-save="work-log" data-id="${id}">
      <div class="panel-head head-leaf">ログを追加<span class="en">NEW LOG</span></div>
      <div class="panel-body">
        <div class="form-grid">
          <div class="field date-field"><label>記録日</label>${dateSelect('log_date', today(), { required:true })}</div>
          <div class="field"><label>開始時刻</label><input class="input" name="start_time" type="time"></div>
          <div class="field"><label>終了時刻</label><input class="input" name="end_time" type="time"></div>
          <div class="field"><label>作業時間（分・手入力）</label><input class="input" name="work_minutes" type="number" placeholder="開始/終了がない時だけ"></div>
          <div class="field span3"><label>作業内容</label><input class="input" name="content" placeholder="例：袖をとじて仕上げ"></div>
        </div>
        <div class="form-actions" style="justify-content:flex-start;margin-top:16px">
          <button class="btn btn-leaf">＋ 記録する</button>
          <span class="auto-note">開始〜終了が入っていれば自動計算。ない時だけ分数を手入力 ⏱</span>
        </div>
      </div>
    </form>
    <div class="log-list">
      ${logs.length?logs.map(l=>`<div class="panel log-row"><div class="lr-date"><div class="d">${l.date}</div><div class="t">${l.start}–${l.end}</div></div>
        <div class="lr-time"><span class="bell-coin" style="background:radial-gradient(circle at 35% 30%,#c2f0e6,var(--leaf) 60%);color:#fff">⏱</span>${fmtMin(l.minutes)}</div>
        <div class="lr-content">${l.content}</div>
        <div class="lr-tools"><button class="mini">✎</button><button class="mini del" data-delete="work-log" data-id="${l.id||''}" data-work-id="${id}" data-next="logs/${id}">🗑</button></div></div>`).join('')
        :`<div class="empty"><div class="e-ico">📝</div><div class="e-msg">まだログがないよ。上から記録してね！</div></div>`}
    </div>`;
  }

  /* ===========================================================
     編みたいもの
     =========================================================== */
  function vWishlist(){
    return `
    <div class="sec-title ac-lemon">
      <span class="ico">${ICON.wishlist}</span>
      <div class="ttl-box"><h1>編みたいものリスト</h1><span class="en">WISH LIST</span></div>
      <span class="spacer"></span>
      <button class="btn btn-bell" data-route="wish-edit/new">＋ 追加する</button>
    </div>
    <div class="grid-2">
      ${D.wishlist.length ? D.wishlist.slice().sort((a,b)=>b.priority-a.priority).map(w=>`
        <div class="panel wish-card ${w.ac}">
          <div class="wish-photo">${photo(w.knit,w.image||w.emoji,46)}<span class="corner">${w.corner}</span><span class="prio-tag pri${w.priority}">優先度 ${D.priorityMap[w.priority]}</span></div>
          <div class="wish-body">
            <div class="ttl">${w.title}</div>
            <div class="wish-meta"><span class="pill pill-sky">${w.recipient}</span>${w.deadline?`<span class="pill pill-coral">〆 ${w.deadline}</span>`:'<span class="pill pill-grey">締切なし</span>'}</div>
            <div class="wish-memo">${w.memo}</div>
            <div class="wish-foot">
              <span class="meta">登録 ${w.registered}</span>
              <span class="spacer"></span>
              <button class="btn btn-leaf btn-sm" data-action="wish-to-work" data-id="${w.id}">🧶 作品にする</button>
              <button class="mini" data-route="wish-edit/${w.id}">✎</button><button class="mini del" data-delete="wish" data-id="${w.id}" data-next="wishlist">🗑</button>
            </div>
          </div>
        </div>`).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e-ico">💛</div><div class="e-msg">編みたいものを追加してみよう</div></div>`}
    </div>`;
  }

  /* ===========================================================
     用具
     =========================================================== */
  function vTools(){
    const cats=[...new Set(D.tools.map(t=>t.category))];
    return `
    <div class="sec-title ac-sky">
      <span class="ico">${ICON.tools}</span>
      <div class="ttl-box"><h1>用具コレクション</h1><span class="en">TOOLS</span></div>
      <span class="spacer"></span>
      <button class="btn btn-cream btn-sm" data-route="sites">購入サイト</button>
      <button class="btn btn-sky" data-route="tool-edit/new">＋ 用具を登録</button>
    </div>
    ${cats.length ? cats.map(c=>`<div class="tool-group">
      <div class="tg-head"><span class="tg-dot"></span>${c}</div>
      <div class="grid-3">
        ${D.tools.filter(t=>t.category===c).map(t=>`<div class="panel tool-card ${t.ac}">
          <div class="t-ico">${t.image?`<img src="${esc(t.image.url)}" alt="${esc(t.name)}">`:t.emoji}</div>
          <div class="t-main"><div class="t-name">${t.name}</div><div class="t-sub">${t.maker}</div>
            <div class="t-tags"><span class="pill pill-sky">${t.size}</span></div>
            ${t.memo?`<div class="t-memo">${t.memo}</div>`:''}
          </div>
          <div class="t-tools"><button class="mini" data-action="move-tool" data-id="${t.id}" data-dir="up">↑</button><button class="mini" data-action="move-tool" data-id="${t.id}" data-dir="down">↓</button><button class="mini" data-action="copy-tool" data-id="${t.id}">⧉</button><button class="mini" data-route="tool-edit/${t.id}">✎</button><button class="mini del" data-delete="tool" data-id="${t.id}" data-next="tools">🗑</button></div>
        </div>`).join('')}
      </div>
    </div>`).join('') : `<div class="empty"><div class="e-ico">🪡</div><div class="e-msg">用具を登録してみよう</div></div>`}`;
  }

  /* ===========================================================
     バックアップ
     =========================================================== */
  function vBackup(){
    return `
    <div class="sec-title ac-leaf">
      <span class="ico">${ICON.backup}</span>
      <div class="ttl-box"><h1>バックアップ</h1><span class="en">BACKUP & RESTORE</span></div>
    </div>
    <div class="backup-note">編んだ記録は、あなたの端末の中だけに保存されています 🏝<br>大切なデータは、ときどきJSONファイルに書き出して保管しておきましょう。</div>
    <div class="grid-2" style="margin-top:8px">
      <div class="panel backup-card">
        <div class="panel-head head-leaf">エクスポート<span class="en">EXPORT</span></div>
        <div class="panel-body bk-body">
          <div class="bk-ico">📤</div>
          <p>すべてのデータ（作品・毛糸・編み図・ログ・用具・編みたいもの）を1つのJSONファイルに書き出します。</p>
          <div class="bk-stat">作品 ${D.works.length}・毛糸 ${D.yarns.length}・編み図 ${D.patterns.length}・用具 ${D.tools.length}</div>
          <button class="btn btn-leaf btn-lg" data-action="export-backup">💾 JSONを書き出す</button>
        </div>
      </div>
      <div class="panel backup-card">
        <div class="panel-head head-sky" style="--head-c:#7fcdf2;--head-d:var(--sky-btn-d)">インポート<span class="en">IMPORT</span></div>
        <div class="panel-body bk-body">
          <div class="bk-ico">📥</div>
          <p>書き出したJSONファイルから、データを復元します。</p>
          <label class="uploader" style="min-height:110px">
            <input type="file" accept="application/json,.json" data-upload="backup-json" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px">
            <div class="up-ico">📁</div><div>JSONファイルを選択</div>
          </label>
          <div class="bk-stat" id="backupImportStatus">選択したJSONを読み込むと、端末内のデータを置き換えます</div>
        </div>
      </div>
    </div>`;
  }

  /* ===========================================================
     購入サイト
     =========================================================== */
  function vSites(){
    return `
    <div class="sec-title ac-leaf">
      <span class="ico">${ICON.backup}</span>
      <div class="ttl-box"><h1>購入サイト</h1><span class="en">SHOP LINKS</span></div>
      <span class="spacer"></span>
      <button class="btn btn-leaf" data-route="site-edit/new">＋ サイトを登録</button>
    </div>
    <div class="grid-2">
      ${D.sites?.length ? D.sites.map(s=>`<div class="panel ${s.ac}">
        <div class="panel-body">
          <div class="y-name"><div class="n">${esc(s.name)}</div><div class="m">${s.url?`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>`:'URL未登録'}</div></div>
          ${s.memo?`<div class="t-memo">${esc(s.memo)}</div>`:''}
          <div class="form-actions" style="margin-top:14px;padding-top:12px">
            <button type="button" class="btn btn-cream btn-sm" data-route="site-edit/${s.id}">✎ 編集</button>
            <button type="button" class="btn btn-cream btn-sm" data-delete="site" data-id="${s.id}" data-next="sites">削除</button>
          </div>
        </div>
      </div>`).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e-ico">🔗</div><div class="e-msg">よく使う毛糸やさんを登録しよう</div></div>`}
    </div>`;
  }

  function vSiteEdit(id){
    const isNew = id==='new';
    const s = isNew ? {name:'',url:'',memo:''} : D.sites.find(x=>x.id===id);
    if(!s) return vNotFound();
    return `
    <button class="backbtn" data-route="sites">← 購入サイトへ</button>
    <div class="sec-title ac-leaf">
      <span class="ico">${ICON.backup}</span>
      <div class="ttl-box"><h1>${isNew?'サイトを登録':'サイトを編集'}</h1><span class="en">${isNew?'NEW SHOP':'EDIT SHOP'}</span></div>
    </div>
    <form class="panel" data-save="site" data-id="${id}"><div class="panel-body" style="padding:24px">
      <div class="form-grid">
        <div class="field"><label>サイト名 <span class="req">必須</span></label><input class="input" name="name" value="${esc(s.name)}" placeholder="例：ユザワヤオンライン" required></div>
        <div class="field span2"><label>URL</label><input class="input" name="url" type="url" value="${esc(s.url)}" placeholder="https://..."></div>
        <div class="field span3"><label>メモ</label><textarea class="textarea" name="memo" placeholder="送料、よく買う毛糸、ポイントなど">${esc(s.memo||'')}</textarea></div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="sites">キャンセル</button>
        <button class="btn btn-leaf btn-lg">💾 保存する</button>
      </div>
    </div></form>`;
  }

  /* ===========================================================
     毛糸 登録・編集フォーム
     =========================================================== */
  function vYarnEdit(id){
    const isNew = id==='new';
    const y = isNew ? {maker:'',name:'',color:'',material:'',weight:'',price:'',stock:'',memo:''} : D.yarns.find(x=>x.id===id);
    if(!y) return vNotFound();
    return `
    <button class="backbtn" data-route="${isNew?'yarns':'yarn/'+id}">← もどる</button>
    <div class="sec-title ac-coral">
      <span class="ico" style="background:var(--coral);box-shadow:0 4px 0 var(--coral-d)">${ICON.yarns}</span>
      <div class="ttl-box"><h1>${isNew?'毛糸を登録':'毛糸を編集'}</h1><span class="en">${isNew?'NEW YARN':'EDIT YARN'}</span></div>
    </div>
    <form class="panel" data-save="yarn" data-id="${id}"><div class="panel-body" style="padding:24px">
      <div class="form-grid">
        <div class="field"><label>メーカー <span class="req">必須</span></label><input class="input" name="manufacturer" value="${y.maker}" placeholder="例：ハマナカ" required></div>
        <div class="field span2"><label>商品名 <span class="req">必須</span></label><input class="input" name="name" value="${y.name}" placeholder="例：ピッコロ" required></div>
        <div class="field"><label>色名・色番</label><input class="input" name="color" value="${y.color}" placeholder="例：生成り (2)"></div>
        <div class="field"><label>素材</label><input class="input" name="material" value="${esc(y.material||'')}" placeholder="例：ウール80 ナイロン20"></div>
        <div class="field"><label>標準重量（g/玉）</label><input class="input" name="weight_g" type="number" value="${y.weight||''}" placeholder="25"></div>
        <div class="field"><label>参考価格（ベル）</label><input class="input" name="price_reference" type="number" value="${y.price||''}" placeholder="330"></div>
        <div class="field"><label>在庫量（g）</label><input class="input" name="stock_g" type="number" value="${y.stock||''}" placeholder="0"></div>
        <div class="field span3"><label>メモ</label><textarea class="textarea" name="memo" placeholder="使い心地や購入店など">${y.memo||''}</textarea></div>
      </div>
      <div class="field" style="margin-top:18px"><label>毛糸写真</label>
        ${isNew
          ? `<div class="uploader"><div class="up-ico">📷</div><div>保存後、編集画面で追加できます<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリから選択</span></div></div>`
          : `<label class="uploader"><input type="file" accept="image/*" data-upload="yarn-image" data-id="${id}" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px"><div class="up-ico">📷</div><div>${y.image?'写真を差し替える':'タップして写真を追加'}<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリから選択</span></div></label>`}
      </div>
      ${!isNew && y.image ? `<div class="img-manage" style="margin-top:16px"><div class="panel img-card ${y.ac}">${photo('#f3ead6',y.image,44)}<div class="img-cap"><input class="input" value="${esc(y.image.fileName||'毛糸写真')}" disabled></div><div class="img-tools"><button class="mini del" data-delete-media="yarn-image" data-id="${y.id}" data-blob="${y.image.blobKey}" data-next="yarn-edit/${y.id}">🗑</button></div></div></div>`:''}
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="${isNew?'yarns':'yarn/'+id}">キャンセル</button>
        <button class="btn btn-coral btn-lg">💾 保存する</button>
      </div>
    </div></form>`;
  }

  /* ===========================================================
     編み図 登録・編集フォーム
     =========================================================== */
  function vPatternEdit(id){
    const isNew = id==='new';
    const p = isNew ? {title:'',memo:''} : D.patterns.find(x=>x.id===id);
    if(!p) return vNotFound();
    return `
    <button class="backbtn" data-route="${isNew?'patterns':'pattern/'+id}">← もどる</button>
    <div class="sec-title ac-grape">
      <span class="ico" style="background:var(--grape);box-shadow:0 4px 0 var(--grape-d)">${ICON.patterns}</span>
      <div class="ttl-box"><h1>${isNew?'編み図を登録':'編み図を編集'}</h1><span class="en">${isNew?'NEW PATTERN':'EDIT PATTERN'}</span></div>
    </div>
    <form class="panel" data-save="pattern" data-id="${id}"><div class="panel-body" style="padding:24px">
      <div class="form-grid">
        <div class="field span3"><label>タイトル <span class="req">必須</span></label><input class="input" name="title" value="${p.title}" placeholder="例：まんまるアミグルミの編み方" required></div>
        <div class="field span3"><label>メモ</label><textarea class="textarea" name="memo" placeholder="掲載誌・サイズ・ポイントなど">${p.memo||''}</textarea></div>
      </div>
      <div class="field" style="margin-top:18px"><label>編み図ファイル（画像 / PDF）</label>
        ${isNew
          ? `<div class="uploader"><div class="up-ico">📄</div><div>保存後、詳細画面で追加できます<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリ / ファイルから選択</span></div></div>`
          : `<label class="uploader"><input type="file" accept="image/*,application/pdf" multiple data-upload="pattern-files" data-id="${id}" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px"><div class="up-ico">📄</div><div>タップして編み図ファイルを追加<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリ / ファイルから選択</span></div></label>`}
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="${isNew?'patterns':'pattern/'+id}">キャンセル</button>
        <button class="btn btn-purple btn-lg" style="--btn-edge:var(--grape-d);background:var(--grape)">💾 保存する</button>
      </div>
    </div></form>`;
  }

  /* ===========================================================
     用具 登録・編集フォーム
     =========================================================== */
  function vToolEdit(id){
    const isNew = id==='new';
    const t = isNew ? {name:'',category:'かぎ針',maker:'',size:'',memo:''} : D.tools.find(x=>x.id===id);
    if(!t) return vNotFound();
    const cats=['棒針','かぎ針','輪針','とじ針','補助','その他'];
    return `
    <button class="backbtn" data-route="tools">← 用具コレクションへ</button>
    <div class="sec-title ac-sky">
      <span class="ico" style="background:var(--sky-btn);box-shadow:0 4px 0 var(--sky-btn-d)">${ICON.tools}</span>
      <div class="ttl-box"><h1>${isNew?'用具を登録':'用具を編集'}</h1><span class="en">${isNew?'NEW TOOL':'EDIT TOOL'}</span></div>
    </div>
    <form class="panel" data-save="tool" data-id="${id}"><div class="panel-body" style="padding:24px">
      <div class="form-grid">
        <div class="field span2"><label>用具名 <span class="req">必須</span></label><input class="input" name="name" value="${t.name}" placeholder="例：クロバー アミュレ かぎ針" required></div>
        <div class="field"><label>種別</label><select class="select" name="category">${cats.map(c=>`<option ${c===t.category?'selected':''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label>メーカー</label><input class="input" name="maker" value="${t.maker}" placeholder="例：クロバー"></div>
        <div class="field"><label>サイズ</label><input class="input" name="size" value="${t.size}" placeholder="例：4/0号 / 5号 / 80cm"></div>
        <div class="field span3"><label>メモ</label><textarea class="textarea" name="memo" placeholder="使い心地など">${t.memo||''}</textarea></div>
      </div>
      <div class="field" style="margin-top:18px"><label>用具写真</label>
        ${isNew
          ? `<div class="uploader"><div class="up-ico">📷</div><div>保存後、編集画面で追加できます<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリから選択</span></div></div>`
          : `<label class="uploader"><input type="file" accept="image/*" data-upload="tool-image" data-id="${id}" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px"><div class="up-ico">📷</div><div>${t.image?'写真を差し替える':'タップして写真を追加'}<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリから選択</span></div></label>`}
      </div>
      ${!isNew && t.image ? `<div class="img-manage" style="margin-top:16px"><div class="panel img-card ${t.ac}">${photo('#efe6cf',t.image,44)}<div class="img-cap"><input class="input" value="${esc(t.image.fileName||'用具写真')}" disabled></div><div class="img-tools"><button class="mini del" data-delete-media="tool-image" data-id="${t.id}" data-blob="${t.image.blobKey}" data-next="tool-edit/${t.id}">🗑</button></div></div></div>`:''}
      ${!isNew ? `<div class="panels" style="margin-top:18px">
        <div class="panel">
          <div class="panel-head head-bell">購入履歴<span class="en">PURCHASE</span></div>
          <div class="panel-body">
            ${t.purchases?.length ? `<table class="gtable"><thead><tr><th>購入日</th><th>購入元</th><th class="num">数量</th><th class="num">金額</th></tr></thead><tbody>
              ${t.purchases.map(p=>`<tr><td>${p.date}</td><td>${p.siteUrl?`<a href="${esc(p.siteUrl)}" target="_blank" rel="noopener">${esc(p.shop)}</a>`:esc(p.shop)}</td><td class="num">${p.quantity||''}</td><td class="num cost">${yen(p.price)}</td></tr>`).join('')}
            </tbody></table>` : `<div class="empty" style="padding:24px"><div class="e-ico">🧾</div><div class="e-msg">購入履歴がまだないよ</div></div>`}
            <button class="btn btn-bell btn-sm addbtn" type="button" data-route="tool-purchase-edit/${id}">＋ 購入履歴</button>
          </div>
        </div>
      </div>`:''}
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="tools">キャンセル</button>
        <button class="btn btn-sky btn-lg">💾 保存する</button>
      </div>
    </div></form>`;
  }

  /* ===========================================================
     編みたいもの 登録・編集フォーム
     =========================================================== */
  function vWishEdit(id){
    const isNew = id==='new';
    const w = isNew ? {title:'',registered:'',deadline:'',recipient:'じぶん用',priority:2,memo:''} : D.wishlist.find(x=>x.id===id);
    if(!w) return vNotFound();
    return `
    <button class="backbtn" data-route="wishlist">← 編みたいものリストへ</button>
    <div class="sec-title ac-lemon">
      <span class="ico" style="background:var(--lemon);box-shadow:0 4px 0 var(--lemon-d)">${ICON.wishlist}</span>
      <div class="ttl-box"><h1>${isNew?'編みたいものを追加':'編みたいものを編集'}</h1><span class="en">${isNew?'NEW WISH':'EDIT WISH'}</span></div>
    </div>
    <form class="panel" data-save="wish" data-id="${id}"><div class="panel-body" style="padding:24px">
      <div class="form-grid">
        <div class="field span2"><label>タイトル <span class="req">必須</span></label><input class="input" name="title" value="${w.title}" placeholder="例：グラニースクエアのバッグ" required></div>
        <div class="field wish-recipient"><label>作成相手</label><input class="input" name="recipient" value="${w.recipient}" placeholder="例：じぶん用"></div>
        <div class="field date-field"><label>登録日</label>${dateSelect('registered', w.registered || today())}</div>
        <div class="field date-field"><label>締切</label>${dateSelect('deadline', w.deadline)}</div>
        <div class="field span2"><label>優先度</label><input type="hidden" name="priority" value="${w.priority}"><div class="seg">${[[3,'高'],[2,'中'],[1,'低']].map(([v,l])=>`<button type="button" aria-pressed="${v===w.priority}" data-prio="${v}">${l}</button>`).join('')}</div></div>
        <div class="field span3"><label>メモ</label><textarea class="textarea" name="memo" placeholder="どんなものを作りたい？">${w.memo||''}</textarea></div>
      </div>
      <div class="field" style="margin-top:18px"><label>イメージ画像</label>
        ${isNew
          ? `<div class="uploader" style="min-height:120px"><div class="up-ico">🖼️</div><div>保存後、編集画面で追加できます<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリ / ファイルから選択</span></div></div>`
          : `<label class="uploader" style="min-height:120px"><input type="file" accept="image/*" data-upload="wish-image" data-id="${id}" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px"><div class="up-ico">🖼️</div><div>タップして画像を選択<br><span style="font-weight:600;font-size:12px">写真を撮る / 写真ライブラリ / ファイルから選択</span></div></label>`}
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="wishlist">キャンセル</button>
        <button class="btn btn-bell btn-lg">💾 保存する</button>
      </div>
    </div></form>`;
  }

  /* ===========================================================
     毛糸 購入履歴追加
     =========================================================== */
  function vYarnPurchaseEdit(id){
    const y=D.yarns.find(x=>x.id===id); if(!y) return vNotFound();
    return `
    <button class="backbtn" data-route="yarn/${id}">← ${y.name} へ</button>
    <div class="sec-title ac-bell">
      <span class="ico" style="background:var(--bell);box-shadow:0 4px 0 var(--bell-d)">${ICON.yarns}</span>
      <div class="ttl-box"><h1>購入履歴を追加</h1><span class="en">PURCHASE ・ ${y.name}</span></div>
    </div>
    <form class="panel" data-save="purchase" data-id="${id}"><div class="panel-body" style="padding:24px">
      <div class="form-grid">
        <div class="field date-field"><label>購入日 <span class="req">必須</span></label>${dateSelect('purchase_date', today(), { required:true })}</div>
        <div class="field"><label>購入価格（ベル）</label><input class="input" name="price" type="number" placeholder="${y.price||0}"></div>
        <div class="field"><label>購入量（g）</label><input class="input" name="weight_g" type="number" placeholder="${y.weight||50}"></div>
        <div class="field"><label>購入サイト</label><select class="select" name="site_id"><option value="">未選択</option>${(D.sites||[]).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
        <div class="field"><label>購入店メモ</label><input class="input" name="shop_name" placeholder="例：実店舗 / イベント"></div>
        <div class="field span3"><label>備考</label><textarea class="textarea" name="memo" placeholder="セール、ロット、使う予定など"></textarea></div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="yarn/${id}">キャンセル</button>
        <button class="btn btn-bell btn-lg">💾 保存する</button>
      </div>
    </div></form>`;
  }

  function vToolPurchaseEdit(id){
    const t=D.tools.find(x=>x.id===id); if(!t) return vNotFound();
    return `
    <button class="backbtn" data-route="tool-edit/${id}">← ${t.name} へ</button>
    <div class="sec-title ac-bell">
      <span class="ico" style="background:var(--bell);box-shadow:0 4px 0 var(--bell-d)">${ICON.tools}</span>
      <div class="ttl-box"><h1>用具の購入履歴を追加</h1><span class="en">PURCHASE ・ ${t.name}</span></div>
    </div>
    <form class="panel" data-save="tool-purchase" data-id="${id}"><div class="panel-body" style="padding:24px">
      <div class="form-grid">
        <div class="field date-field"><label>購入日 <span class="req">必須</span></label>${dateSelect('purchase_date', today(), { required:true })}</div>
        <div class="field"><label>購入価格（ベル）</label><input class="input" name="price" type="number"></div>
        <div class="field"><label>数量</label><input class="input" name="quantity" type="number" value="1"></div>
        <div class="field"><label>購入サイト</label><select class="select" name="site_id"><option value="">未選択</option>${(D.sites||[]).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
        <div class="field"><label>購入店メモ</label><input class="input" name="shop_name" placeholder="例：実店舗 / イベント"></div>
        <div class="field span3"><label>備考</label><textarea class="textarea" name="memo" placeholder="交換針セット、セールなど"></textarea></div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="tool-edit/${id}">キャンセル</button>
        <button class="btn btn-bell btn-lg">💾 保存する</button>
      </div>
    </div></form>`;
  }

  /* ===========================================================
     作品 使用毛糸追加
     =========================================================== */
  function vWorkYarnEdit(id){
    const w=D.works.find(x=>x.id===id); if(!w) return vNotFound();
    const selected=D.yarns[0]||{};
    return `
    <button class="backbtn" data-route="work/${id}">← ${w.title} へ</button>
    <div class="sec-title ac-bell">
      <span class="ico" style="background:var(--bell);box-shadow:0 4px 0 var(--bell-d)">${ICON.yarns}</span>
      <div class="ttl-box"><h1>使用毛糸を追加</h1><span class="en">WORK YARN ・ ${w.title}</span></div>
    </div>
    <form class="panel" data-save="work-yarn" data-id="${id}"><div class="panel-body" style="padding:24px">
      <div class="form-grid">
        <div class="field span2"><label>毛糸 <span class="req">必須</span></label><select class="select" name="yarn_id" required>
          ${D.yarns.map(y=>`<option value="${y.id}">${y.maker} ${y.name} / ${y.color}</option>`).join('')}
        </select></div>
        <div class="field"><label>使用量（g） <span class="req">必須</span></label><input class="input" name="used_g" type="number" placeholder="例：40" required></div>
        <div class="field"><label>使用時g単価</label><input class="input" name="unit_price_per_g" type="number" step="0.1" value="${selected.price&&selected.weight?(selected.price/selected.weight).toFixed(1):''}" placeholder="自動計算可"></div>
        <div class="field"><label>使用原価（ベル）</label><input class="input" type="number" placeholder="使用量 × g単価" disabled></div>
        <div class="field span3"><label>メモ</label><textarea class="textarea" name="memo" placeholder="どのパーツに使ったか、ロット違いなど"></textarea></div>
      </div>
      <div class="concept" style="background:#fff7e6"><b><span class="leaf"></span>原価メモ</b>使用時のg単価と原価はここで固定。毛糸マスタの価格が変わっても、この作品の材料原価は変えません。</div>
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="work/${id}">キャンセル</button>
        <button class="btn btn-bell btn-lg">💾 保存する</button>
      </div>
    </div></form>`;
  }

  /* ===========================================================
     作品 編み図紐づけ
     =========================================================== */
  function vWorkPatternLink(id){
    const w=D.works.find(x=>x.id===id); if(!w) return vNotFound();
    const linked=new Set(w.patterns||[]);
    return `
    <button class="backbtn" data-route="work/${id}">← ${w.title} へ</button>
    <div class="sec-title ac-grape">
      <span class="ico" style="background:var(--grape);box-shadow:0 4px 0 var(--grape-d)">${ICON.patterns}</span>
      <div class="ttl-box"><h1>編み図を紐づけ</h1><span class="en">LINK PATTERN ・ ${w.title}</span></div>
    </div>
    <form class="panel" data-save="work-patterns" data-id="${id}"><div class="panel-body" style="padding:18px">
      <div class="list-wrap">
        ${D.patterns.length ? D.patterns.map(p=>`<div class="list-row ${p.ac}">
          <div class="l-ico">${p.emoji}</div>
          <div class="l-main"><div class="l-title">${p.title}</div><div class="l-sub">${p.memo}・ファイル ${p.files.length}件</div></div>
          <label class="btn ${linked.has(p.id)?'btn-cream':'btn-wood'} btn-sm"><input type="checkbox" name="pattern_id" value="${p.id}" ${linked.has(p.id)?'checked':''} style="accent-color:var(--grape)"> ${linked.has(p.id)?'紐づけ済み':'選択'}</label>
        </div>`).join('') : `<div class="empty"><div class="e-ico">📄</div><div class="e-msg">先に編み図を登録してね</div></div>`}
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="work/${id}">キャンセル</button>
        <button class="btn btn-wood btn-lg">保存する</button>
      </div>
    </div></form>`;
  }

  /* ===========================================================
     作品 用具紐づけ
     =========================================================== */
  function vWorkToolLink(id){
    const w=D.works.find(x=>x.id===id); if(!w) return vNotFound();
    const linked=new Set(w.tools||[]);
    return `
    <button class="backbtn" data-route="work/${id}">← ${w.title} へ</button>
    <div class="sec-title ac-sky">
      <span class="ico" style="background:var(--sky-btn);box-shadow:0 4px 0 var(--sky-btn-d)">${ICON.tools}</span>
      <div class="ttl-box"><h1>用具を紐づけ</h1><span class="en">LINK TOOL ・ ${w.title}</span></div>
    </div>
    <form class="panel" data-save="work-tools" data-id="${id}"><div class="panel-body" style="padding:18px">
      <div class="grid-3">
        ${D.tools.length ? D.tools.map(t=>`<div class="panel tool-card ${t.ac}">
          <div class="t-ico">${t.emoji}</div>
          <div class="t-main"><div class="t-name">${t.name}</div><div class="t-sub">${t.category}・${t.maker}</div><div class="t-tags"><span class="pill pill-sky">${t.size}</span></div></div>
          <label class="mini" style="display:grid;place-items:center"><input type="checkbox" name="tool_id" value="${t.id}" ${linked.has(t.id)?'checked':''} style="accent-color:var(--sky-btn)"> ${linked.has(t.id)?'済':'＋'}</label>
        </div>`).join('') : `<div class="empty" style="grid-column:1/-1"><div class="e-ico">🪡</div><div class="e-msg">先に用具を登録してね</div></div>`}
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-cream" data-route="work/${id}">キャンセル</button>
        <button class="btn btn-sky btn-lg">保存する</button>
      </div>
    </div></form>`;
  }

  function vNotFound(){ return `<div class="empty"><div class="e-ico">🍂</div><div class="e-msg">ページが見つからないよ</div><button class="btn btn-flower" data-route="home" style="margin-top:16px">ホームへ</button></div>`; }

  /* ===========================================================
     ルーター
     =========================================================== */
  const routes = {
    home:vHome, works:vWorks, work:vWork, 'work-edit':vWorkEdit, 'work-images':vWorkImages,
    yarns:vYarns, yarn:vYarn, 'yarn-edit':vYarnEdit, 'yarn-purchase-edit':vYarnPurchaseEdit,
    'work-yarn-edit':vWorkYarnEdit, 'work-pattern-link':vWorkPatternLink, 'work-tool-link':vWorkToolLink,
    patterns:vPatterns, pattern:vPattern, 'pattern-edit':vPatternEdit,
    logs:vLogs, wishlist:vWishlist, 'wish-edit':vWishEdit, tools:vTools, 'tool-edit':vToolEdit, 'tool-purchase-edit':vToolPurchaseEdit,
    sites:vSites, 'site-edit':vSiteEdit, backup:vBackup
  };
  const navOf = { work:'works','work-edit':'works','work-images':'works', yarn:'yarns','yarn-edit':'yarns',
    'yarn-purchase-edit':'yarns','work-yarn-edit':'works','work-pattern-link':'works','work-tool-link':'works',
    pattern:'patterns','pattern-edit':'patterns', logs:'works', 'wish-edit':'wishlist', 'tool-edit':'tools',
    'tool-purchase-edit':'tools', sites:'tools', 'site-edit':'tools' };

  function parseHash(){
    const h=location.hash.replace(/^#/,'')||'home';
    const [route,param]=h.split('/');
    return {route, param};
  }
  function render(){
    const {route,param}=parseHash();
    const fn=routes[route]||vNotFound;
    const view=document.getElementById('view');
    view.innerHTML=fn(param);
    // nav active
    const navKey=navOf[route]||route;
    document.querySelectorAll('.navbtn').forEach(b=>b.setAttribute('aria-current', b.dataset.route===navKey?'page':'false'));
    document.querySelector('.backup-btn')?.setAttribute('aria-current', route==='backup'?'page':'false');
    // post-render bindings
    bindCards();
    bindDateCombos();
    if(route==='works'){ bindWorksControls(); renderWorkGrid(); }
    if(route==='yarns'){ bindYarnControls(); renderYarnGrid(); }
    if(route==='work-edit'||route==='wish-edit') bindSeg();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function go(r){
    const next = '#'+r;
    if(location.hash === next) render();
    else location.hash = next;
  }

  function bindCards(){
    document.querySelectorAll('[data-go]').forEach(el=>{
      if(el._bound) return; el._bound=true;
      el.style.cursor='pointer';
      el.addEventListener('click',(e)=>{ if(e.target.closest('button,input,.mini')) return; go(el.dataset.go); });
    });
    document.querySelectorAll('[data-route]').forEach(el=>{
      if(el._bound) return; el._bound=true;
      el.addEventListener('click',()=>go(el.dataset.route));
    });
  }
  function bindWorksControls(){
    const sort=document.getElementById('workSort'); if(sort){ sort.value=worksSort; sort.onchange=()=>{worksSort=sort.value;renderWorkGrid();}; }
    const search=document.getElementById('workSearch'); if(search){ search.oninput=()=>{worksQuery=search.value;renderWorkGrid();}; }
    const fb=document.getElementById('workFilters'); if(fb) fb.onclick=(e)=>{ const c=e.target.closest('.chip'); if(!c)return;
      worksFilter=c.dataset.f; fb.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===c)); renderWorkGrid(); };
  }
  function bindYarnControls(){
    const s=document.getElementById('yarnSearch'); if(s) s.oninput=()=>{yarnQuery=s.value;renderYarnGrid();};
  }
  function bindSeg(){
    document.querySelectorAll('.seg').forEach(seg=>{
      seg.onclick=(e)=>{ const b=e.target.closest('button'); if(!b)return;
        seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));
        const hidden = seg.parentElement?.querySelector('input[type="hidden"]');
        if(hidden) hidden.value = b.dataset.stk || b.dataset.prio || b.dataset.sale || hidden.value;
      };
    });
  }
  function syncDateCombo(combo){
    const hidden = combo.parentElement?.querySelector(`input[name="${combo.dataset.dateCombo}"]`);
    const year = combo.querySelector('[data-date-part="year"]')?.value || '';
    const month = combo.querySelector('[data-date-part="month"]')?.value || '';
    const daySelect = combo.querySelector('[data-date-part="day"]');
    if(!hidden || !daySelect) return;
    const previous = daySelect.value || daySelect.dataset.selectedDay || '';
    const maxDay = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;
    daySelect.innerHTML = '<option value="">日</option>' + Array.from({length:maxDay},(_,i)=>i+1)
      .map(v=>`<option value="${String(v).padStart(2,'0')}">${v}</option>`).join('');
    if(previous && Number(previous) <= maxDay) daySelect.value = previous;
    daySelect.dataset.selectedDay = daySelect.value;
    hidden.value = year && month && daySelect.value ? `${year}-${month}-${daySelect.value}` : '';
  }
  function bindDateCombos(){
    document.querySelectorAll('[data-date-combo]').forEach(combo=>{
      syncDateCombo(combo);
      combo.onchange=()=>syncDateCombo(combo);
    });
  }

  async function saveForm(form){
    if(!window.AyaamiDB) throw new Error('DB準備中です。少し待ってからもう一度お試しください。');
    const kind=form.dataset.save, id=form.dataset.id, data=formDataObject(form);
    let saved, next;
    if(kind==='work'){ saved=await window.AyaamiDB.saveWork(id,data); next='work/'+saved.id; }
    else if(kind==='yarn'){ saved=await window.AyaamiDB.saveYarn(id,data); next='yarn/'+saved.id; }
    else if(kind==='pattern'){ saved=await window.AyaamiDB.savePattern(id,data); next='pattern/'+saved.id; }
    else if(kind==='tool'){ saved=await window.AyaamiDB.saveTool(id,data); next=id==='new' ? 'tool-edit/'+saved.id : 'tools'; }
    else if(kind==='site'){ await window.AyaamiDB.saveSite(id,data); next='sites'; }
    else if(kind==='wish'){ await window.AyaamiDB.saveWish(id,data); next='wishlist'; }
    else if(kind==='purchase'){ await window.AyaamiDB.savePurchase(id,data); next='yarn/'+id; }
    else if(kind==='tool-purchase'){ await window.AyaamiDB.saveToolPurchase(id,data); next='tool-edit/'+id; }
    else if(kind==='work-yarn'){ await window.AyaamiDB.saveWorkYarn(id,data); next='work/'+id; }
    else if(kind==='work-log'){ await window.AyaamiDB.saveWorkLog(id,data); next='logs/'+id; }
    else if(kind==='work-patterns'){ await window.AyaamiDB.linkPatterns(id, Array.isArray(data.pattern_id)?data.pattern_id:(data.pattern_id?[data.pattern_id]:[])); next='work/'+id; }
    else if(kind==='work-tools'){ await window.AyaamiDB.linkTools(id, Array.isArray(data.tool_id)?data.tool_id:(data.tool_id?[data.tool_id]:[])); next='work/'+id; }
    else return;
    D = window.DATA;
    if(next) go(next);
    else render();
  }

  document.addEventListener('submit', async (e)=>{
    const form=e.target.closest('form[data-save]');
    if(!form) return;
    e.preventDefault();
    const submitter=form.querySelector('button:not([type="button"])');
    try{
      if(submitter) submitter.disabled=true;
      await saveForm(form);
    }catch(err){
      alert(err.message || '保存に失敗しました');
    }finally{
      if(submitter) submitter.disabled=false;
    }
  });

  document.addEventListener('click', async (e)=>{
    const refreshBtn=e.target.closest('[data-action="refresh-app"]');
    if(refreshBtn){
      e.preventDefault();
      refreshBtn.disabled=true;
      refreshBtn.textContent='更新中...';
      try{
        if('serviceWorker' in navigator){
          const regs=await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((reg)=>reg.unregister()));
        }
        if(window.caches){
          const keys=await caches.keys();
          await Promise.all(keys.map((key)=>caches.delete(key)));
        }
      }catch(err){
        console.warn('cache refresh failed', err);
      }finally{
        location.href = `${location.pathname}?app=${APP_VERSION}&t=${Date.now()}${location.hash || ''}`;
      }
      return;
    }
    const copyYarn=e.target.closest('[data-action="copy-yarn"]');
    if(copyYarn){
      e.preventDefault();
      try{
        const yarn=await window.AyaamiDB.copyYarn(copyYarn.dataset.id);
        D = window.DATA;
        go(yarn ? 'yarn-edit/'+yarn.id : 'yarns');
      }catch(err){
        alert(err.message || '毛糸の複製に失敗しました');
      }
      return;
    }
    const copyTool=e.target.closest('[data-action="copy-tool"]');
    if(copyTool){
      e.preventDefault();
      try{
        const tool=await window.AyaamiDB.copyTool(copyTool.dataset.id);
        D = window.DATA;
        go(tool ? 'tool-edit/'+tool.id : 'tools');
      }catch(err){
        alert(err.message || '用具の複製に失敗しました');
      }
      return;
    }
    const exportBtn=e.target.closest('[data-action="export-backup"]');
    if(exportBtn){
      e.preventDefault();
      try{
        exportBtn.disabled=true;
        await window.AyaamiDB.exportBackup();
      }catch(err){
        alert(err.message || 'バックアップの書き出しに失敗しました');
      }finally{
        exportBtn.disabled=false;
      }
      return;
    }
    const moveTool=e.target.closest('[data-action="move-tool"]');
    if(moveTool){
      e.preventDefault();
      try{
        await window.AyaamiDB.moveTool(moveTool.dataset.id, moveTool.dataset.dir);
        D = window.DATA;
        render();
      }catch(err){
        alert(err.message || '用具の並べ替えに失敗しました');
      }
      return;
    }
    const moveWorkImage=e.target.closest('[data-action="move-work-image"]');
    if(moveWorkImage){
      e.preventDefault();
      try{
        await window.AyaamiDB.moveWorkImage(moveWorkImage.dataset.id, moveWorkImage.dataset.dir);
        D = window.DATA;
        render();
      }catch(err){
        alert(err.message || '写真の並び替えに失敗しました');
      }
      return;
    }
    const mediaDel=e.target.closest('[data-delete-media]');
    if(mediaDel){
      e.preventDefault();
      if(!confirm('ファイルを削除します。よろしいですか？')) return;
      try{
        await window.AyaamiDB.deleteMedia(mediaDel.dataset.deleteMedia, mediaDel.dataset.id, mediaDel.dataset.blob);
        D = window.DATA;
        go(mediaDel.dataset.next || 'home');
      }catch(err){
        alert(err.message || 'ファイル削除に失敗しました');
      }
      return;
    }
    const del=e.target.closest('[data-delete]');
    if(del){
      e.preventDefault();
      if(!confirm('削除します。よろしいですか？')) return;
      try{
        await window.AyaamiDB.deleteRecord(del.dataset.delete, del.dataset.id, {workId: del.dataset.workId});
        D = window.DATA;
        go(del.dataset.next || 'home');
      }catch(err){
        alert(err.message || '削除に失敗しました');
      }
      return;
    }
    const action=e.target.closest('[data-action="wish-to-work"]');
    if(!action) return;
    e.preventDefault();
    try{
      const work=await window.AyaamiDB.wishToWork(action.dataset.id);
      D = window.DATA;
      go(work ? 'work/'+work.id : 'works');
    }catch(err){
      alert(err.message || '作品化に失敗しました');
    }
  });

  document.addEventListener('change', async (e)=>{
    const input=e.target.closest('[data-upload]');
    if(!input || !input.files?.length) return;
    try{
      const files=[...input.files];
      if(input.dataset.upload==='work-images') await window.AyaamiDB.saveWorkImages(input.dataset.id, files);
      else if(input.dataset.upload==='pattern-files') await window.AyaamiDB.savePatternFiles(input.dataset.id, files);
      else if(input.dataset.upload==='wish-image') await window.AyaamiDB.saveWishImage(input.dataset.id, files[0]);
      else if(input.dataset.upload==='yarn-image') await window.AyaamiDB.saveYarnImage(input.dataset.id, files[0]);
      else if(input.dataset.upload==='tool-image') await window.AyaamiDB.saveToolImage(input.dataset.id, files[0]);
      else if(input.dataset.upload==='backup-json'){
        if(!confirm('このJSONで端末内のデータを置き換えます。よろしいですか？')) { input.value=''; return; }
        await window.AyaamiDB.importBackup(files[0]);
        const status=document.getElementById('backupImportStatus');
        if(status) status.textContent='復元しました';
      }
      D = window.DATA;
      input.value='';
      if(input.dataset.upload==='backup-json') go('home');
      else render();
    }catch(err){
      alert(err.message || 'ファイル保存に失敗しました');
    }
  });

  /* ---- ナビ構築 ---- */
  function buildNav(){
    const nav=document.querySelector('nav.gnav');
    nav.innerHTML=navItems.map(n=>`<button class="navbtn" data-route="${n.key}"><span class="tile" style="--t:${n.t}">${ICON[n.key]}</span><span class="lbl">${n.label}</span></button>`).join('');
    document.querySelectorAll('.navbtn').forEach(b=>b.addEventListener('click',()=>go(b.dataset.route)));
    document.querySelector('.backup-btn').addEventListener('click',()=>go('backup'));
    document.querySelector('.logo').addEventListener('click',()=>go('home'));
    document.body.insertAdjacentHTML('beforeend', `<button class="app-version" data-action="refresh-app" title="アプリを更新">${APP_VERSION}</button>`);
  }

  window.addEventListener('hashchange',render);
  document.addEventListener('DOMContentLoaded',async ()=>{
    if(window.DATA_READY) await window.DATA_READY;
    D = window.DATA;
    buildNav();
    render();
  });
})();
