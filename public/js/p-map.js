/* 逛園區看植物：把植物依「在動物園哪裡看得到」（attrs.zones）分到各館區，排成一條從大門走到出口的小徑（示意，不是比例地圖）。
   館區順序與寫法照動物探險家的 /map（同一座臺北市立動物園）。點館區開面板看植物，點植物到小百科（會在探險護照蓋章）。
   網址 #z=館區代號 可直接開某一區。 */
App.boot(function (data) {
  const { esc, el, photo } = App;
  const ZONES = [
    { key: "gate", name: "門內外廣場", ico: "🚪", color: "#8a6a3d", say: "一進大門，廣場邊就種了好多植物。" },
    { key: "kids", name: "兒童動物區", ico: "🐐", color: "#e8873a", say: "兒童動物區旁邊的植物，也是小動物的好鄰居。" },
    { key: "taiwan", name: "臺灣動物區", ico: "🦌", color: "#2f8f5b", say: "這裡種了最多植物，很多是臺灣原生或特有的。" },
    { key: "road", name: "保育大道", ico: "🛤️", color: "#5a7d3a", say: "保育大道是園區的主要道路，兩旁有行道樹。" },
    { key: "pangolin", name: "穿山甲館", ico: "🦔", color: "#8a6a3d", say: "穿山甲館在熱帶雨林室內，旁邊有熱帶植物。" },
    { key: "rainforest", name: "熱帶雨林區", ico: "🌴", color: "#1f6f43", say: "熱帶雨林區又濕又熱，植物的葉子都很大。" },
    { key: "bug", name: "蟲蟲探索谷", ico: "🐛", color: "#7a9a2a", say: "蟲蟲探索谷種了許多蝴蝶和昆蟲喜歡的植物。" },
    { key: "insect", name: "昆蟲館", ico: "🦋", color: "#b455a0", say: "昆蟲館周圍的植物，是蝴蝶幼蟲的食物。" },
    { key: "bird", name: "鳥園區", ico: "🦜", color: "#d9a21f", say: "鳥園區種了會吸引鳥兒的植物。" },
    { key: "fern", name: "蕨園", ico: "🌿", color: "#2f7d4f", say: "蕨園專門種蕨類，找找葉子背面的孢子。" },
    { key: "water", name: "水生植物園", ico: "🪷", color: "#2a7fa8", say: "水生植物園的植物長在水裡或溼地。" },
    { key: "reptile", name: "兩棲爬蟲館", ico: "🦎", color: "#6b8e23", say: "兩棲爬蟲館旁邊的植物喜歡潮溼。" },
    { key: "gibbon", name: "白手長臂猿島", ico: "🐒", color: "#9a6a4a", say: "白手長臂猿島上種了高大的樹。" },
    { key: "africa", name: "非洲動物區", ico: "🦒", color: "#c9822b", say: "非洲動物區有來自熱帶的植物。" },
    { key: "desert", name: "沙漠動物區", ico: "🐪", color: "#c8a45a", say: "沙漠動物區的植物很耐旱。" },
    { key: "australia", name: "澳洲動物區", ico: "🦘", color: "#d9623b", say: "澳洲動物區也找得到植物朋友。" },
    { key: "temperate", name: "溫帶動物區", ico: "🐻", color: "#5a7d9a", say: "溫帶動物區的植物，有些秋天會變色。" },
    { key: "all", name: "全園普遍分布", ico: "🗺️", color: "#6a6a6a", say: "這些植物在動物園到處都看得到。" },
  ];
  ZONES.forEach((z) => { z.list = data.items.filter((a) => a.zones.includes(z.name)); });
  const zones = ZONES.filter((z) => z.list.length);
  zones.forEach((z) => { z.cover = z.list.find((a) => a.hasPhoto) || z.list[0]; });

  const trail = document.getElementById("trail");
  const dlg = document.getElementById("zone");
  const body = document.getElementById("zone-body");
  const seenOf = (z) => { const s = Progress.get().seen; return z.list.filter((a) => s[a.id]).length; };

  function draw() {
    const s = Progress.get().seen;
    const done = zones.filter((z) => seenOf(z) === z.list.length).length;
    const total = data.items.filter((a) => s[a.id]).length;
    trail.replaceChildren(
      el('<div class="gate"><span aria-hidden="true">🚪</span><b>動物園大門</b></div>'),
      ...zones.map((z, i) => stop(z, i)),
      el('<div class="gate end"><span aria-hidden="true">🏁</span><b>出口</b><small>逛完 ' + done + " / " + zones.length + " 區，看過 " + total + " 種植物</small></div>")
    );
  }
  function stop(z, i) {
    const n = seenOf(z), all = z.list.length, full = n === all;
    const b = el(
      '<button class="stop ' + (i % 2 ? "r" : "l") + (full ? " full" : "") + '" style="--c:' + z.color + '" aria-label="' + esc(z.name + "，看過 " + n + " 種，共 " + all + " 種") + '">' +
      '<span class="cover"></span><span class="txt"><b>' + z.ico + " " + esc(z.name) + "</b>" +
      "<small>看過 " + n + " / " + all + " 種" + (full ? " ✅" : "") + '</small><span class="bar"><i style="width:' + Math.round((n / all) * 100) + '%"></i></span></span></button>'
    );
    b.querySelector(".cover").appendChild(photo(z.cover));
    b.onclick = () => open(z);
    return b;
  }
  function open(z) {
    history.replaceState(null, "", "#z=" + z.key);
    const s = Progress.get().seen;
    body.innerHTML =
      '<div class="dlg-bar"><button class="btn" id="zx">關閉 ✕</button></div>' +
      '<h2 style="margin-top:0;color:' + z.color + '">' + z.ico + " " + esc(z.name) + "</h2>" +
      "<p>" + esc(z.say) + "這裡有 " + z.list.length + " 種植物，你看過 " + seenOf(z) + " 種。</p>" +
      '<div class="grid" id="zgrid"></div>';
    body.querySelector("#zgrid").append(...z.list.map((a) => {
      const c = el('<a class="acard' + (s[a.id] ? " seen" : "") + '" href="/plants#' + encodeURIComponent(a.id) + '"><div class="info"><b>' + esc(a.name) + "</b><small>" +
        (s[a.id] ? "✅ 看過了" : a.groupInfo.emoji + " " + esc(a.group)) + "</small></div></a>");
      c.prepend(photo(a));
      return c;
    }));
    body.querySelector("#zx").onclick = () => dlg.close();
    if (!dlg.open) dlg.showModal();
    body.parentElement.scrollTop = 0;
  }
  dlg.addEventListener("close", () => history.replaceState(null, "", location.pathname));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  // 從小百科按上一頁回來時，瀏覽器可能直接拿舊畫面，重畫一次才會更新「看過」
  addEventListener("pageshow", (e) => { if (e.persisted) draw(); });

  draw();
  const want = (location.hash.match(/^#z=(\w+)/) || [])[1];
  const hit = want && zones.find((z) => z.key === want);
  if (hit) open(hit);
});
