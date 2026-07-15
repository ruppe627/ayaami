/* =========================================================
   あやあみ — サンプルデータ（編み物管理）
   ========================================================= */
window.DATA = {
  works: [
    { id:'w1', title:'ケーブル編みセーター', en:'Cable Sweater', category:'ウェア', status:'done',
      recipient:'じぶん用', start:'2026.01.05', completed:'2026.03.15', minutes:2730, price:0,
      concept:'冬のお出かけ用に、ざっくり編めるアラン模様のセーター。生成りの太め毛糸であたたかく。',
      review:'袖の長さがちょうどよくできた！次はもう少し身幅を細くしたい。',
      knit:'#ece1cb', emoji:'🧥', ac:'ac-flower', corner:'🌸',
      images:['🧥','🧶','🪡'], yarns:['wy1','wy2'], patterns:['p1'], tools:['t2','t4'], logs:['l1','l2','l3'] },
    { id:'w2', title:'アミグルミうさぎ', en:'Amigurumi Rabbit', category:'アミグルミ', status:'making',
      recipient:'じぶん用', start:'2026.02.20', completed:'', minutes:750, price:3200, progress:60,
      concept:'まんまるほっぺのうさぎちゃん。リボンはくすみピンクで、お顔は刺繍でやさしい表情に。',
      review:'',
      knit:'#ecdfc8', emoji:'🐰', ac:'ac-coral', corner:'🌷',
      images:['🐰','🧶','🎀'], yarns:['wy3','wy4','wy5'], patterns:['p2'], tools:['t1','t3'], logs:['l4','l5','l6'] },
    { id:'w3', title:'レース編みドイリー', en:'Lace Doily', category:'こもの', status:'done',
      recipient:'お母さん', start:'2026.02.28', completed:'2026.03.15', minutes:540, price:0,
      concept:'母の日のプレゼント。テーブルに飾れる繊細なレースのドイリー。', review:'細い糸で目が揃って大満足。',
      knit:'#efe6cf', emoji:'🪷', ac:'ac-teal', corner:'🌿',
      images:['🪷','🧶'], yarns:['wy6'], patterns:['p3'], tools:['t2'], logs:['l7'] },
    { id:'w4', title:'モチーフブランケット', en:'Motif Blanket', category:'ブランケット', status:'making',
      recipient:'妹に', start:'2026.01.20', completed:'', minutes:1860, price:0, progress:60,
      concept:'お花モチーフをたくさんつないだ、カラフルなひざ掛け。妹のお誕生日に。', review:'',
      knit:'#e4eedd', emoji:'🧶', ac:'ac-grape', corner:'⭐',
      images:['🧶','🌼'], yarns:['wy7','wy8'], patterns:['p2'], tools:['t2'], logs:['l8','l9'] },
    { id:'w5', title:'ふわもこマフラー', en:'Fluffy Muffler', category:'こもの', status:'plan',
      recipient:'彼に', start:'', completed:'', minutes:0, price:0,
      concept:'もこもこのループヤーンで、冬につけたいあったかマフラー。', review:'',
      knit:'#f2dde2', emoji:'🧣', ac:'ac-flower', corner:'🌸',
      images:[], yarns:[], patterns:[], tools:[], logs:[] },
    { id:'w6', title:'お花のコースター', en:'Flower Coaster', category:'こもの', status:'done',
      recipient:'じぶん用', start:'2026.01.10', completed:'2026.01.30', minutes:300, price:600,
      concept:'おうちカフェ用に、お花の形のかわいいコースター4枚セット。', review:'色違いで作ったら食卓が華やかに！',
      knit:'#dcecd9', emoji:'🌸', ac:'ac-leaf', corner:'🍀',
      images:['🌸','🌷','🌼'], yarns:['wy9'], patterns:['p3'], tools:['t1'], logs:['l10'] },
    { id:'w7', title:'ニット帽', en:'Knit Beanie', category:'ウェア', status:'hold',
      recipient:'パパ', start:'2025.12.01', completed:'', minutes:420, price:0,
      concept:'父の誕生日用のシンプルなニット帽。グレー系で。', review:'',
      knit:'#e9e1cc', emoji:'🎩', ac:'ac-lemon', corner:'🌻',
      images:['🎩'], yarns:['wy10'], patterns:[], tools:['t2'], logs:['l11'] },
    { id:'w8', title:'ベビーシューズ', en:'Baby Shoes', category:'ベビー', status:'making',
      recipient:'いとこの子', start:'2026.03.01', completed:'', minutes:210, price:0, progress:35,
      concept:'いとこの赤ちゃんに、やわらかいコットン糸でベビーシューズを。', review:'',
      knit:'#efe1e4', emoji:'👶', ac:'ac-sky', corner:'🫧',
      images:['👶','🧶'], yarns:['wy11'], patterns:['p4'], tools:['t1'], logs:['l12'] }
  ],

  yarns: [
    { id:'y1', maker:'ハマナカ', name:'ピッコロ', color:'生成り (2)', material:'アクリル70 ウール30', weight:25, price:330, stock:120, ac:'ac-flower', emoji:'🧶' },
    { id:'y2', maker:'パピー', name:'クイーンアニー', color:'くすみピンク (974)', material:'ウール100', weight:50, price:550, stock:200, ac:'ac-coral', emoji:'🧶' },
    { id:'y3', maker:'DARUMA', name:'メリノスタイル並太', color:'アイボリー (1)', material:'ウール100', weight:40, price:495, stock:80, ac:'ac-lemon', emoji:'🧶' },
    { id:'y4', maker:'ハマナカ', name:'わんぱくデニス', color:'ミントグリーン (53)', material:'アクリル70 ウール30', weight:50, price:418, stock:50, ac:'ac-teal', emoji:'🧶' },
    { id:'y5', maker:'パピー', name:'ブリティッシュエロイカ', color:'グレー (185)', material:'ウール100', weight:50, price:737, stock:0, ac:'ac-grape', emoji:'🧶' },
    { id:'y6', maker:'オリムパス', name:'エミーグランデ', color:'白 (801)', material:'綿100', weight:50, price:660, stock:150, ac:'ac-sky', emoji:'🧵' },
    { id:'y7', maker:'DARUMA', name:'iroiro', color:'さくら (39)', material:'ウール100', weight:20, price:242, stock:60, ac:'ac-flower', emoji:'🧶' },
    { id:'y8', maker:'ハマナカ', name:'コットンノルディ', color:'みず色 (10)', material:'綿100', weight:40, price:528, stock:90, ac:'ac-sky', emoji:'🧵' }
  ],
  // 毛糸の購入履歴（毛糸詳細用）
  purchases: {
    y2:[
      { date:'2026.02.18', shop:'けいとや 池袋店', price:550, weight:50 },
      { date:'2026.01.05', shop:'ユザワヤ', price:528, weight:50 }
    ],
    y1:[ { date:'2026.01.04', shop:'ユザワヤ', price:330, weight:25 } ]
  },

  patterns: [
    { id:'p1', title:'アラン模様セーター 基本', memo:'なわ編み中心。サイズM。雑誌「毛糸だま」掲載分。', updated:'2026.01.04', files:['image','pdf'], ac:'ac-flower', emoji:'📘' },
    { id:'p2', title:'まんまるアミグルミの編み方', memo:'うさぎ・くま共通の基本ボディ。増減目表つき。', updated:'2026.02.19', files:['image','image','pdf'], ac:'ac-coral', emoji:'📕' },
    { id:'p3', title:'お花モチーフ集', memo:'5枚花・8枚花・ドイリー。コースターにも応用。', updated:'2026.01.09', files:['image','image'], ac:'ac-leaf', emoji:'📗' },
    { id:'p4', title:'ベビーシューズ 0-6ヶ月', memo:'かぎ針で編む小さな靴。', updated:'2026.02.28', files:['pdf'], ac:'ac-sky', emoji:'📙' }
  ],

  tools: [
    { id:'t1', name:'クロバー アミュレ かぎ針', category:'かぎ針', maker:'クロバー', size:'4/0号', memo:'グリップ付きで疲れにくい', ac:'ac-coral', emoji:'🪝' },
    { id:'t2', name:'匠 棒針 4本針', category:'棒針', maker:'クロバー', size:'5号', memo:'', ac:'ac-flower', emoji:'🥢' },
    { id:'t3', name:'とじ針セット', category:'とじ針', maker:'ハマナカ', size:'—', memo:'3本入り', ac:'ac-teal', emoji:'🪡' },
    { id:'t4', name:'輪針', category:'輪針', maker:'addi', size:'6号 / 80cm', memo:'セーターの身頃用', ac:'ac-grape', emoji:'➰' },
    { id:'t5', name:'段数マーカー', category:'補助', maker:'クロバー', size:'—', memo:'10個入り、増し目の目印に', ac:'ac-lemon', emoji:'🔖' }
  ],

  // 制作ログ（作品ID別）
  logs: {
    l1:{ work:'w1', date:'2026.01.05', start:'20:00', end:'22:30', minutes:150, content:'身頃の作り目とゴム編み' },
    l2:{ work:'w1', date:'2026.01.12', start:'13:00', end:'17:00', minutes:240, content:'なわ編み模様の前身頃' },
    l3:{ work:'w1', date:'2026.03.10', start:'19:30', end:'22:00', minutes:150, content:'袖をとじて仕上げ' },
    l4:{ work:'w2', date:'2026.02.20', start:'21:00', end:'24:00', minutes:180, content:'あたま・お耳を編んだ' },
    l5:{ work:'w2', date:'2026.02.23', start:'14:00', end:'18:30', minutes:270, content:'からだ・手足、わた詰め' },
    l6:{ work:'w2', date:'2026.02.27', start:'20:00', end:'25:00', minutes:300, content:'お顔の刺繍とリボン付け' },
    l7:{ work:'w3', date:'2026.03.01', start:'10:00', end:'19:00', minutes:540, content:'ドイリー1枚を一気に編んだ' },
    l8:{ work:'w4', date:'2026.01.20', start:'13:00', end:'16:00', minutes:180, content:'お花モチーフ12枚' },
    l9:{ work:'w4', date:'2026.02.15', start:'13:00', end:'21:00', minutes:480, content:'モチーフつなぎ（半分）' },
    l10:{ work:'w6', date:'2026.01.25', start:'15:00', end:'20:00', minutes:300, content:'コースター4枚セット' },
    l11:{ work:'w7', date:'2025.12.01', start:'20:00', end:'27:00', minutes:420, content:'本体ゴム編み〜途中まで' },
    l12:{ work:'w8', date:'2026.03.01', start:'21:00', end:'24:30', minutes:210, content:'左足のソール部分' }
  },

  // 作品使用毛糸（原価）
  workYarns: {
    wy1:{ yarn:'y3', used:300, unit:9.9, cost:2970 },
    wy2:{ yarn:'y5', used:50,  unit:14.7, cost:735 },
    wy3:{ yarn:'y1', used:40,  unit:13.2, cost:528 },
    wy4:{ yarn:'y2', used:55,  unit:11.0, cost:605 },
    wy5:{ yarn:'y7', used:10,  unit:12.1, cost:121 },
    wy6:{ yarn:'y6', used:35,  unit:13.2, cost:462 },
    wy7:{ yarn:'y7', used:120, unit:12.1, cost:1452 },
    wy8:{ yarn:'y4', used:60,  unit:8.4, cost:504 },
    wy9:{ yarn:'y7', used:40,  unit:12.1, cost:484 },
    wy10:{ yarn:'y5', used:70, unit:14.7, cost:1029 },
    wy11:{ yarn:'y8', used:30, unit:13.2, cost:396 }
  },

  wishlist: [
    { id:'wl1', title:'グラニースクエアのバッグ', deadline:'2026.06.30', recipient:'じぶん用', priority:3, registered:'2026.03.01',
      memo:'カラフルな正方形モチーフをつないだトートバッグ。夏に持ちたい！', knit:'#f6e0e8', emoji:'👜', ac:'ac-flower', corner:'🌸' },
    { id:'wl2', title:'くまのあみぐるみ', deadline:'2026.05.10', recipient:'姪っ子', priority:2, registered:'2026.03.05',
      memo:'うさぎが完成したら次はくまさん。同じ基本ボディで。', knit:'#efe6d2', emoji:'🧸', ac:'ac-coral', corner:'🌷' },
    { id:'wl3', title:'透かし編みのストール', deadline:'', recipient:'じぶん用', priority:1, registered:'2026.03.08',
      memo:'春用に軽い透かし模様のストール。シルク混の糸で。', knit:'#e4eef0', emoji:'🧣', ac:'ac-sky', corner:'🫧' },
    { id:'wl4', title:'ニットのおうち（ピンクッション）', deadline:'2026.04.20', recipient:'お母さん', priority:2, registered:'2026.03.10',
      memo:'まち針をさせる小さなおうち型ピンクッション。', knit:'#eef0dc', emoji:'🏠', ac:'ac-leaf', corner:'🍀' }
  ],

  statusMap: {
    idea:  { label:'構想中',  cls:'st-idea' },
    plan:  { label:'制作予定', cls:'st-plan' },
    making:{ label:'制作中',  cls:'st-making' },
    done:  { label:'完成',    cls:'st-done' },
    hold:  { label:'保留',    cls:'st-hold' }
  },
  priorityMap: { 3:'高', 2:'中', 1:'低' }
};

// 分→「○h○m」
window.fmtMin = (m)=>{ if(!m) return '0m'; const h=Math.floor(m/60), mm=m%60; return (h?h+'h':'')+(mm?mm+'m':(h?'':'0m')); };
window.yen = (n)=> n.toLocaleString('ja-JP');
