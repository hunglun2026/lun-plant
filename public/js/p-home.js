/* 首頁：引導入口（身分 → 年級 → 推薦工具）、數字跳動、捲到才浮現、今天的植物。
   引導入口沿用故宮與海洋探險家；樣式在 /css/base.css 的「首頁」段。捲動放大切換的導覽等精選照片齊了再加。 */
(function () {
  "use strict";
  const { esc } = App;
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 引導入口：身分記在這台裝置，程度就是全站程度（App.setLevel） ----
  const R = (href, ico, name, why) => ({ href, ico, name, why });
  const RECS = {
    student: {
      e: [R("/plants", "📖", "植物小百科", "有注音，挑一種最喜歡的植物"), R("/bloom", "🌸", "這個月開什麼花", "看看這個月哪些花在開"), R("/map", "🚶", "逛園區看植物", "從大門走到出口，一區一區看")],
      j: [R("/classify", "🧩", "植物分類", "開花植物、蕨類、裸子植物分一分"), R("/bloom", "🌸", "這個月開什麼花", "猜猜植物在哪個季節開花"), R("/plants", "📖", "植物小百科", "挑兩種比一比")],
      s: [R("/classify", "🧩", "植物分類", "植物有什麼用？還有 60 秒挑戰"), R("/plants", "📖", "植物小百科", "可以展開讀動物園原文"), R("/bloom", "🌸", "這個月開什麼花", "十多年的觀察紀錄看花期")],
    },
    teacher: {
      e: [R("/teacher", "📝", "學習單", "選類別或館區，一鍵產生"), R("/map", "🚶", "逛園區看植物", "校外教學前先帶全班逛一次")],
      j: [R("/classify", "🧩", "植物分類", "自然課認識三大類植物"), R("/teacher", "📝", "學習單", "依類別、科或館區產生學習單"), R("/bloom", "🌸", "這個月開什麼花", "配合季節觀察校園植物")],
      s: [R("/plants", "📖", "植物小百科", "挑兩種比一比，印成比較表"), R("/teacher", "📝", "學習單", "白話介紹加觀察題"), R("/classify", "🧩", "植物分類", "投影全班一起答")],
    },
  };
  const WHO = { student: "學生", teacher: "老師" };
  const guide = document.getElementById("start");
  const steps = [...guide.querySelectorAll(".g-step")];
  let who = App.store.get("guide", null);
  if (!WHO[who]) who = null;
  const show = (name) => steps.forEach((s) => (s.hidden = s.dataset.step !== name));
  function done() {
    const lv = App.level();
    document.getElementById("g-who").textContent = WHO[who] + "・" + App.LEVELS[lv].name;
    document.getElementById("g-recs").innerHTML = RECS[who][lv].map((r) =>
      '<a class="tool" href="' + r.href + '"><div class="ico">' + r.ico + "</div><h3>" + esc(r.name) + '</h3><span class="why">' + esc(r.why) + "</span></a>").join("");
    show("done");
  }
  guide.querySelectorAll("[data-who]").forEach((b) => (b.onclick = () => {
    who = b.dataset.who;
    App.store.set("guide", who);
    document.getElementById("g-lvq").textContent = who === "teacher" ? "你教哪個年級？" : "你幾年級？";
    guide.querySelectorAll("[data-lv]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.lv === App.level())));
    show("lv");
  }));
  guide.querySelectorAll("[data-lv]").forEach((b) => (b.onclick = () => {
    App.setLevel(b.dataset.lv);
    const sel = document.getElementById("lvl");
    if (sel) sel.value = b.dataset.lv; // 頁首的程度選單跟著換
    done();
  }));
  guide.querySelector("[data-back]").onclick = () => show("who");
  guide.querySelector("[data-reset]").onclick = () => { who = null; App.store.set("guide", null); show("who"); };
  document.addEventListener("app-level", () => { if (who && !guide.querySelector('[data-step="done"]').hidden) done(); });
  if (who) done();

  // ---- 捲到才浮現 ----
  const io = "IntersectionObserver" in window && !reduce
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } }), { threshold: 0.15 })
    : null;
  document.querySelectorAll(".w-reveal").forEach((x) => (io ? io.observe(x) : x.classList.add("in-view")));

  // ---- 數字跳動＋今天的植物（要等資料）----
  function countUp(elm, to) {
    if (reduce) { elm.textContent = to.toLocaleString(); return; }
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      elm.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  App.boot(function (data) {
    const items = data.items;
    const nums = { count: items.length, fern: items.filter((a) => a.group === "蕨類").length,
      zones: new Set(items.flatMap((a) => a.zones)).size, rewritten: data.meta.rewritten };
    document.querySelectorAll("[data-w]").forEach((e) => countUp(e, nums[e.dataset.w] || 0));
    const pool = items.filter((a) => a.done && a.hasPhoto);
    const today = App.shuffle(pool).slice(0, 8);
    document.getElementById("today").replaceChildren(...today.map((a) => {
      const c = App.el('<a class="acard" href="/plants#' + encodeURIComponent(a.id) + '"><div class="info"><b>' + esc(a.name) + "</b><small>" +
        a.groupInfo.emoji + " " + esc(a.group) + "・" + esc(a.family) + "</small></div></a>");
      c.prepend(App.photo(a));
      return c;
    }));
  });
})();
