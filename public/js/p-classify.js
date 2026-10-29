/* 植物分類：兩種玩法，都用 core/quiz.js 出題，只出有照片、有分級介紹的植物。
   1. 認識三大類：看照片選開花植物、蕨類、裸子植物（類別由轉接器依科名判斷）。
      開花植物占大多數，出題時蕨類、裸子植物先抽，免得整輪都是開花植物。
   2. 植物有什麼用：看照片選用途。正確答案是原文寫到的用途（有別的用途就不考最常見的「觀賞」），
      錯的選項只用這種植物原文沒寫的用途。 */
App.boot(function (data) {
  const { esc, el, shuffle } = App;
  const S = App.SITE;
  const root = document.getElementById("root");
  const pool = data.items.filter((a) => a.hasPhoto && a.done);
  const GROUPS = Object.keys(S.GROUPS);
  const USES = Object.keys(S.USES);

  // 三大類：每輪蕨類、裸子植物至少各占一部分（有幾種放幾種，上限是題數的三分之一與五分之一）
  function groupItems(n) {
    const by = (g) => shuffle(pool.filter((a) => a.group === g));
    const fern = by("蕨類").slice(0, Math.ceil(n / 3));
    const gymno = by("裸子植物").slice(0, Math.ceil(n / 5));
    const rest = by("開花植物").slice(0, n - fern.length - gymno.length);
    return shuffle(fern.concat(gymno, rest));
  }
  function groupRounds(n) {
    return groupItems(n).map((a) => ({
      item: a, prompt: "<b>" + esc(a.name) + "</b> 是哪一類植物？",
      options: GROUPS.map((g) => ({ id: g, label: S.GROUPS[g].emoji + " " + g })),
      answer: a.group,
      explain: esc(a.name) + "是" + esc(a.family) + "的" + esc(a.group) + "。" + esc(S.GROUPS[a.group].hint) + "。",
    }));
  }
  function useRounds(n) {
    const choices = App.LEVELS[App.level()].choices;
    const usable = pool.filter((a) => a.uses.length && USES.some((u) => !a.uses.includes(u)));
    return shuffle(usable).slice(0, n).map((a) => {
      const pickFrom = a.uses.length > 1 ? a.uses.filter((u) => u !== "觀賞") : a.uses;
      const ans = shuffle(pickFrom)[0];
      const others = shuffle(USES.filter((u) => !a.uses.includes(u))).slice(0, choices - 1);
      return {
        item: a, prompt: "<b>" + esc(a.name) + "</b> 可以拿來做什麼？",
        options: shuffle([ans].concat(others)).map((u) => ({ id: u, label: S.USES[u].emoji + " " + u })),
        answer: ans,
        explain: "資料寫到" + esc(a.name) + "的用途有：" + a.uses.map(esc).join("、") + "。",
      };
    });
  }

  function menu() {
    const cnt = (g) => pool.filter((a) => a.group === g).length;
    root.replaceChildren(el(
      '<div class="panel"><p class="lead" style="margin-top:0">植物可以分成三大類：' +
      GROUPS.map((g) => S.GROUPS[g].emoji + esc(g) + "（" + cnt(g) + " 種）").join("、") + "。</p>" +
      '<ul class="hints">' + GROUPS.map((g) => "<li>" + S.GROUPS[g].emoji + " <b>" + esc(g) + "</b>：" + esc(S.GROUPS[g].hint) + "</li>").join("") + "</ul>" +
      '<p><button class="btn primary big" id="group">認識三大類（10 題）</button></p>' +
      '<p><button class="btn big" id="use">植物有什麼用（10 題）</button></p>' +
      '<p><button class="btn big" id="timed">三大類 60 秒挑戰</button></p></div>'));
    root.querySelector("#group").onclick = () => Quiz.run(root, { key: "group", title: "認識三大類", rounds: groupRounds(10), onAgain: menu });
    root.querySelector("#use").onclick = () => Quiz.run(root, { key: "use", title: "植物有什麼用", rounds: useRounds(10), onAgain: menu });
    root.querySelector("#timed").onclick = () => Quiz.run(root, { key: "classify-timed", title: "60 秒挑戰", rounds: groupRounds(60), timed: 60, onAgain: menu });
  }
  document.addEventListener("app-level", menu);
  menu();
});
