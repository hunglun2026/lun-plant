/* 植物小百科：搜尋、篩選（類別、用途、科、館區）、詳細介紹對話框（網址 #植物id 可直接開啟）、比一比。
   介紹文字依年級切換：低年級一句話＋白話段（有注音）、中年級白話段、高年級白話段＋可展開動物園原文。
   打開詳細介紹＝在探險護照蓋章（progress.js）。開花月份來自 /data/bloom.json（植物園花曆，名字對得上的才有）。 */
App.boot(function (data) {
  const { esc, el, photo } = App;
  const S = App.SITE;
  const all = data.items;
  const state = { q: "", group: "", use: "", family: "", zone: "" };
  const grid = document.getElementById("grid");
  const dlg = document.getElementById("dlg");
  const body = document.getElementById("dlg-body");
  const bloom = fetch("/data/bloom.json?v=" + encodeURIComponent(data.version)).then((r) => (r.ok ? r.json() : { plants: [] })).catch(() => ({ plants: [] }));

  // ---- 篩選 ----
  const count = (f) => all.filter(f).length;
  const chipRow = (key, label, opts) => {
    const row = el('<div class="chips"><span class="lab">' + label + "</span></div>");
    opts.forEach(([val, text]) => {
      const b = el('<button class="chip" aria-pressed="false">' + esc(text) + "</button>");
      b.dataset.v = val;
      b.onclick = () => {
        state[key] = state[key] === val ? "" : val;
        row.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.v === state[key])));
        render();
      };
      row.appendChild(b);
    });
    return row;
  };
  const filters = document.getElementById("filters");
  filters.appendChild(chipRow("group", "類別", Object.keys(S.GROUPS).map((g) => [g, S.GROUPS[g].emoji + " " + g + "（" + count((a) => a.group === g) + "）"])));
  filters.appendChild(chipRow("use", "用途", Object.keys(S.USES).filter((u) => count((a) => a.uses.includes(u))).map((u) => [u, S.USES[u].emoji + " " + u])));
  const sortBy = (arr, f) => arr.sort((x, y) => count((a) => f(a, y)) - count((a) => f(a, x)));
  const families = sortBy([...new Set(all.map((a) => a.family).filter(Boolean))], (a, v) => a.family === v);
  const zones = sortBy([...new Set(all.flatMap((a) => a.zones))], (a, v) => a.zones.includes(v));
  const srow = el('<div class="chips nokid"><span class="lab">更多</span>' +
    '<select class="inline" id="family" aria-label="選科"><option value="">全部的科</option>' +
    families.map((f) => '<option value="' + esc(f) + '">' + esc(f) + "（" + count((a) => a.family === f) + "）</option>").join("") + "</select>" +
    '<select class="inline" id="zone" aria-label="選館區"><option value="">動物園全部館區</option>' +
    zones.map((z) => '<option value="' + esc(z) + '">' + esc(z) + "（" + count((a) => a.zones.includes(z)) + "）</option>").join("") + "</select></div>");
  filters.appendChild(srow);
  srow.querySelector("#family").onchange = (e) => { state.family = e.target.value; render(); };
  srow.querySelector("#zone").onchange = (e) => { state.zone = e.target.value; render(); };
  document.getElementById("q").addEventListener("input", (e) => { state.q = e.target.value.trim(); render(); });
  // 從地圖或其他頁點進來：/plants?zone=蕨園&group=蕨類
  const qs = new URLSearchParams(location.search);
  ["family", "zone"].forEach((k) => { if (qs.get(k)) { state[k] = qs.get(k); srow.querySelector("#" + k).value = state[k]; } });
  ["group", "use"].forEach((k) => {
    if (!qs.get(k)) return;
    state[k] = qs.get(k);
    filters.querySelectorAll(".chip").forEach((c) => { if (c.dataset.v === state[k]) c.setAttribute("aria-pressed", "true"); });
  });

  function match(a) {
    if (state.group && a.group !== state.group) return false;
    if (state.use && !a.uses.includes(state.use)) return false;
    if (state.family && a.family !== state.family) return false;
    if (state.zone && !a.zones.includes(state.zone)) return false;
    if (state.q && !(a.name + a.alt + a.family + a.latin).toLowerCase().includes(state.q.toLowerCase())) return false;
    return true;
  }
  function render() {
    const list = all.filter(match).sort((x, y) => (y.hasPhoto - x.hasPhoto) || x.name.localeCompare(y.name, "zh-Hant"));
    document.getElementById("count").textContent = list.length ? "找到 " + list.length + " 種植物" : "找不到，換個條件試試看。";
    grid.replaceChildren(...list.map(card));
  }
  document.addEventListener("app-level", render);

  const groupBadge = (a) => '<span class="tbadge" style="background:' + a.groupInfo.color + '">' + a.groupInfo.emoji + " " + esc(a.group) + "</span>";
  const useBadge = (u) => '<span class="ubadge">' + S.USES[u].emoji + " " + esc(u) + "</span>";
  function card(a) {
    const c = el('<button class="acard"><div class="info"><b>' + esc(a.name) + "</b><small>" + esc(a.family) + "</small>" +
      '<div class="meta">' + groupBadge(a) + "</div></div></button>");
    c.prepend(photo(a));
    c.onclick = () => open(a);
    return c;
  }

  // ---- 詳細介紹 ----
  const fact = (title, html) => (html ? '<div class="fact"><h4>' + title + "</h4><p>" + html + "</p></div>" : "");
  const NONE = "（資料沒有寫）";
  function credit(a) {
    if (!a.photo) return "這種植物目前沒有照片。";
    if (a.photo.by === "示意圖") return "示意圖：依資料描述製作的寫實照片，不是這種植物的真實照片。";
    return "照片：" + esc(a.photo.by) + (a.photo.page ? '　<a href="' + esc(a.photo.page) + '" target="_blank" rel="noopener">看照片出處</a>' : "");
  }
  const source = () => '原始資料：<a href="https://data.gov.tw/dataset/121345" target="_blank" rel="noopener">臺北市立動物園「植物資料」</a>（政府資料開放授權條款第1版）。' +
    "分級介紹由 AI 依原文改寫並經程式查核，有錯請按頁尾「回報內容錯誤」。";
  const monthsText = (m) => {
    const full = m.map((v, i) => (v === 2 ? S.MONTHS[i] : "")).filter(Boolean);
    const some = m.map((v, i) => (v === 1 ? S.MONTHS[i] : "")).filter(Boolean);
    return (full.length ? "盛開：" + full.join("、") : "") + (some.length ? (full.length ? "；" : "") + "零星開花：" + some.join("、") : "");
  };
  async function open(a) {
    history.replaceState(null, "", location.pathname + location.search + "#" + a.id);
    Progress.seen(a.id);
    const lv = App.level();
    body.innerHTML =
      '<div class="dlg-bar"><button class="btn" id="add">' + (cmp.includes(a) ? "✔ 已加入比一比" : "➕ 加入比一比") + "</button>" +
      '<button class="btn" id="x">關閉 ✕</button></div>' +
      "<h2 style='margin-top:0'>" + esc(a.name) + ' <span id="say1"></span></h2>' +
      "<p>" + groupBadge(a) + " " + a.uses.map(useBadge).join(" ") + "</p>" +
      '<div class="gallery big" id="gal"></div><p class="credit">' + credit(a) + "</p>" +
      (a.done ? '<div class="fact intro"><h4>認識我</h4>' + (lv === "e" ? '<p class="one" id="onetext"></p>' : "") + '<p id="introtext"></p></div>' : "") +
      '<div class="facts">' +
        fact("學名", "<i>" + esc(a.latin) + "</i>") +
        fact("科、屬", esc(a.family) + (a.attrs.genus ? "，" + esc(a.attrs.genus) : "")) +
        (lv !== "e" ? fact("別名", esc(a.alt || NONE)) : "") +
        fact("在動物園哪裡看得到", a.zones.map((z) => '<a href="/plants?zone=' + encodeURIComponent(z) + '">' + esc(z) + "</a>").join("、") + '　<a href="/map">看園區地圖</a>') +
        '<div id="bloomfact"></div></div>' +
      (lv === "s" ? '<details class="orig"><summary>看原始資料（動物園原文）</summary><p id="origtext">載入中…</p></details>' : "") +
      '<p class="credit">' + source() + "</p>";
    if (a.done) {
      body.querySelector("#introtext").textContent = App.intro(a, lv);
      const one = body.querySelector("#onetext");
      if (one) one.textContent = a.k;
    }
    body.querySelector("#say1").appendChild(App.sayBtn(a.name + "。" + (a.k || ""), "唸出" + a.name));
    body.querySelector("#gal").appendChild(photo(a, true, "xl"));
    body.querySelector("#x").onclick = () => dlg.close();
    body.querySelector("#add").onclick = (e) => { addCmp(a); e.target.textContent = "✔ 已加入比一比"; };
    if (!dlg.open) dlg.showModal();
    body.parentElement.scrollTop = 0;
    const b = (await bloom).plants.find((p) => p.id === a.id);
    const bf = body.querySelector("#bloomfact");
    if (b && bf) bf.outerHTML = fact("開花月份（台北植物園觀察）", esc(monthsText(b.m)) + '　<a href="/bloom">看開花月曆</a>');
    const o = body.querySelector("#origtext");
    if (o) o.textContent = (await App.loadOrig(a)) || NONE;
  }
  dlg.addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  // ---- 比一比：選兩種並排比較 ----
  const cmp = [];
  const bar = document.getElementById("cmpbar");
  const cmpBox = document.getElementById("cmp");
  function addCmp(a) {
    if (cmp.includes(a)) return;
    if (cmp.length >= 2) cmp.shift(); // 只比兩種，加第三種就換掉最早的
    cmp.push(a);
    drawBar();
  }
  function drawBar() {
    bar.hidden = !cmp.length;
    document.body.classList.toggle("has-cmpbar", cmp.length > 0);
    bar.replaceChildren(el("<div><b>比一比：</b>" + cmp.map((a, i) => '<button class="chip" data-i="' + i + '" aria-label="移除 ' + esc(a.name) + '">' + esc(a.name) + " ✕</button>").join(" ") +
      (cmp.length < 2 ? " <small>再選一種植物</small>" : ' <button class="btn primary" id="go-cmp">開始比較 ➜</button>') + "</div>"));
    bar.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => { cmp.splice(+b.dataset.i, 1); drawBar(); }));
    const go = bar.querySelector("#go-cmp");
    if (go) go.onclick = () => { dlg.close(); compare(cmp[0], cmp[1]); };
  }
  const ROWS = [
    ["類別", (a) => a.group],
    ["科", (a) => a.family || NONE],
    ["用途", (a) => a.uses.join("、") || NONE],
    ["動物園館區", (a) => a.zones.join("、") || NONE],
    ["一句話介紹", (a) => a.k || NONE],
  ];
  function compare(a, b) {
    cmpBox.hidden = false;
    cmpBox.replaceChildren(el(
      '<div class="sheet"><h2>🔍 比一比：' + esc(a.name) + " 和 " + esc(b.name) + "</h2>" +
      '<div class="tablewrap"><table class="cmp"><thead><tr><th></th><th scope="col">' + esc(a.name) + '</th><th scope="col">' + esc(b.name) + "</th></tr></thead><tbody>" +
      '<tr><th scope="row">照片</th><td class="p0"></td><td class="p1"></td></tr>' +
      ROWS.map(([label, f]) => {
        const x = f(a), y = f(b);
        return '<tr><th scope="row">' + label + (x === y && x !== NONE ? ' <span class="same">一樣</span>' : "") + "</th><td>" + esc(x) + "</td><td>" + esc(y) + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      "<p><b>想一想：</b>這兩種植物還有哪裡一樣？哪裡不一樣？</p><p class=\"lines\"></p>" +
      '<p class="noprint"><button class="btn primary" id="cmp-print">列印</button> <button class="btn" id="cmp-close">關閉比較</button></p></div>'
    ));
    cmpBox.querySelector(".p0").appendChild(photo(a));
    cmpBox.querySelector(".p1").appendChild(photo(b));
    cmpBox.querySelector("#cmp-close").onclick = () => { cmpBox.hidden = true; };
    cmpBox.querySelector("#cmp-print").onclick = () => { document.body.classList.add("pcmp"); window.print(); };
    cmpBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  addEventListener("afterprint", () => document.body.classList.remove("pcmp"));

  render();
  const want = decodeURIComponent(location.hash.slice(1));
  const hit = want && all.find((a) => a.id === want);
  if (hit) open(hit);
});
