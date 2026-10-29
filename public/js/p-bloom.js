/* 這個月開什麼花：讀 /data/bloom.json（台北植物園花曆觀察，scripts/build-bloom.py 產生），選月份看哪些植物在開花。
   名字對得上小百科的有照片、可以點過去；其他只有花期（資料只有名字和觀察紀錄，不補介紹）。
   遊戲「猜猜幾月開花」：看名字選季節（盛開月份最多的季節；兩個季節一樣多的不出題），用 core/quiz.js。 */
App.boot(async function (data) {
  const { esc, el, shuffle } = App;
  const S = App.SITE;
  const root = document.getElementById("root");
  const r = await fetch("/data/bloom.json?v=" + encodeURIComponent(data.version));
  if (!r.ok) { root.replaceChildren(el('<p class="err">開花資料載入失敗，請重新整理。</p>')); return; }
  const bloom = await r.json();
  const byId = Object.fromEntries(data.items.map((a) => [a.id, a]));
  // 每種花期植物配一個「卡片用」的物件：有小百科就用小百科那筆（有照片），沒有就只放名字
  const plants = bloom.plants.map((p) => ({ p, item: byId[p.id] || { id: "", name: p.name, photo: null, groupInfo: S.GROUPS["開花植物"] } }));
  const SEASONS = [
    { id: "春", months: [3, 4, 5], emoji: "🌷" }, { id: "夏", months: [6, 7, 8], emoji: "☀️" },
    { id: "秋", months: [9, 10, 11], emoji: "🍁" }, { id: "冬", months: [12, 1, 2], emoji: "⛄" },
  ];
  let month = new Date().getMonth() + 1;
  if (/^#m=\d+$/.test(location.hash)) month = Math.min(12, Math.max(1, +location.hash.slice(3)));

  const strip = (m) => '<span class="mstrip" aria-hidden="true">' + m.map((v, i) =>
    '<i class="l' + v + (i + 1 === month ? " now" : "") + '" title="' + S.MONTHS[i] + '"></i>').join("") + "</span>";
  function card({ p, item }) {
    const v = p.m[month - 1];
    const tag = v === 2 ? '<span class="bl full">🌸 盛開</span>' : '<span class="bl some">🌱 零星開花</span>';
    const c = el((item.id ? '<a class="acard" href="/plants#' + encodeURIComponent(item.id) + '">' : '<div class="acard nolink">') +
      '<div class="info"><b>' + esc(p.name) + "</b>" + tag + strip(p.m) + (item.id ? "<small>看介紹 ➜</small>" : "") + "</div>" + (item.id ? "</a>" : "</div>"));
    c.prepend(App.photo(item));
    return c;
  }
  function draw() {
    history.replaceState(null, "", "#m=" + month);
    const now = plants.filter(({ p }) => p.m[month - 1] > 0)
      .sort((x, y) => (y.p.m[month - 1] - x.p.m[month - 1]) || (!!y.item.photo - !!x.item.photo) || (y.p.n - x.p.n));
    const full = now.filter(({ p }) => p.m[month - 1] === 2).length;
    root.replaceChildren(el(
      '<div><div class="months" role="group" aria-label="選月份">' + S.MONTHS.map((m, i) =>
        '<button class="chip" data-m="' + (i + 1) + '" aria-pressed="' + (i + 1 === month) + '">' + m + "</button>").join("") + "</div>" +
      '<p class="lead" aria-live="polite"><b>' + month + " 月</b>，台北植物園有 " + now.length + " 種植物在開花，其中 " + full + " 種是盛開。</p>" +
      '<div class="grid" id="bgrid"></div>' +
      '<p class="legend">月份條：<span class="mstrip"><i class="l2"></i></span> 盛開　<span class="mstrip"><i class="l1"></i></span> 零星開花　<span class="mstrip"><i class="l0"></i></span> 沒看到花</p>' +
      '<div class="panel"><h2 style="margin-top:0">🎯 猜猜什麼季節開花</h2><p>看植物名字，猜它在哪個季節開得最多。</p>' +
      '<p><button class="btn primary big" id="play">開始（8 題）</button></p></div>' +
      '<p class="credit">花期資料：' + esc(bloom.source) + "，" + bloom.years[0] + "～" + bloom.years[1] + " 年共 " + bloom.records.toLocaleString() +
      " 筆觀察。「盛開」是觀察到開花最多的那幾個月，「零星開花」是有觀察到但比較少。開花時間每年會差一點，各地也不一樣。</p></div>"));
    root.querySelector("#bgrid").replaceChildren(...now.map(card));
    root.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => { month = +b.dataset.m; draw(); }));
    root.querySelector("#play").onclick = () => Quiz.run(root, { key: "bloom", title: "猜猜什麼季節開花", rounds: rounds(8), onAgain: draw });
  }

  // 每種植物的「主要季節」：盛開月份最多的季節；並列就不出題
  function seasonOf(p) {
    const score = SEASONS.map((s) => s.months.filter((m) => p.m[m - 1] === 2).length);
    const top = Math.max(...score);
    return top && score.filter((x) => x === top).length === 1 ? SEASONS[score.indexOf(top)] : null;
  }
  function rounds(n) {
    const choices = App.LEVELS[App.level()].choices;
    const pool = plants.filter(({ p }) => seasonOf(p));
    return shuffle(pool).slice(0, n).map(({ p, item }) => {
      const s = seasonOf(p);
      const others = shuffle(SEASONS.filter((x) => x !== s)).slice(0, choices - 1);
      const fullMonths = p.m.map((v, i) => (v === 2 ? S.MONTHS[i] : "")).filter(Boolean).join("、");
      return {
        item, noPic: !item.photo, prompt: "<b>" + esc(p.name) + "</b> 在哪個季節開得最多？",
        options: shuffle([s].concat(others)).map((x) => ({ id: x.id, label: x.emoji + " " + x.id + "天", sub: x.months.join("、") + " 月" })),
        answer: s.id, explain: esc(p.name) + "在台北植物園盛開的月份是 " + esc(fullMonths) + "。",
      };
    });
  }
  draw();
});
