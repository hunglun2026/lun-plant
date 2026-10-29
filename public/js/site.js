/* 植物探險家：這一站的設定（window.SITE）。所有頁面最先載入這支，再載入 /js/core/*（通用核心，工具產生，不要手改）。
   負責：站名、導覽列、植物類別與用途的圖示顏色、線索遮名、護照的遊戲與徽章。 */
(function () {
  "use strict";
  // 類別：轉接器依科名判斷（蕨類、裸子植物、開花植物）
  const GROUPS = {
    開花植物: { emoji: "🌸", color: "#c2417a", hint: "會開花、結果實，種子藏在果實裡" },
    蕨類: { emoji: "🌿", color: "#2f7d4f", hint: "不開花，葉子背面的孢子用來繁殖" },
    裸子植物: { emoji: "🌲", color: "#6a5a2f", hint: "不開花，種子長在毬果上，沒有果實包著" },
  };
  // 用途：轉接器從「功能應用」抓關鍵字（原文沒寫的不標）
  const USES = {
    觀賞: { emoji: "🌼", color: "#d97706" },
    食用: { emoji: "🍎", color: "#c0392b" },
    藥用: { emoji: "💊", color: "#7c4dbd" },
    木材: { emoji: "🪵", color: "#8a5a2b" },
    蜜源: { emoji: "🐝", color: "#c9a10e" },
    水土保持: { emoji: "⛰️", color: "#3a7ca5" },
  };
  const groupOf = (name) => GROUPS[name] || GROUPS["開花植物"];
  const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  window.SITE = {
    key: "plant",
    name: "植物探險家",
    logo: "🌳 植物探險家",
    noun: "植物", unit: "種",
    detailUrl: "/plants#",
    dataFile: "/data/site.json",
    loading: "植物資料載入中…🌱",
    champion: "植物小博士",
    maker: "本站非臺北市立動物園製作。鴻綸科技 製作",
    confetti: ["#c2417a", "#2f7d4f", "#d97706", "#3a7ca5", "#8bc34a", "#ffd166"],
    GROUPS, USES, MONTHS, groupOf,
    // [頁面代號, 名稱, 網址, 低年級也顯示嗎]
    nav: [
      ["plants", "植物小百科", "/plants", true],
      ["bloom", "這個月開什麼花", "/bloom", true],
      ["classify", "植物分類", "/classify", true],
      ["map", "逛園區看植物", "/map", true],
      ["passport", "探險護照", "/passport", true],
      ["teacher", "教師專區", "/teacher", false],
    ],
    footer: "",
    stamp: (m) => "目前收錄 " + m.count + " 種植物，其中 " + m.rewritten + " 種已完成分級介紹。資料整理日期：" + m.version + "。",
    enrich(a) {
      const at = a.attrs || {};
      a.group = at.group || "開花植物";
      a.groupInfo = groupOf(a.group);
      a.uses = at.uses || [];
      a.zones = at.zones || [];
      a.family = at.family || "";
      a.latin = at.latin || "";
      a.place = a.family;
    },
    icon: (a) => a.groupInfo.emoji,
    color: (a) => a.groupInfo.color,
    // 線索遮名：名稱與別名（跟查核程式 names_of 同一套）
    maskNames(a) {
      return [a.name].concat((a.alt || "").split(/[、,，]/));
    },
    games: [
      ["group", "認識三大類"], ["use", "植物有什麼用"], ["classify-timed", "植物分類・60 秒"], ["bloom", "猜猜幾月開花"],
    ],
    badges(seen, st) {
      const groups = new Set(seen.map((a) => a.group));
      const zones = new Set(seen.flatMap((a) => a.zones));
      return [
        ["👣", "第一步", "在小百科看第 1 種植物", seen.length >= 1],
        ["📖", "植物百科通", "在小百科看過 50 種植物", seen.length >= 50],
        ["🌿", "蕨類探險家", "看過 10 種蕨類", seen.filter((a) => a.group === "蕨類").length >= 10],
        ["🧭", "三大類都認識", "開花植物、蕨類、裸子植物都看過", groups.size >= 3],
        ["🗺️", "逛遍園區", "看過 10 個館區的植物", zones.size >= 10],
        ["🏆", "分類高手", "認識三大類拿到三顆星", st("group") >= 3],
        ["🍎", "用途專家", "植物有什麼用拿到三顆星", st("use") >= 3],
        ["🌸", "花期達人", "猜猜幾月開花拿到三顆星", st("bloom") >= 3],
        ["⚡", "閃電快手", "60 秒挑戰拿到三顆星", st("classify-timed") >= 3],
      ];
    },
  };
})();
