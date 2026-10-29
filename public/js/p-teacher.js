/* 教師專區：學習單（範圍＝類別、科或館區，依年級出題，可顯示答案）＋搶答計分板（core/board.js）。
   題目只用改寫與原文已有的事實：類別、用途、館區來自轉接器整理的資料，介紹與線索來自查核過的改寫。 */
App.boot(function (data) {
  const { esc, el, shuffle } = App;
  const S = App.SITE;
  const done = data.items.filter((a) => a.done);

  // ---- 分頁 ----
  document.querySelectorAll(".tab").forEach((t) => (t.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.setAttribute("aria-selected", String(x === t)));
    document.getElementById("tab-sheet").hidden = t.dataset.tab !== "sheet";
    document.getElementById("tab-board").hidden = t.dataset.tab !== "board";
  }));
  Board.init(document.getElementById("tab-board"));

  // ---- 範圍選單：類別、科、館區（只列有分級介紹的）----
  const scope = document.getElementById("scope");
  const cnt = (f) => done.filter(f).length;
  scope.appendChild(el('<option value="all:">全部（' + done.length + "）</option>"));
  const group = (label, kind, vals, test, ico) => {
    const og = el('<optgroup label="' + label + '"></optgroup>');
    vals.sort((x, y) => cnt((a) => test(a, y)) - cnt((a) => test(a, x)))
      .forEach((v) => og.appendChild(el('<option value="' + kind + ":" + esc(v) + '">' + (ico ? ico(v) + " " : "") + esc(v) + "（" + cnt((a) => test(a, v)) + "）</option>")));
    scope.appendChild(og);
  };
  const TEST = { group: (a, v) => a.group === v, family: (a, v) => a.family === v, zone: (a, v) => a.zones.includes(v) };
  group("類別", "group", Object.keys(S.GROUPS).filter((g) => cnt((a) => a.group === g)), TEST.group, (g) => S.GROUPS[g].emoji);
  group("動物園館區", "zone", [...new Set(done.flatMap((a) => a.zones))], TEST.zone);
  group("科（3 種以上）", "family", [...new Set(done.map((a) => a.family))].filter((f) => cnt((a) => a.family === f) >= 3), TEST.family);

  // ---- 出題：依年級 ----
  function questions(a, lv) {
    const qs = [["它是哪一類植物？　開花植物　／　蕨類　／　裸子植物", a.group]];
    if (a.uses.length) qs.push(["它可以拿來做什麼？＿＿＿＿＿＿", a.uses.join("、")]);
    if (lv !== "e") qs.push(["寫出它的一個特色：", a.c ? a.c[0] : ""]);
    if (lv === "s") qs.push(["在動物園哪裡看得到它？＿＿＿＿＿＿", a.zones.join("、")]);
    return qs;
  }
  const sheet = document.getElementById("sheet");
  const NAMES = { group: "", family: "", zone: "動物園" };
  function make() {
    const [kind, val] = scope.value.split(/:(.*)/s);
    const pool = done.filter((a) => kind === "all" || TEST[kind](a, val));
    const pick = shuffle(pool).slice(0, +document.getElementById("n").value);
    const lv = App.level();
    const title = kind === "all" ? "認識動物園的植物" : "認識植物：" + NAMES[kind] + val;
    sheet.hidden = false;
    sheet.replaceChildren(el('<div><h2 style="margin-top:0">🌳 ' + esc(title) + "（" + App.LEVELS[lv].name + "）</h2>" +
      '<p class="head"><span>班級：</span><span>座號：</span><span>姓名：</span></p></div>'));
    pick.forEach((a, i) => {
      const q = el('<div class="q"><div class="pic"></div><div><p><b>' + (i + 1) + ". " + esc(a.name) + "</b>（" + esc(a.family) + "）</p>" +
        "<p>" + esc(lv === "e" ? a.k : a.e) + "</p>" +
        questions(a, lv).map(([text, ans]) => "<p>" + esc(text) + '<br><span class="ans" hidden>答：' + esc(ans) + "</span></p>").join("") +
        "</div></div>");
      q.querySelector(".pic").replaceWith(App.photo(a, false));
      sheet.appendChild(q);
    });
    sheet.appendChild(el('<p class="credit">資料來源：臺北市立動物園「植物資料」（政府資料開放授權條款第1版）；照片來自維基共享資源（作者與授權見植物小百科），標「示意圖」的是依資料描述製作的照片。植物探險家 plant.hunglun.com</p>'));
    showKey();
    document.getElementById("print").hidden = false;
  }
  const showKey = () => sheet.querySelectorAll(".ans").forEach((x) => (x.hidden = !document.getElementById("key").checked));
  document.getElementById("make").onclick = make;
  document.getElementById("key").onchange = showKey;
  document.getElementById("print").onclick = () => window.print();
});
