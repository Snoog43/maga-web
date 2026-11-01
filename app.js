/* Chocolat Maga — logique de la page */
(() => {
  const C = window.CHOCOLATES, O = window.ORIGINS, M = window.MAKERS, IMG = window.IMAGES || {}, FOC = window.FOC || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = Object.fromEntries(C.map(c => [c.id, c]));
  const fmtPrice = p => p == null ? "—" : p.toLocaleString("fr-FR", { minimumFractionDigits: p % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
  const gammeLabel = { "grand-cru": "Grand cru", craft: "Craft", artisan: "Artisan", "grand-public": "Grand public" };
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const avg = a => a.reduce((t, x) => t + x, 0) / (a.length || 1);
  const scaleLbl = v => v >= 4 ? "Exceptionnel" : v >= 3.5 ? "Hautement recommandé" : v >= 3 ? "Recommandé" : v >= 2 ? "Décevant" : "Désagréable";
  // Avis Flavors of Cacao d'un fabricant (correspondance par début de nom, sans accents ni apostrophes)
  const key = s => norm(s).replace(/['’]/g, "").replace(/^(le |la |chocolaterie )/, "").replace(/ chocolate$/, "").trim();
  const focFor = maker => { const k = key(maker); return FOC.filter(r => { const m = key(r[1]); return m === k || (m.length > 3 && (m.startsWith(k + " ") || k.startsWith(m + " ") || m.startsWith(k + " ("))); }); };

  // origine -> ids pays
  const nameToId = Object.fromEntries(Object.entries(O).map(([id, o]) => [o.name, id]));
  const originIds = c => c.origin.split(" / ").map(n => nameToId[n]).filter(Boolean);

  /* ---------- Favoris (« Ma cave ») ---------- */
  let favs = new Set();
  try { favs = new Set(JSON.parse(localStorage.getItem("cacao-favs") || "[]")); } catch (e) {}
  const saveFavs = () => {
    try { localStorage.setItem("cacao-favs", JSON.stringify([...favs])); } catch (e) {}
    $("#favCount").textContent = favs.size;
  };
  const toggleFav = id => { favs.has(id) ? favs.delete(id) : favs.add(id); saveFavs(); $$(`[data-fav="${id}"]`).forEach(b => b.classList.toggle("on", favs.has(id))); if (state.fav) renderGrid(); };

  /* ---------- Illustration de tablette (SVG) ---------- */
  const chocoTone = { noir: ["#4a2618", "#2a140c"], lait: ["#8a5634", "#5e3620"], blanc: ["#f7ecd8", "#e2cfae"], blond: ["#d79a5c", "#a96a33"], ruby: ["#c86a7c", "#8e3c4f"] };
  let gid = 0;
  function tablet(c, cls = "tab") {
    if (IMG[c.id]) return `<img class="${cls} tab--photo" src="${IMG[c.id]}" alt="${esc(c.maker + " " + c.name)}" loading="lazy" />`;
    return tabletSvg(c, cls);
  }
  function tabletSvg(c, cls) {
    const id = "g" + (gid++);
    const [l, d] = chocoTone[c.type] || chocoTone.noir;
    const light = c.type === "blanc";
    let sq = "";
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) {
      const x = 14 + k * 58, y = 12 + r * 58;
      sq += `<rect x="${x}" y="${y}" width="52" height="52" rx="5" fill="url(#${id}s)"/><rect x="${x + 7}" y="${y + 7}" width="38" height="38" rx="3" fill="${l}" opacity=".9"/>`;
    }
    const words = c.maker.split(" ");
    let lines = [c.maker];
    if (c.maker.length > 12 && words.length > 1) {
      let best = 1, diff = 1e9;
      for (let i = 1; i < words.length; i++) { const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length); if (d < diff) { diff = d; best = i; } }
      lines = [words.slice(0, best).join(" "), words.slice(best).join(" ")];
    }
    const longest = Math.max(...lines.map(l => l.length));
    const fs = longest > 12 ? 15 : longest > 9 ? 18 : 22;
    const makerSvg = lines.map((l, i) => `<tspan x="100" dy="${i ? fs + 2 : 0}">${esc(l)}</tspan>`).join("");
    const my = lines.length > 1 ? 180 : 195;
    const wc = c.color, ac = c.accent;
    return `<svg class="${cls}" viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light ? "#fffaf0" : l}"/><stop offset="1" stop-color="${d}"/></linearGradient>
        <linearGradient id="${id}w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
      </defs>
      <rect x="6" y="4" width="188" height="300" rx="10" fill="${d}"/>
      ${sq}
      <path d="M2 128 L198 118 L198 316 L2 316 Z" fill="${wc}"/>
      <path d="M2 128 L198 118 L198 316 L2 316 Z" fill="url(#${id}w)"/>
      <path d="M2 128 L198 118 L198 124 L2 134 Z" fill="#000" opacity=".2"/>
      <rect x="2" y="250" width="196" height="22" fill="${ac}" opacity=".9"/>
      <text x="100" y="${my}" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="${fs}" fill="${ac}">${makerSvg}</text>
      <text x="100" y="228" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" letter-spacing="2" fill="${ac}" opacity=".85">${esc(c.cacao)} % · ${esc(c.type.toUpperCase())}</text>
      <text x="100" y="265" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="10" letter-spacing="1.5" fill="${wc}">${esc(c.origin.toUpperCase().slice(0, 26))}</text>
    </svg>`;
  }

  /* ---------- Carte produit ---------- */
  function card(c) {
    return `<article class="card" data-open="${c.id}">
      <button class="card__heart ${favs.has(c.id) ? "on" : ""}" data-fav="${c.id}" aria-label="Ajouter à ma cave">♥</button>
      <div class="card__img">${tablet(c)}</div>
      <span class="card__maker">${esc(c.maker)}</span>
      <h3>${esc(c.name)}</h3>
      <div class="card__meta"><span class="pill pill--${c.type}">${c.type}</span><span>${esc(c.origin)}</span><span>· ${c.cacao} %</span></div>
      <div class="card__foot">
        <span class="price">${fmtPrice(c.price)} <small>${c.weight} g</small></span>
        <span class="score"><i>${c.rating.toFixed(1)}</i></span>
      </div>
    </article>`;
  }

  document.addEventListener("click", e => {
    const fav = e.target.closest("[data-fav]");
    if (fav) { e.stopPropagation(); toggleFav(fav.dataset.fav); return; }
    const op = e.target.closest("[data-open]");
    if (op) { openModal(op.dataset.open); return; }
    if (e.target.closest("[data-close]")) closeModal();
  });

  /* ---------- Hero ---------- */
  const hero = byId["amedei-chuao"];
  $("#heroStack").innerHTML = ["jph-bresil-63", "toak-ecuador", "amedei-chuao"].map((id, i) => `<button class="hero__item hero__item--${i}" data-open="${id}">${tablet(byId[id], "tab")}</button>`).join("") + '<div class="hero__pool"></div>';
  $("#heroCard").innerHTML = `<div class="mini">${tablet(hero)}</div><div><small>Tablette du mois</small><b>${hero.maker} — ${hero.name}</b><span style="font-size:.8rem;color:#cdb9a5">${hero.origin} · note ${hero.rating}/10</span></div>`;
  $("#heroCard").dataset.open = hero.id;
  const makersCount = new Set(C.map(c => c.maker)).size;
  $("#heroStats").innerHTML = [[C.length, "tablettes"], [Object.keys(O).length, "pays producteurs"], [makersCount, "maisons"]].map(([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`).join("");

  const nav = $("#nav");
  addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 40), { passive: true });

  /* ---------- Sélection ---------- */
  const featured = C.filter(c => c.featured).sort((a, b) => b.rating - a.rating);
  $("#featuredRail").innerHTML = featured.map(card).join("");
  $$("[data-scroll]").forEach(b => b.addEventListener("click", () => {
    const r = $("#featuredRail"); r.scrollBy({ left: (+b.dataset.scroll) * r.clientWidth * .8, behavior: "smooth" });
  }));

  /* ---------- Spotlight ---------- */
  const spot = byId["amedei-chuao"], spot2 = byId["domori-porcelana"];
  $("#spotlightIn").innerHTML = `
    <div class="spot__visual">${tablet(spot2)}${tablet(spot)}</div>
    <div>
      <p class="eyebrow eyebrow--light">Le cru à connaître</p>
      <h2>Chuao, le village<br/>que l'on rejoint par la mer</h2>
      <p style="margin-top:18px">${esc(spot.desc)} Les fèves sèchent encore sur le parvis de l'église du village, et la production totale n'atteint que quelques tonnes par an.</p>
      <div class="spot__facts">
        <div><b>${spot.cacao} %</b><span>cacao</span></div>
        <div><b>${spot.rating}/10</b><span>note Atlas</span></div>
        <div><b>Criollo</b><span>génétique</span></div>
      </div>
      <div class="tags">${spot.notes.map(n => `<span>${esc(n)}</span>`).join("")}</div>
      <div class="btn-row">
        <button class="btn btn--light" data-open="${spot.id}">Voir la fiche</button>
        <a class="btn btn--ghost" href="#carte" data-country="862">Le Venezuela sur la carte</a>
      </div>
    </div>`;

  /* ---------- Répertoire ---------- */
  const state = { q: "", type: "", gamme: "", origin: "", maker: "", cacao: 0, sort: "rating", fav: false };
  const uniq = arr => [...new Set(arr)].sort((a, b) => a.localeCompare(b, "fr"));
  $("#fOrigin").innerHTML += uniq(C.flatMap(c => c.origin.split(" / "))).filter(o => o !== "—").map(o => `<option>${esc(o)}</option>`).join("");
  $("#fMaker").innerHTML += uniq(C.map(c => c.makerCountry)).map(o => `<option>${esc(o)}</option>`).join("");

  function renderGrid() {
    const q = norm(state.q);
    let list = C.filter(c =>
      (!q || norm([c.name, c.maker, c.origin, c.makerCountry, c.bean, c.city, ...c.notes].join(" ")).includes(q)) &&
      (!state.type || c.type === state.type) &&
      (!state.gamme || c.gamme === state.gamme) &&
      (!state.origin || c.origin.split(" / ").includes(state.origin)) &&
      (!state.maker || c.makerCountry === state.maker) &&
      c.cacao >= state.cacao &&
      (!state.fav || favs.has(c.id)));
    const s = state.sort;
    list.sort((a, b) =>
      s === "cacao" ? b.cacao - a.cacao :
      s === "priceAsc" ? (a.price ?? 1e9) - (b.price ?? 1e9) :
      s === "priceDesc" ? (b.price ?? -1) - (a.price ?? -1) :
      s === "name" ? a.name.localeCompare(b.name, "fr") : b.rating - a.rating);
    $("#grid").innerHTML = list.length ? list.map(card).join("") : `<p class="empty">Aucune tablette ne correspond. Essayez d'élargir les filtres.</p>`;
    $("#repCount").textContent = `${list.length} tablette${list.length > 1 ? "s" : ""} sur ${C.length} · ${makersCount} maisons · ${uniq(C.map(c => c.makerCountry)).length} pays de fabrication`;
  }
  const bind = (sel, key, ev = "input", map = v => v) => $(sel).addEventListener(ev, e => { state[key] = map(e.target.value); renderGrid(); });
  bind("#fSearch", "q"); bind("#fType", "type", "change"); bind("#fGamme", "gamme", "change");
  bind("#fOrigin", "origin", "change"); bind("#fMaker", "maker", "change"); bind("#fSort", "sort", "change");
  $("#fCacao").addEventListener("input", e => { state.cacao = +e.target.value; $("#fCacaoV").textContent = e.target.value; renderGrid(); });
  $("#fFav").addEventListener("click", e => { state.fav = !state.fav; e.target.classList.toggle("on", state.fav); renderGrid(); });
  $("#favToggle").addEventListener("click", () => { state.fav = true; $("#fFav").classList.add("on"); renderGrid(); $("#repertoire").scrollIntoView(); });
  $("#fReset").addEventListener("click", () => {
    Object.assign(state, { q: "", type: "", gamme: "", origin: "", maker: "", cacao: 0, sort: "rating", fav: false });
    ["#fSearch", "#fType", "#fGamme", "#fOrigin", "#fMaker"].forEach(s => $(s).value = "");
    $("#fSort").value = "rating"; $("#fCacao").value = 0; $("#fCacaoV").textContent = 0; $("#fFav").classList.remove("on");
    renderGrid();
  });
  function searchFor(q) { state.q = q; $("#fSearch").value = q; renderGrid(); $("#repertoire").scrollIntoView(); }
  let navT;
  $("#navSearch").addEventListener("input", e => { clearTimeout(navT); navT = setTimeout(() => searchFor(e.target.value), 350); });
  saveFavs(); renderGrid();

  /* ---------- Modale ---------- */
  function openModal(id) {
    const c = byId[id]; if (!c) return;
    const sameOrigin = C.filter(x => x.id !== c.id && x.origin === c.origin && x.origin !== "Assemblage").slice(0, 4);
    const oid = originIds(c)[0];
    $("#modalBody").innerHTML = `<div class="md">
      <div class="md__img">${tablet(c)}</div>
      <div class="md__info">
        <span class="card__maker">${esc(c.maker)} · ${esc(c.city)}, ${esc(c.makerCountry)}</span>
        <h2>${esc(c.name)}</h2>
        <p style="color:#5d4a40">${esc(c.desc)}</p>
        <dl class="kv">
          <dt>Type</dt><dd><span class="pill pill--${c.type}">${c.type}</span></dd>
          <dt>Gamme</dt><dd>${gammeLabel[c.gamme]}</dd>
          <dt>Origine</dt><dd>${esc(c.origin)}</dd>
          <dt>Variété</dt><dd>${esc(c.bean)}</dd>
          <dt>Poids</dt><dd>${c.weight} g</dd>
          <dt>Prix</dt><dd>${fmtPrice(c.price)}${c.price ? ` <small style="color:#8a7468">(≈ ${fmtPrice(Math.round(c.price / c.weight * 1000))}/kg)</small>` : ""}</dd>
        </dl>
        <div><small style="color:#8a7468">Cacao ${c.cacao} %</small><div class="gauge"><i style="width:${c.cacao}%"></i></div></div>
        <div><small style="color:#8a7468">Note Atlas ${c.rating}/10</small><div class="gauge"><i style="width:${c.rating * 10}%"></i></div></div>
        <div class="tags">${c.notes.map(n => `<span>${esc(n)}</span>`).join("")}</div>
        ${oid ? `<p style="font-size:.85rem;color:#5d4a40"><b style="color:#4a1f18">Le terroir :</b> ${esc(O[oid].info)}</p>` : ""}
        <div class="btn-row">
          <button class="btn btn--gold" data-fav="${c.id}">${favs.has(c.id) ? "♥ Dans ma cave" : "♡ Ajouter à ma cave"}</button>
          ${oid ? `<a class="btn btn--line" style="color:#4a1f18" href="#carte" data-country="${oid}">Voir sur la carte</a>` : ""}
        </div>
        ${focBlock(c)}
        ${sameOrigin.length ? `<div><h4 style="font-size:.8rem;text-transform:uppercase;letter-spacing:.12em;color:#c8894b;margin:8px 0">Même origine</h4><div class="tags">${sameOrigin.map(x => `<span style="cursor:pointer" data-open="${x.id}">${esc(x.maker)} — ${esc(x.name)}</span>`).join("")}</div></div>` : ""}
      </div></div>`;
    $("#modal").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function focBlock(c) {
    const rows = focFor(c.maker); if (!rows.length) return "";
    const best = [...rows].sort((a, b) => b[10] - a[10]).slice(0, 5);
    return `<div class="foc-box"><h4>Flavors of Cacao · ${rows.length} tablette${rows.length > 1 ? "s" : ""} notée${rows.length > 1 ? "s" : ""} · moyenne ${avg(rows.map(r => r[10])).toFixed(2).replace(".", ",")}/4</h4>
      <ul>${best.map(r => `<li><b>${String(r[10]).replace(".", ",")}</b> ${esc(r[6])} <small>${esc(r[4])} · ${r[7]} % · ${r[3]} — ${esc(r[9])}</small></li>`).join("")}</ul></div>`;
  }
  function closeModal() { $("#modal").classList.remove("open"); document.body.style.overflow = ""; }
  addEventListener("keydown", e => e.key === "Escape" && closeModal());

  /* ---------- Maisons ---------- */
  $("#houses").innerHTML = window.HOUSES.map(h => {
    const tabs = C.filter(c => c.maker === h.name);
    return `<article class="house">
      <div><h3>${esc(h.name)}</h3><span class="since">${esc(h.city)} · ${typeof h.since === "number" ? "depuis " + h.since : esc(h.since)}</span></div>
      <ul>${h.titles.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      <p>${esc(h.text)}</p>
      <h4>Signatures</h4>
      <ul>${h.signatures.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      <h4>Dans le répertoire</h4>
      <div class="house-tabs">${tabs.map(c => `<button data-open="${c.id}">${tablet(c)}${esc(c.name)}</button>`).join("")}</div>
      <a class="btn btn--light" style="align-self:flex-start" href="${h.url}" target="_blank" rel="noopener">Site officiel ↗</a>
    </article>`;
  }).join("");

  /* ---------- Savoir ---------- */
  $$("#tabs button").forEach(b => b.addEventListener("click", () => {
    $$("#tabs button").forEach(x => x.classList.toggle("on", x === b));
    $$(".tab-panel").forEach(p => p.classList.toggle("on", p.id === "tab-" + b.dataset.tab));
  }));
  $("#varieties").innerHTML = window.VARIETIES.map(v => `<div class="vcard"><span class="vtag">${esc(v.tag)}</span><h3>${esc(v.name)}</h3><span class="share">${esc(v.share)}</span> <span class="vorigin">de la production · ${esc(v.origin)}</span><p>${esc(v.taste)}</p></div>`).join("");
  $("#process").innerHTML = window.PROCESS.map(p => `<li><h3>${esc(p.step)}</h3><p>${esc(p.text)}</p></li>`).join("");
  $("#timeline").innerHTML = window.HISTORY.map(h => `<div class="tl"><span class="y">${esc(h.year)}</span><div><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></div></div>`).join("");
  $("#glossary").innerHTML = window.GLOSSARY.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join("");

  /* ---------- Classements ---------- */
  function bars(el, rows, max, unit) {
    el.innerHTML = rows.map(r => `<div class="bar"><span>${esc(r.label)}</span><div class="bar__track"><div class="bar__fill" data-w="${(r.v / max) * 100}"></div></div><b>${r.v.toLocaleString("fr-FR")}${unit}</b></div>`).join("");
  }
  const prodRows = Object.values(O).sort((a, b) => b.prod - a.prod).slice(0, 10).map(o => ({ label: o.name, v: o.prod }));
  bars($("#prodChart"), prodRows, prodRows[0].v, "");
  bars($("#consChart"), window.CONSUMPTION.map(c => ({ label: c.country, v: c.kg })), 11, "");
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { $$(".bar__fill", e.target).forEach(f => f.style.width = f.dataset.w + "%"); io.unobserve(e.target); }
  }), { threshold: .3 });
  $$(".bars").forEach(b => io.observe(b));

  /* ---------- Roue aromatique ---------- */
  (function wheel() {
    if (!window.d3) return;
    const size = 440, r = size / 2;
    const data = { children: window.AROMAS.map(f => ({ name: f.family, color: f.color, children: f.items.map(i => ({ name: i, value: 1, color: f.color })) })) };
    const root = d3.partition().size([2 * Math.PI, r])(d3.hierarchy(data).sum(d => d.value));
    const arc = d3.arc().startAngle(d => d.x0).endAngle(d => d.x1).innerRadius(d => d.depth === 1 ? r * .28 : r * .62).outerRadius(d => d.depth === 1 ? r * .6 : r * .98).padAngle(.004);
    const svg = d3.select("#wheel").append("svg").attr("viewBox", [-r, -r, size, size]);
    const nodes = root.descendants().filter(d => d.depth);
    svg.selectAll("path").data(nodes).join("path").attr("d", arc)
      .attr("fill", d => d.data.color).attr("opacity", d => d.depth === 1 ? 1 : .72)
      .on("click", (e, d) => searchFor(d.depth === 2 ? d.data.name : ""))
      .append("title").text(d => d.depth === 2 ? `Voir les tablettes « ${d.data.name} »` : d.data.name);
    svg.selectAll("text").data(nodes).join("text")
      .attr("class", d => d.depth === 1 ? "fam" : "")
      .attr("transform", d => {
        const a = (d.x0 + d.x1) / 2 * 180 / Math.PI, rr = d.depth === 1 ? r * .44 : r * .8;
        return `rotate(${a - 90}) translate(${rr},0) rotate(${a < 180 ? 0 : 180})`;
      })
      .attr("text-anchor", "middle").attr("dy", ".35em").text(d => d.data.name);
    svg.append("text").attr("text-anchor", "middle").attr("dy", ".35em").attr("class", "fam").style("fill", "#4a1f18").style("font-size", "14px").text("Arômes");
  })();

  /* ---------- Coulures de chocolat (SVG « goo » + éclairage spéculaire) ---------- */
  function rnd(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  function drip(svg, { h, base, n, c1, c2, seed, drops, light }) {
    const r = rnd(seed), W = 1440, id = svg.id;
    svg.setAttribute("viewBox", `0 0 ${W} ${h}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMin slice");
    let shapes = `<rect x="-20" y="-40" width="${W + 40}" height="${base + 40}"/>`;
    for (let x = 0; x < W; x += 30 + r() * 50) shapes += `<circle cx="${x.toFixed(0)}" cy="${base}" r="${(10 + r() * 22).toFixed(1)}"/>`;
    const spline = 'calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"';
    for (let i = 0; i < n; i++) {
      const x = +(20 + r() * (W - 40)).toFixed(0), w = 12 + r() * 30, L = 25 + Math.pow(r(), 1.4) * (h - base - 50);
      const d = (6 + r() * 8).toFixed(1), L0 = +(L * (.55 + r() * .2)).toFixed(0), L1 = +L.toFixed(0);
      const y = base - 6;
      shapes += `<rect x="${(x - w / 2).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" rx="${(w / 2).toFixed(1)}" height="${L0}"><animate attributeName="height" values="${L0};${L1};${L0}" dur="${d}s" repeatCount="indefinite" ${spline}/></rect>`;
      shapes += `<circle cx="${x}" r="${(w * .62).toFixed(1)}" cy="${L0 + y}"><animate attributeName="cy" values="${L0 + y};${L1 + y};${L0 + y}" dur="${d}s" repeatCount="indefinite" ${spline}/></circle>`;
      if (drops && r() < .3) {
        const fd = (2.4 + r() * 2.5).toFixed(1), y0 = L1 + y;
        shapes += `<circle cx="${x}" r="${(w * .45).toFixed(1)}" cy="${y0}"><animate attributeName="cy" values="${y0};${y0 + 8};${h + 40}" keyTimes="0;.55;1" dur="${fd}s" begin="${(r() * 4).toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines=".4 0 .6 1;.6 0 1 1"/></circle>`;
      }
    }
    svg.innerHTML = `<defs>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
      <filter id="${id}f" x="-5%" y="-20%" width="110%" height="150%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b"/>
        <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -13" result="goo"/>
        <feGaussianBlur in="goo" stdDeviation="4" result="soft"/>
        <feSpecularLighting in="soft" surfaceScale="7" specularConstant="${light}" specularExponent="32" lighting-color="#fff1e0" result="spec"><feDistantLight azimuth="235" elevation="38"/></feSpecularLighting>
        <feComposite in="spec" in2="goo" operator="in" result="specIn"/>
        <feSpecularLighting in="soft" surfaceScale="4" specularConstant=".6" specularExponent="40" lighting-color="#c98a5a" result="rim"><feDistantLight azimuth="60" elevation="20"/></feSpecularLighting>
        <feComposite in="rim" in2="goo" operator="in" result="rimIn"/>
        <feComposite in="goo" in2="specIn" operator="arithmetic" k2="1" k3="1" result="lit1"/>
        <feComposite in="lit1" in2="rimIn" operator="arithmetic" k2="1" k3=".6" result="lit"/>
        <feOffset in="goo" dy="10" result="off"/><feGaussianBlur in="off" stdDeviation="9" result="sh"/>
        <feColorMatrix in="sh" values="0 0 0 0 .08  0 0 0 0 .03  0 0 0 0 .01  0 0 0 .5 0" result="shadow"/>
        <feMerge><feMergeNode in="shadow"/><feMergeNode in="lit"/></feMerge>
      </filter></defs>
      <g filter="url(#${id}f)" fill="url(#${id}g)">${shapes}</g>`;
  }
  drip($("#dripTop"), { h: 170, base: 18, n: 26, c1: "#140600", c2: "#22100a", seed: 7, drops: false, light: 1.1 });
  drip($("#dripBottom"), { h: 260, base: 34, n: 34, c1: "#2b160d", c2: "#371b0f", seed: 42, drops: true, light: 1.25 });

  /* ---------- Effet 3D (inclinaison au survol) ---------- */
  const tilt = (el, max) => {
    el.addEventListener("mousemove", e => {
      const b = el.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
    });
    el.addEventListener("mouseleave", () => el.style.transform = "");
  };
  if (matchMedia("(hover: hover)").matches) {
    tilt($("#heroStack"), 16);
    $$("#featuredRail .card").forEach(c => tilt(c, 8));
  }

  /* ---------- Base mondiale (Flavors of Cacao) ---------- */
  // ligne : [ref, fabricant, pays, année, origine, iso, nom, %, ingrédients, notes, note]
  (function base() {
    if (!FOC.length) return;
    const group = (i) => { const g = {}; FOC.forEach(r => (g[r[i]] = g[r[i]] || []).push(r)); return g; };
    const byOrigin = group(4), byMaker = group(1), byLoc = group(2);
    const years = [...new Set(FOC.map(r => r[3]))].sort((a, b) => b - a);
    $("#baseIntro").innerHTML = `${FOC.length.toLocaleString("fr-FR")} tablettes de ${Object.keys(byMaker).length} fabricants, issues de ${Object.keys(byOrigin).length} origines, dégustées et notées sur 4 par Brady Brelinski (Flavors of Cacao) de ${years.at(-1)} à ${years[0]}.`;
    const kp = [[FOC.length.toLocaleString("fr-FR"), "tablettes notées"], [Object.keys(byMaker).length, "fabricants"], [Object.keys(byLoc).length, "pays de fabrication"], [avg(FOC.map(r => r[10])).toFixed(2).replace(".", ","), "note moyenne /4"], [FOC.filter(r => r[10] >= 4).length, "tablettes ≥ 4"]];
    $("#baseKpis").innerHTML = kp.map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join("");
    const top = (g, min) => Object.entries(g).filter(([k, v]) => v.length >= min && k !== "Assemblage").map(([k, v]) => ({ label: k, v: +avg(v.map(r => r[10])).toFixed(2), n: v.length })).sort((a, b) => b.v - a.v).slice(0, 10);
    const tb = (el, rows) => el.innerHTML = rows.map(r => `<div class="bar"><span title="${r.n} tablettes">${esc(r.label)}</span><div class="bar__track"><div class="bar__fill" data-w="${((r.v - 2.5) / 1.5) * 100}"></div></div><b>${r.v.toFixed(2).replace(".", ",")}</b></div>`).join("");
    tb($("#baseOrigins"), top(byOrigin, 25)); tb($("#baseMakers"), top(byMaker, 10));
    $$("#base .bars").forEach(b => io.observe(b));
    $("#baseScale").innerHTML = [["4 – 5", "Exceptionnel"], ["3,5 – 3,9", "Hautement recommandé"], ["3 – 3,49", "Recommandé"], ["2 – 2,9", "Décevant"], ["1 – 1,9", "Désagréable"]].map(([a, b], i) => `<span class="sc sc--${i}"><b>${a}</b> ${b}</span>`).join("") + `<span class="sc sc--legend">Ingrédients : B fèves · S sucre · S* autre édulcorant · C beurre de cacao · V vanille · L lécithine · Sa sel</span>`;
    const opts = (sel, arr) => $(sel).innerHTML += arr.map(o => `<option>${esc(o)}</option>`).join("");
    opts("#bOrigin", Object.keys(byOrigin).sort((a, b) => a.localeCompare(b, "fr")));
    opts("#bLoc", Object.keys(byLoc).sort((a, b) => a.localeCompare(b, "fr")));
    opts("#bYear", years);
    const st = { q: "", o: "", l: "", r: 0, y: "", s: "rating", n: 40 };
    const badge = v => `<span class="rt rt--${v >= 4 ? 0 : v >= 3.5 ? 1 : v >= 3 ? 2 : 3}" title="${scaleLbl(v)}">${String(v).replace(".", ",")}</span>`;
    function render() {
      const q = norm(st.q);
      const list = FOC.filter(r => (!q || norm(r[1] + " " + r[6] + " " + r[9] + " " + r[4]).includes(q)) && (!st.o || r[4] === st.o) && (!st.l || r[2] === st.l) && r[10] >= st.r && (!st.y || r[3] == st.y));
      const k = st.s;
      list.sort((a, b) => k === "year" ? b[3] - a[3] || b[10] - a[10] : k === "cacao" ? b[7] - a[7] : k === "maker" ? a[1].localeCompare(b[1], "fr") : b[10] - a[10] || b[3] - a[3]);
      $("#bCount").textContent = `${list.length.toLocaleString("fr-FR")} résultat${list.length > 1 ? "s" : ""}${list.length ? " · note moyenne " + avg(list.map(r => r[10])).toFixed(2).replace(".", ",") + "/4" : ""}`;
      $("#bBody").innerHTML = list.slice(0, st.n).map(r => `<tr><td>${badge(r[10])}</td><td><b>${esc(r[1])}</b><small>${esc(r[2])}</small></td><td>${esc(r[6])}</td><td>${esc(r[4])}</td><td>${r[7]} %</td><td>${r[3]}</td><td class="notes">${esc(r[9])}</td><td class="ing">${esc(r[8])}</td></tr>`).join("") || `<tr><td colspan="8" class="empty">Aucun résultat.</td></tr>`;
      $("#bMore").style.display = list.length > st.n ? "flex" : "none";
    }
    const on = (sel, key, ev = "change", f = v => v) => $(sel).addEventListener(ev, e => { st[key] = f(e.target.value); st.n = 40; render(); });
    on("#bSearch", "q", "input"); on("#bOrigin", "o"); on("#bLoc", "l"); on("#bRating", "r", "change", Number); on("#bYear", "y"); on("#bSort", "s");
    $("#bMore").addEventListener("click", () => { st.n += 60; render(); });
    window.__baseFilterOrigin = o => { st.o = o; $("#bOrigin").value = o; st.n = 40; render(); $("#base").scrollIntoView(); };
    render();
  })();

  /* ---------- Top 100 — Le Classement ---------- */
  (function top100() {
    const T = window.TOP100; if (!T || !T.rows.length) return;
    const R = T.rows, fr = n => String(n).replace(".", ",");
    const SRC = Object.fromEntries(T.sources.map(s => [s.key, s]));
    const initials = m => m.replace(/\(.*?\)/g, "").split(/\s+/).filter(w => /^[A-Za-zÀ-ÿ]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join("");
    const visual = (r, cls) => r.img
      ? `<img class="${cls}" src="${esc(r.img)}" alt="${esc(r.maker + " " + r.bar)}" loading="lazy" referrerpolicy="no-referrer" />`
      : `<span class="${cls} t-mono"><b>${esc(initials(r.maker))}</b><i>${r.cocoa ? r.cocoa + " %" : ""}</i></span>`;
    const ring = (note, size = 58) => {
      const p = Math.max(0, Math.min(1, (note - 85) / 15)), C = 2 * Math.PI * 24;
      return `<svg class="t-ring" viewBox="0 0 56 56" width="${size}" height="${size}"><circle cx="28" cy="28" r="24" class="t-ring__bg"/><circle cx="28" cy="28" r="24" class="t-ring__fg" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 28 28)"/><text x="28" y="32" text-anchor="middle">${fr(note)}</text></svg>`;
    };
    const chips = (r, max = 4) => r.comp.slice(0, max).map(c => `<span class="t-chip t-chip--${c.key}" title="${esc(c.detail)}">${esc(c.label)}</span>`).join("");
    const meta = r => [r.origin ? "Cacao : " + r.origin : null, r.cocoa ? r.cocoa + " %" : null, r.makerCountry && r.makerCountry !== r.origin ? "Fabriqué : " + r.makerCountry : null].filter(Boolean).map(esc).join(" · ");

    $("#tLead").textContent = `Les 100 meilleures tablettes de chocolat noir nature (60 à 80 % de cacao), classées en croisant les notes officielles des International Chocolate Awards, le Top 100 TasteAtlas, les plus grands jurys et dégustateurs du monde, Elite Traveler et The Chocolate Professor. Mis à jour le ${T.updated}.`;
    $("#tSources").innerHTML = T.sources.map(s => `<a class="t-src t-src--${s.key}" href="${esc(s.url)}" ${s.url.startsWith("#") ? "" : 'target="_blank" rel="noopener"'}><b>${esc(s.name)}</b><span>${esc(s.note)}</span><em>${esc(s.w)}</em></a>`).join("");

    const order = [1, 0, 2];
    $("#tPodium").innerHTML = order.map(i => { const r = R[i]; return `<button class="t-pod t-pod--${i + 1}" data-top="${i}">
      <span class="t-pod__rank">${i + 1}</span>
      <span class="t-pod__img">${visual(r, "t-pod__pic")}</span>
      <span class="t-pod__maker">${esc(r.maker)}</span>
      <span class="t-pod__bar">${esc(r.bar)}</span>
      <span class="t-pod__meta">${meta(r)}</span>
      <span class="t-pod__note">${ring(r.note, 70)}<small>${r.nSrc} sources</small></span>
      <span class="t-pod__chips">${chips(r, 3)}</span>
    </button>`; }).join("");

    const uniq = a => [...new Set(a.filter(Boolean))].sort((x, y) => x.localeCompare(y, "fr"));
    $("#tOrigin").innerHTML += uniq(R.map(r => r.origin)).map(o => `<option>${esc(o)}</option>`).join("");
    $("#tSource").innerHTML += T.sources.map(s => `<option value="${s.key}">${esc(s.name)}</option>`).join("");
    const st = { q: "", o: "", s: "" };
    function render() {
      const q = norm(st.q);
      const list = R.filter(r => r.rank > 3 && (!q || norm([r.maker, r.bar, r.origin, r.makerCountry].join(" ")).includes(q)) && (!st.o || r.origin === st.o) && (!st.s || r.comp.some(c => c.key === st.s)));
      const all = R.filter(r => (!q || norm([r.maker, r.bar, r.origin, r.makerCountry].join(" ")).includes(q)) && (!st.o || r.origin === st.o) && (!st.s || r.comp.some(c => c.key === st.s))).length;
      $("#tCount").textContent = `${all} tablette${all > 1 ? "s" : ""}`;
      $("#tList").innerHTML = list.map(r => `<li><button class="t-row" data-top="${r.rank - 1}">
        <span class="t-row__rank">${r.rank}</span>
        <span class="t-row__img">${visual(r, "t-row__pic")}</span>
        <span class="t-row__txt"><small>${esc(r.maker)}</small><b>${esc(r.bar)}</b><em>${meta(r)}</em></span>
        <span class="t-row__chips">${chips(r)}</span>
        <span class="t-row__note">${ring(r.note)}</span>
        <span class="t-row__go" aria-hidden="true">→</span>
      </button></li>`).join("") || `<li class="empty">Aucune tablette ne correspond.</li>`;
    }
    $("#tSearch").addEventListener("input", e => { st.q = e.target.value; render(); });
    $("#tOrigin").addEventListener("change", e => { st.o = e.target.value; render(); });
    $("#tSource").addEventListener("change", e => { st.s = e.target.value; render(); });
    $("#tMethod").innerHTML = T.method.map(m => `<li>${esc(m)}</li>`).join("");
    render();

    /* ----- fiche détaillée ----- */
    let cur = 0;
    function open(i) {
      cur = (i + R.length) % R.length; const r = R[cur];
      const search = "https://www.google.com/search?q=" + encodeURIComponent(`${r.maker} ${r.bar} chocolat`);
      $("#tModalBody").innerHTML = `<div class="tm">
        <div class="tm__img"><span class="tm__rank">N° ${r.rank}</span>${visual(r, "tm__pic")}</div>
        <div class="tm__info">
          <span class="tm__maker">${esc(r.maker)}</span>
          <h3 class="tm__bar">${esc(r.bar)}</h3>
          <p class="tm__meta">${meta(r) || "&nbsp;"}</p>
          <div class="tm__score">${ring(r.note, 84)}<div><b>${fr(r.note)}<small>/100</small></b><span>Note Chocolat Maga · ${r.nSrc} sources concordantes</span></div></div>
          <h4>Détail de la note</h4>
          <ul class="tm__comp">${r.comp.map(c => `<li><span class="t-chip t-chip--${c.key}">${esc(SRC[c.key]?.name || c.label)}</span><div class="tm__bar-track"><i style="width:${Math.max(4, (c.v - 80) * 5)}%"></i></div><b>${fr(c.v)}</b><small>${esc(c.detail)}</small></li>`).join("")}</ul>
          ${r.awards.length ? `<h4>Distinctions</h4><div class="tm__awards">${r.awards.map(a => `<span class="aw aw--${a.kind}" title="${esc(a.jury)}">${esc(a.label)}</span>`).join("")}</div>` : ""}
          <div class="tm__cta">
            <a class="btn btn--gold" href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.linkLabel)} <span class="arrow">↗</span></a>
            <a class="btn tm__ghost" href="${esc(search)}" target="_blank" rel="noopener">Rechercher</a>
          </div>
          <div class="tm__nav"><button data-tnav="-1">← N° ${cur === 0 ? R.length : cur}</button><button data-tnav="1">N° ${cur + 2 > R.length ? 1 : cur + 2} →</button></div>
        </div></div>`;
      $("#tModal").classList.add("open"); document.body.style.overflow = "hidden";
    }
    const close = () => { $("#tModal").classList.remove("open"); document.body.style.overflow = ""; };
    document.addEventListener("click", e => {
      const t = e.target.closest("[data-top]"); if (t) { open(+t.dataset.top); return; }
      const n = e.target.closest("[data-tnav]"); if (n) { open(cur + +n.dataset.tnav); return; }
      if (e.target.closest("[data-tclose]")) close();
    });
    addEventListener("keydown", e => {
      if (!$("#tModal").classList.contains("open")) return;
      if (e.key === "Escape") close(); else if (e.key === "ArrowRight") open(cur + 1); else if (e.key === "ArrowLeft") open(cur - 1);
    });
  })();


  /* ---------- Carte du monde ---------- */
  (async function map() {
    const box = $("#map"), tip = $("#tooltip"), panel = $("#mapPanel"), legend = $("#mapLegend");
    const panelDefault = () => panel.innerHTML = `<span class="eyebrow eyebrow--light">Mode d'emploi</span><h3>Choisissez un pays</h3>
      <p>La ceinture du cacao s'étend entre les 20ᵉ parallèles nord et sud : le cacaoyer exige chaleur, humidité et ombre.</p>
      <p class="hint">• <b>Production</b> : volume récolté par pays.<br/>• <b>Tablettes</b> : nombre de tablettes du répertoire par origine.<br/>• <b>Chocolatiers</b> : où sont fabriquées les tablettes.</p>
      <dl class="kv"><dt>Afrique</dt><dd>≈ 70 % du cacao mondial</dd><dt>Amériques</dt><dd>≈ 20 %, la majorité des cacaos fins</dd><dt>Asie-Océanie</dt><dd>≈ 7 %</dd></dl>`;
    panelDefault();
    if (!window.d3 || !window.topojson) { box.innerHTML = `<p class="empty">La carte nécessite une connexion internet (d3).</p>`; return; }
    let world;
    try { world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json"); }
    catch (e) { box.innerHTML = `<p class="empty">Impossible de charger le fond de carte.</p>`; return; }
    const W = 960, H = 500;
    const proj = d3.geoNaturalEarth1().scale(175).translate([W / 2, H / 2 + 20]);
    const path = d3.geoPath(proj);
    const svg = d3.select(box).append("svg").attr("viewBox", [0, 0, W, H]);
    const countries = topojson.feature(world, world.objects.countries).features.filter(f => f.id !== "010");
    svg.append("path").attr("class", "graticule").attr("d", path(d3.geoGraticule10()));
    const g = svg.append("g");
    const tabletsBy = {};
    C.forEach(c => originIds(c).forEach(id => (tabletsBy[id] = tabletsBy[id] || []).push(c)));

    const ramp = ["#f0dcc0", "#e0b98a", "#c8894b", "#9a5a35", "#6e3424", "#4a1f18"];
    const prodScale = d3.scaleThreshold().domain([5, 20, 60, 200, 500]).range(ramp);
    const tabScale = d3.scaleThreshold().domain([2, 3, 5, 8, 12]).range(ramp);
    const focBy = {}; FOC.forEach(r => r[5] && (focBy[r[5]] = focBy[r[5]] || []).push(r));
    const focScale = d3.scaleThreshold().domain([5, 20, 50, 100, 200]).range(ramp);
    let mode = "prod", selected = null;

    const paths = g.selectAll("path").data(countries).join("path").attr("class", "country").attr("d", path);
    // ceinture du cacao
    [20, -20].forEach(lat => {
      const line = { type: "LineString", coordinates: d3.range(-180, 181, 5).map(lon => [lon, lat]) };
      svg.append("path").attr("class", "belt").attr("d", path(line));
      const [x, y] = proj([-172, lat]);
      svg.append("text").attr("class", "belt-label").attr("x", x).attr("y", y - 5).text(lat > 0 ? "20° N" : "20° S");
    });
    const dots = svg.append("g").selectAll("circle").data(M).join("circle").attr("class", "maker")
      .attr("cx", d => proj([d.lon, d.lat])[0]).attr("cy", d => proj([d.lon, d.lat])[1]).attr("r", 0);

    function color() {
      paths.classed("has", d => mode === "makers" ? false : mode === "prod" ? !!O[d.id] : mode === "base" ? !!focBy[d.id] : !!tabletsBy[d.id])
        .transition().duration(400)
        .style("fill", d => {
          if (mode === "prod" && O[d.id]) return prodScale(O[d.id].prod);
          if (mode === "tablets" && tabletsBy[d.id]) return tabScale(tabletsBy[d.id].length);
          if (mode === "base" && focBy[d.id]) return focScale(focBy[d.id].length);
          return "#e6d9cb";
        });
      dots.transition().duration(400).attr("r", mode === "makers" ? 5 : 0);
      const dom = mode === "prod" ? ["< 5 kt", "> 500 kt"] : mode === "base" ? ["< 5 notées", "200 +"] : ["1 tablette", "12 +"];
      legend.innerHTML = mode === "makers"
        ? `<span style="display:inline-flex;align-items:center;gap:8px"><i style="width:10px;height:10px;border-radius:50%;background:#c8894b;display:inline-block"></i>${M.length} chocolatiers</span>`
        : `${mode === "prod" ? "Production de cacao" : mode === "base" ? "Tablettes notées (Flavors of Cacao)" : "Tablettes du répertoire"}<div class="ramp">${ramp.map(c => `<i style="background:${c}"></i>`).join("")}</div><div class="ends"><span>${dom[0]}</span><span>${dom[1]}</span></div>`;
    }

    const pos = e => { const b = box.parentElement.getBoundingClientRect(); return [e.clientX - b.left + 14, e.clientY - b.top + 14]; };
    const showTip = (e, html) => { const [x, y] = pos(e); tip.innerHTML = html; tip.style.left = x + "px"; tip.style.top = y + "px"; tip.style.opacity = 1; };
    const hideTip = () => tip.style.opacity = 0;

    paths.on("mousemove", (e, d) => {
      const o = O[d.id], t = tabletsBy[d.id], f = focBy[d.id];
      if (mode === "base") return f ? showTip(e, `<b>${f[0][4]}</b><br/>${f.length} tablettes notées · moyenne ${avg(f.map(r => r[10])).toFixed(2).replace(".", ",")}/4`) : hideTip();
      if (mode === "makers" || (!o && !t)) return hideTip();
      showTip(e, `<b>${o ? o.name : d.properties.name}</b><br/>${o ? `≈ ${o.prod.toLocaleString("fr-FR")} kt / an` : ""}${t ? ` · ${t.length} tablette${t.length > 1 ? "s" : ""}` : ""}`);
    }).on("mouseleave", hideTip).on("click", (e, d) => { if (mode === "base") { if (focBy[d.id]) selectFoc(d.id); } else if (mode !== "makers" && (O[d.id] || tabletsBy[d.id])) selectCountry(d.id); });

    dots.on("mousemove", (e, d) => showTip(e, `<b>${d.name}</b><br/>${d.city} · ${d.kind} · ${d.since}`))
      .on("mouseleave", hideTip).on("click", (e, d) => selectMaker(d));

    function selectCountry(id) {
      selected = id; paths.classed("sel", d => d.id === id);
      const o = O[id] || { name: countries.find(c => c.id === id)?.properties.name || "", prod: 0 };
      const t = (tabletsBy[id] || []).sort((a, b) => b.rating - a.rating);
      const share = o.prod ? (o.prod / d3.sum(Object.values(O), x => x.prod) * 100) : 0;
      panel.innerHTML = `<span class="eyebrow eyebrow--light">${esc(o.region || "Origine")}</span><h3>${esc(o.name)}</h3>
        ${o.prod ? `<dl class="kv"><dt>Production</dt><dd>≈ ${o.prod.toLocaleString("fr-FR")} kt / an</dd><dt>Part mondiale</dt><dd>≈ ${share < 1 ? share.toFixed(2) : share.toFixed(1)} %</dd><dt>Régions</dt><dd>${esc(o.regions)}</dd><dt>Variétés</dt><dd>${esc(o.varieties)}</dd><dt>Profil</dt><dd>${esc(o.profile)}</dd></dl><p>${esc(o.info)}</p>` : ""}
        <h4 style="font-size:.75rem;text-transform:uppercase;letter-spacing:.14em;color:#e0ad73;margin-top:6px">${t.length ? `${t.length} tablette${t.length > 1 ? "s" : ""} au répertoire` : "Aucune tablette au répertoire"}</h4>
        <div class="mini-list">${t.map(c => `<button data-open="${c.id}">${tablet(c)}<span>${esc(c.name)}<small>${esc(c.maker)} · ${c.cacao} % · ${c.rating}/10</small></span></button>`).join("")}</div>`;
    }
    function selectFoc(id) {
      paths.classed("sel", d => d.id === id);
      const f = focBy[id], best = [...f].sort((a, b) => b[10] - a[10] || b[3] - a[3]).slice(0, 12), o = O[id];
      const makers = new Set(f.map(r => r[1])).size;
      panel.innerHTML = `<span class="eyebrow eyebrow--light">Base mondiale</span><h3>${esc(f[0][4])}</h3>
        <dl class="kv"><dt>Tablettes notées</dt><dd>${f.length}</dd><dt>Fabricants</dt><dd>${makers}</dd><dt>Note moyenne</dt><dd>${avg(f.map(r => r[10])).toFixed(2).replace(".", ",")} / 4</dd><dt>≥ 4 (exceptionnel)</dt><dd>${f.filter(r => r[10] >= 4).length}</dd>${o ? `<dt>Profil</dt><dd>${esc(o.profile)}</dd>` : ""}</dl>
        <h4 style="font-size:.75rem;text-transform:uppercase;letter-spacing:.14em;color:#e0ad73;margin-top:6px">Les mieux notées</h4>
        <div class="mini-list">${best.map(r => `<div class="foc-row"><b>${String(r[10]).replace(".", ",")}</b><span>${esc(r[1])} — ${esc(r[6])}<small>${r[7]} % · ${r[3]} · ${esc(r[9])}</small></span></div>`).join("")}</div>
        <button class="btn btn--light" style="align-self:flex-start" id="seeAllFoc">Voir les ${f.length} tablettes</button>`;
      $("#seeAllFoc").onclick = () => window.__baseFilterOrigin(f[0][4]);
    }
    function selectMaker(m) {
      paths.classed("sel", false);
      const t = C.filter(c => c.maker === m.name || c.maker.startsWith(m.name) || m.name.startsWith(c.maker));
      panel.innerHTML = `<span class="eyebrow eyebrow--light">${esc(m.kind)}</span><h3>${esc(m.name)}</h3>
        <dl class="kv"><dt>Ville</dt><dd>${esc(m.city)}</dd><dt>Depuis</dt><dd>${esc(m.since)}</dd></dl>
        <div class="mini-list">${t.map(c => `<button data-open="${c.id}">${tablet(c)}<span>${esc(c.name)}<small>${esc(c.origin)} · ${c.cacao} %</small></span></button>`).join("")}</div>`;
    }

    $$("#mapMode button").forEach(b => b.addEventListener("click", () => {
      $$("#mapMode button").forEach(x => x.classList.toggle("on", x === b));
      mode = b.dataset.mode; paths.classed("sel", false); panelDefault(); color();
    }));
    // liens « voir sur la carte »
    document.addEventListener("click", e => {
      const a = e.target.closest("[data-country]"); if (!a) return;
      closeModal();
      if (mode === "makers") $('#mapMode [data-mode="prod"]').click();
      setTimeout(() => selectCountry(a.dataset.country), 50);
    });
    color();
  })();
})();
