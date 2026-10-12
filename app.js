/* Two Flying Boats, 1942 — a hypothetical study from the German Naval Staff's own war diary.
   Two ways through the same chapters: read the dossier, or take the Naval Staff's seat and decide. */
"use strict";

const D = {};
// Set when the itch.io page exists; the itch build sets window.TF_ITCH instead.
const ITCH_URL = "https://leofassb.itch.io/two-flying-boats-1942";
function supportBox() {
  if (window.TF_ITCH) return `<div class="support"><b>This study is free.</b> It took weeks of work in the archives. If you found it useful, please support it with a donation: use the <b>Support</b> / donate button on this itch.io page. Every contribution helps to open the next file.</div>`;
  if (ITCH_URL) return `<div class="support"><b>This study is free.</b> If you found it useful, you can support the work with a donation on its <a href="${ITCH_URL}" target="_blank" rel="noopener">itch.io page</a>.</div>`;
  return "";
}
const KEY = "twoflyingboats_state";
let S = { mode: null, choices: {}, seed: 1, reached: 1 };

const $ = s => document.querySelector(s);
const view = $("#view");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = n => Math.round(n).toLocaleString("en");
const pct = x => Math.round(x * 100) + " %";
const NCH = () => D.study.chapters.length;
const STRIKE_AFTER = 8;
const decs = c => c.decisions || (c.decision ? [c.decision] : []);

function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && "choices" in s) S = s; } catch (e) { /* none */ } }

async function boot() {
  const get = f => fetch(f, { cache: "no-cache" }).then(r => r.json());
  [D.study, D.file, D.model, D.plates, D.sources, D.map] = await Promise.all(
    ["data/study.json", "data/file.json", "data/model.json", "data/plates.json", "data/sources.json", "data/map.json"].map(get));
  TF.setData(D.model);
  load();
  window.addEventListener("hashchange", route);
  route();
}

function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [page, arg] = parts;
  document.querySelectorAll("nav a").forEach(a => {
    const t = a.getAttribute("href").replace(/^#\/?/, "").split("/")[0];
    a.classList.toggle("on", t === (page === "strike" || page === "result" ? "ch" : page));
  });
  modebar();
  window.scrollTo(0, 0);
  const pages = { "": start, ch: chapter, strike, result, file, data, plates, reflection, sources };
  (pages[page || ""] || start)(arg);
}

function modebar() {
  const m = S.mode === "play" ? `You are in the Naval Staff's seat. <a href="#/">Change</a>`
    : S.mode === "read" ? `You are reading the study. <a href="#/">Take the Naval Staff's seat instead</a>` : "";
  $("#modebar").innerHTML = m;
}

/* ------------------------------------------------------------ start */
function start() {
  view.innerHTML = `
  <div class="hero">
    <div>
      <span class="tag">1938 – 1945 · German Naval Staff · two BV 222 flying boats</span>
      <h1>A raid on New York, from the war diary that planned it</h1>
      <p class="lede">On 16 July 1942 the German Naval Staff recorded, “in a very restricted circle”, that at Hitler's request Göring was preparing a raid on New York by two flying boats, to be refuelled at sea by U-boats. Twelve days later the Luftwaffe's General Staff declined. The entries survive in the Naval Staff's war diary, translated in full by the US Navy after the war.</p>
      <p class="readable">This is a hypothetical study built on those pages, the third in a series after <a href="https://iron-hammer-1945.netlify.app/" target="_blank" rel="noopener">Iron Hammer, 1945</a> and <a href="https://dragons-lair-1944-45.netlify.app/" target="_blank" rel="noopener">Dragon's Lair, 1944–45</a>. It follows the wish to bomb New York from Göring's speech of 1938 to the Azores plans of 1940–41 and the war diary of July 1942, and it reads the city as the Nazi leadership's own papers described it: as the seat of “the New York Jews”. Then it turns to the New York the file does not count, and to the fear of 1945. You can read it as a dossier, or take the seat of the Naval Staff and decide where the file decides. A model then runs the raid with the file's figures and named assumptions.</p>
      <div class="modes">
        <div class="mode"><h3>Read the study</h3><p class="fine">Ten chapters with the war diary and the Nuremberg documents in facsimile and transcription. At each decision point you see what the file decided, and the study computes the file's own plan at the end.</p><button class="primary" data-mode="read">Read</button></div>
        <div class="mode play"><h3>Take the Naval Staff's seat</h3><p class="fine">The same chapters, but you decide: whether to give the U-boats, where Base 1 lies, one flying boat or two, when, and whether the matter rests when the Luftwaffe declines. If it does not, the study flies your raid.</p><button class="primary" data-mode="play">Decide</button></div>
      </div>
      ${supportBox()}
      <p class="fine">The study shows the planning of an attack from the side of those who planned it. It does not adopt their view: chapter 3 reads their antisemitic picture of the city from their own documents, and chapters 9 and 10 and the reflection follow what the file does not count. No swastika is shown.</p>
    </div>
    <figure class="facs"><img src="assets/file/k224-request.jpg" alt="Facsimile: 'a raid on New York by two BV 222's'">
      <figcaption>16 July 1942: “At the Fuehrer's request … a raid on New York by two BV 222's.” <a href="#/file/k224">The page →</a></figcaption></figure>
  </div>`;
  view.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => {
    const mode = b.dataset.mode;
    if (mode !== S.mode || mode === "play") { S.choices = {}; S.seed = Math.floor(Math.random() * 1e9); S.reached = 1; }
    S.mode = mode; save(); location.hash = "#/ch/1";
  });
}

/* ------------------------------------------------------------ chapters */
const strikeOn = () => S.mode === "play" && TF.flies(S.choices);

function progress(cur) {
  const chs = D.study.chapters;
  const items = chs.map(c => `<a href="#/ch/${c.n}" class="${cur === c.n ? "on" : c.n < S.reached ? "done" : ""}">${c.n}. ${esc(c.title)}</a>`);
  if (strikeOn()) items.splice(STRIKE_AFTER, 0, `<a href="#/strike" class="${cur === "strike" ? "on" : ""}">The raid</a>`);
  items.push(`<a href="#/result" class="${cur === "result" ? "on" : ""}">Accounting</a>`);
  return `<div class="progress">${items.join("")}</div>`;
}

function chapter(arg) {
  if (!S.mode) { S.mode = "read"; save(); modebar(); }
  const n = Math.max(1, Math.min(NCH(), +arg || 1));
  const c = D.study.chapters[n - 1];
  S.reached = Math.max(S.reached || 1, n); save();
  const side = [
    ...(c.facsimiles || []).map(f => `<figure class="facs"><a href="${f.href}"><img src="${f.src}" alt="${esc(f.caption)}" loading="lazy"></a><figcaption>${esc(f.caption)} <a href="${f.href}">The page →</a></figcaption></figure>`),
    ...(c.plates || []).map(id => plateFig(id)),
    ...(c.data || []).filter(id => id !== "map").map(id => `<div class="panel">${PANELS[id] ? PANELS[id](S.mode === "play" ? S.choices : null) : ""}</div>`),
  ].join("");
  const wide = (c.data || []).includes("map") ? `<div class="panel">${PANELS.map(S.mode === "play" ? S.choices : null)}</div>` : "";
  view.innerHTML = `
    ${progress(n)}
    <div class="chapter">
      <div>
        <span class="tag">Chapter ${n} · ${esc(c.part)} · ${esc(c.date)}</span>
        <h1>${esc(c.title)}</h1>
        <p class="lede">${esc(c.lede)}</p>
        <div class="readable">${c.body.map(p => `<p>${esc(p)}</p>`).join("")}</div>
        ${(c.quotes || []).map(q => `<div class="quote readable"><div class="de">${esc(q.text)}</div><div class="fine"><a href="${q.cite.href}">${esc(q.cite.label)}</a></div></div>`).join("")}
        ${decs(c).map(decisionBox).join("")}
        <p class="fine">Sources: ${(c.sources || []).map(id => `<a href="#/sources" title="${esc(D.sources[id].cite)}">${esc(D.sources[id].short)}</a>`).join(" · ")}</p>
        <div class="navrow">${n > 1 ? `<a class="btn" href="#/ch/${n - 1}">← Chapter ${n - 1}</a>` : "<span></span>"}<span id="next"></span></div>
      </div>
      <div class="side">${side}</div>
    </div>
    ${wide}`;
  wireDecision(c, n);
}

function decisionBox(d) {
  if (S.mode === "play") {
    const cur = S.choices[d.key];
    return `<div class="decision" data-key="${d.key}"><span class="tag">Your decision</span><h3>${esc(d.prompt)}</h3>
      <div class="opts">${d.options.map(o => `<button class="opt ${cur === o.value ? "chosen" : ""}" data-k="${d.key}" data-v="${o.value}"><b>${esc(o.label)}</b><span>${esc(o.detail)}</span></button>`).join("")}</div>
      <p class="filenote">The file: ${esc(d.fileNote)}</p></div>`;
  }
  return `<div class="decision"><span class="tag">Decision point</span><h3>${esc(d.prompt)}</h3>
    <div class="opts">${d.options.map(o => `<div class="opt ${d.file === o.value ? "chosen" : ""}"><b>${esc(o.label)}${d.file === o.value ? " · the file's answer" : ""}</b><span>${esc(o.detail)}</span></div>`).join("")}</div>
    <p class="filenote">${esc(d.fileNote)}</p></div>`;
}

function wireDecision(c, n) {
  const next = $("#next");
  const nextTarget = () => {
    if (n === STRIKE_AFTER && strikeOn()) return ["#/strike", "The raid →"];
    if (n === NCH()) return ["#/result", "The accounting →"];
    return [`#/ch/${n + 1}`, `Chapter ${n + 1} →`];
  };
  const draw = () => {
    const need = S.mode === "play" && decs(c).some(d => !S.choices[d.key]);
    const [href, label] = nextTarget();
    next.innerHTML = need ? `<span class="fine">Decide to continue.</span>` : `<a class="btn primary" href="${href}">${label}</a>`;
  };
  view.querySelectorAll(".opt[data-v]").forEach(b => b.onclick = () => {
    S.choices[b.dataset.k] = b.dataset.v;
    save();
    view.querySelectorAll(`.opt[data-k="${b.dataset.k}"]`).forEach(x => x.classList.toggle("chosen", x === b));
    draw(); progressRefresh(n);
  });
  draw();
}
function progressRefresh(n) { const p = view.querySelector(".progress"); if (p) p.outerHTML = progress(n); }

/* ------------------------------------------------------------ the raid (play) */
const FILE_PLAN = { naval: "support", base1: "ny1000", planes: "2", when: "sep", final: "press" };

function strike() {
  if (!strikeOn()) { location.hash = `#/ch/${STRIKE_AFTER}`; return; }
  const r = TF.run(S.choices, S.seed);
  view.innerHTML = `
    ${progress("strike")}
    <span class="tag">In this study only</span>
    <h1>The raid</h1>
    <p class="lede readable">What follows did not happen. It is the model's run of your plan, with the file's figures where it gives them and named assumptions where it does not.</p>
    <div class="log readable">${r.log.map(l => `<p>${esc(l)}</p>`).join("")}</div>
    <div class="panel readable">${PANELS.map(S.choices)}</div>
    <div class="navrow"><a class="btn" href="#/ch/${STRIKE_AFTER}">← Chapter ${STRIKE_AFTER}</a><a class="btn primary" href="#/ch/${STRIKE_AFTER + 1}">Chapter ${STRIKE_AFTER + 1}: the city →</a></div>`;
}

/* ------------------------------------------------------------ accounting */
function result() {
  const play = S.mode === "play" && S.choices.final;
  const c = play ? S.choices : FILE_PLAN;
  const flown = TF.flies(c);
  const mc = flown ? TF.monteCarlo(c, 1000, play ? 9000 : 3000) : null;
  const r = play ? TF.run(c, S.seed) : null;
  const n = c.planes === "1" ? 1 : 2;
  const fileCol = `<div class="col"><span class="tag">What the file expected</span>
      <div class="big">${n === 1 ? "One" : "Two"} flying boat${n === 1 ? "" : "s"} over New York</div>
      <p class="fine">At a price of two U-boat missions, “60,000 to 80,000 GRT of enemy shipping” left unsunk. The file names no bomb load, no target in the city, no expected effect and no losses. It does not say why New York.</p></div>`;
  const modelCol = mc ? `<div class="col model"><span class="tag">What the model gives</span><div class="big">${pct(mc.anyReached)}</div>
      <p class="fine">Share of 1,000 runs in which at least one aircraft drops its bombs on New York; in ${pct(mc.flown)} the operation gets as far as the go-ahead from Base 1. Median bombs on the city: ${mc.bombs.med.toFixed(1)} t (90 % of runs: at most ${mc.bombs.p90.toFixed(1)} t). At least one crew lost in ${pct(mc.anyCrewLost)} of runs; a tanker boat lost afterwards in ${pct(mc.uboatLost)}.</p></div>`
    : `<div class="col model"><span class="tag">What the model gives</span><div class="big">No raid</div>
      <p class="fine">${c.naval === "object" ? "Without the U-boats the flying boats cannot reach New York and back. The two boats stay in the war on shipping." : "The matter rests after the General Staff declines. The two boats go back to the war on shipping."}</p></div>`;
  const recordCol = `<div class="col soviet"><span class="tag">What the record shows</span><div class="big">No bomb</div>
      <p class="fine">No German aircraft ever attacked New York. The Luftwaffe's General Staff declined on 28 July 1942, and the war diary never mentions the raid again. Six weeks earlier the RAF had dropped about 1,455 tons on Cologne in one night. In April and May 1945 the fear of a German attack on the city ended in Operation Teardrop: 241 German and about 115 American seamen dead, and no rockets.</p></div>`;
  let body;
  if (play) {
    const runLine = !TF.flies(c) ? "no raid" : r.flown ? `${r.reached} aircraft over New York, ${r.bombs.toFixed(1)} t of bombs; ${r.planesLost} aircraft and ${r.crewsLost} crew${r.crewsLost === 1 ? "" : "s"} lost${r.uboatsLost ? `, ${r.uboatsLost} U-boat${r.uboatsLost === 1 ? "" : "s"} lost` : ""}` : "called off before the attack";
    body = `<h2>Your plan</h2>
      <div class="cols3">${fileCol}${modelCol}${recordCol}</div>
      <h2>This run</h2>
      <ul class="readable"><li>${esc(runLine)}.</li></ul>
      <p class="fine readable">Choices: U-boats ${c.naval === "support" ? "given" : "refused"}; ${esc(TF.base1(c.base1 || "ny1000").name)}; ${c.planes === "1" ? "one flying boat" : "two flying boats"}; ${esc(TF.win(c.when || "sep").date)}; ${c.final === "press" ? "the General Staff overruled" : "the matter rests"}.</p>`;
  } else {
    body = `<h2>The file's plan, computed</h2>
      <p class="readable">The plan as the war diary describes it on 16 and 17 July 1942: two BV 222s, Base 1 read as 1,000 km from New York, Base 2 north of the Azores, the new-moon nights after 10 September. The model flies it as if the General Staff had not declined, 1,000 times:</p>
      <div class="cols3">${fileCol}${modelCol}${recordCol}</div>
      <h2>What happened</h2>
      <p class="readable">Nothing. The plan existed for twelve days in the war diary of the Naval Staff, and ended in one sentence. <a href="#/">Take the Naval Staff's seat</a> to run your own plan.</p>`;
  }
  view.innerHTML = `
    ${progress("result")}
    <span class="tag">The accounting</span>
    <h1>What the file expected, what the model gives, what the record shows</h1>
    ${body}
    <h2>What no column counts</h2>
    <p class="readable">The file counts tons of shipping, because that is what the navy counted. Behind the 60,000 to 80,000 tons were the crews of ships that would, or would not, have been sunk. The file does not count the eleven men in each flying boat, or the crews of the tanker U-boats. It does not count the seven and a half million people of New York, among them some two million Jews and the refugees from Germany in Washington Heights, whose families were being deported while the raid was planned. The leadership that asked for the raid had told itself that “the New York Jews” had made the war. The model counts tonnes of bombs; it cannot count what such a raid was meant to say. See the <a href="#/reflection">reflection</a>.</p>
    ${supportBox()}
    <div class="navrow"><a class="btn" href="#/ch/${NCH()}">← Chapter ${NCH()}</a>${S.mode === "play" ? `<button id="again">Plan again</button>` : `<a class="btn primary" href="#/">Take the Naval Staff's seat</a>`}</div>`;
  const again = $("#again");
  if (again) again.onclick = () => { S.choices = {}; S.seed = Math.floor(Math.random() * 1e9); S.reached = 1; save(); location.hash = "#/ch/1"; };
}

/* ------------------------------------------------------------ panels */
const PANELS = {
  bv222() {
    return `<h3>The BV 222</h3><table>
      <tr><td>Type</td><td>Blohm &amp; Voss BV 222 “Wiking”, six-engined flying boat, designed as a transatlantic airliner</td></tr>
      <tr><td>Span, length</td><td>150 ft (46 m), 115 ft (35 m), after the US Navy recognition poster of 1944</td></tr>
      <tr><td>First flight</td><td>7 September 1940; thirteen completed in all</td></tr>
      <tr><td>In July 1942</td><td>a handful, flying supplies across the Mediterranean to North Africa</td></tr>
      <tr><td>Engines</td><td>early aircraft: radial petrol engines; diesel engines only in the later C series</td></tr>
      <tr><td>Crew</td><td>about eleven</td></tr>
      <tr><td>Bomb load</td><td>not stated in the file; the study assumes about 1 t per aircraft</td></tr>
    </table><p class="fine">Figures from the poster and the published type histories (secondary), not from the file. <a href="#/sources">Sources →</a></p>`;
  },
  price() {
    const t = D.model.costs.tonnage;
    return `<h3>The navy's price</h3>
      <div class="big">${fmt(t[0])}–${fmt(t[1])} GRT</div>
      <p class="fine">“2 missions during which 60,000 to 80,000 GRT of enemy shipping could be sunk” (16 July 1942). In 1942 an average merchant ship sunk in the Atlantic was of some 5,000 to 6,000 GRT: the price was on the order of a dozen ships and their crews, set against one or two aircraft over New York.</p>`;
  },
  chain() {
    const A = D.model.assumptions;
    const chain = [["U-boat on station", A.uboatOnStation], ["weather holds", A.weatherHolds], ["finds Base 1", A.findBase1], ["refuels", A.refuel], ["not intercepted", 1 - A.detectApproach * A.interceptNight], ["finds the city", A.findCity], ["survives the guns", 1 - A.aaLoss]];
    const prod = chain.reduce((p, x) => p * x[1], 1);
    return `<h3>Nine steps, not one</h3>
      <p class="fine">The file describes the procedure; it gives no odds. The study counts the steps it describes, for one aircraft and Base 1 out of reach of the patrols, before the sea at Base 1 has been calm enough at all:</p>
      <div class="chain">${chain.map(([l, p]) => `<span class="p">${l} ${pct(p)}</span>`).join(" × ")} = <b>${pct(prod)}</b></div>
      <p class="fine">And then home again: Base 2 found ${pct(A.findBase2)}, refuelled ${pct(A.refuel2)}. Every figure is an assumption of the study, named on the <a href="#/data">Data</a> page.</p>`;
  },
  city() {
    const C = D.model.context;
    return `<h3>New York in figures</h3><table>
      <tr><td>Inhabitants, census of 1940</td><td class="num">${fmt(C.nyPopulation)}</td></tr>
      <tr><td>Of them Jewish (estimate)</td><td class="num">about 2,000,000</td></tr>
      <tr><td>Bombs in the study's raid, per aircraft</td><td class="num">about 1 t</td></tr>
      <tr><td>RAF on Cologne, 30/31 May 1942</td><td class="num">about 1,455 t</td></tr>
    </table><p class="fine">${esc(C.nyJewishNote)}</p>`;
  },
  teardrop() {
    const rows = [["U-1235", "15 Apr 1945", "57"], ["U-880", "16 Apr 1945", "49"], ["U-518", "22 Apr 1945", "56"], ["U-546", "24 Apr 1945", "26 (33 survived)"], ["U-881", "6 May 1945", "53"], ["USS Frederick C. Davis", "24 Apr 1945", "about 115"]];
    return `<h3>Operation Teardrop, April–May 1945</h3><table><tr><th>Ship</th><th>Sunk</th><th class="num">Dead</th></tr>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="num">${r[2]}</td></tr>`).join("")}</table>
      <p class="fine">None of the U-boats carried rockets. Figures after uboat.net and the US Navy's records (secondary); the figure for the Frederick C. Davis differs between sources.</p>`;
  },
  map(c) { return `<h3>Biscarrosse, the two bases and New York</h3>${mapSvg(c && c.base1 ? c : null)}<p class="fine">Great-circle distances. Dashed circle: 1,000 km round New York. Dotted: the flight out from France to Base 1. Small squares: US and Canadian air bases for patrols. Base 1 in the three readings of chapter 6${c && c.base1 ? "; your choice in red" : ""}. Coastline: Natural Earth.</p>`; },
};

function plateFig(id) {
  const p = D.plates.plates.find(x => x.id === id);
  if (!p) return "";
  return `<figure><a href="assets/plates/${p.id}.jpg"><img src="assets/plates/${p.id}_t.jpg" alt="${esc(p.titel)}" loading="lazy"></a><figcaption><b>${esc(p.titel)}.</b> ${esc(p.caption)}</figcaption></figure>`;
}

/* ------------------------------------------------------------ map */
const PATROL = [{ name: "Halifax", lat: 44.65, lon: -63.57 }, { name: "Argentia", lat: 47.3, lon: -53.98 }, { name: "Bermuda", lat: 32.36, lon: -64.68 }];
function mapSvg(c) {
  const M = D.map, Mo = D.model;
  const P = (lon, lat) => [+((lon - M.lon0) * M.cos * M.k).toFixed(1), +((M.lat1 - lat) * M.k).toFixed(1)];
  const circle = (b, km) => {
    const pts = [], R = 6371, d = km / R, la = b.lat * Math.PI / 180, lo = b.lon * Math.PI / 180;
    for (let a = 0; a <= 360; a += 6) {
      const br = a * Math.PI / 180;
      const la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(br));
      const lo2 = lo + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
      pts.push(P(lo2 * 180 / Math.PI, la2 * 180 / Math.PI).join(","));
    }
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="var(--steel)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  };
  const t = Mo.target, [tx, ty] = P(t.lon, t.lat), [hx, hy] = P(Mo.home.lon, Mo.home.lat), [b2x, b2y] = P(Mo.base2.lon, Mo.base2.lat);
  const chosen = (c && c.base1) || "ny1000";
  const b1 = Mo.base1.find(b => b.id === chosen), [b1x, b1y] = P(b1.lon, b1.lat);
  const leg = (x1, y1, x2, y2, km, f, dy, dash) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink2)" stroke-width="1.4" opacity=".8"${dash ? ` stroke-dasharray="2 4"` : ""}/><text x="${(x1 + (x2 - x1) * f).toFixed(0)}" y="${(y1 + (y2 - y1) * f + dy).toFixed(0)}" font-size="13" fill="var(--ink2)" text-anchor="middle">${fmt(km)} km</text>`;
  const route = leg(hx, hy, b1x, b1y, TF.dist(Mo.home, b1), 0.62, 18, true) + leg(b1x, b1y, tx, ty, TF.dist(b1, t), 0.5, 18) + leg(tx, ty, b2x, b2y, TF.dist(t, Mo.base2), 0.5, -7) + leg(b2x, b2y, hx, hy, TF.dist(Mo.base2, Mo.home), 0.5, -7);
  const bases = Mo.base1.map(b => { const [x, y] = P(b.lon, b.lat), on = b.id === chosen && c; const lab = b.id === "ny1000" ? ["Base 1: 1,000 km from New York", 9, 20] : b.id === "coast1000" ? ["Base 1: 1,000 km from any coast", 9, 20] : ["Base 1: 600 km", 9, -10]; return `<g><circle cx="${x}" cy="${y}" r="6" fill="${on ? "var(--accent)" : "var(--steel)"}"/><text x="${x + lab[1]}" y="${y + lab[2]}" font-size="13" fill="var(--ink)">${lab[0]}</text></g>`; }).join("");
  const patrol = PATROL.map(b => { const [x, y] = P(b.lon, b.lat); return `<g><rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="var(--ink2)"/><text x="${x + 7}" y="${y - 6}" font-size="11" fill="var(--ink2)">${b.name}</text></g>`; }).join("");
  return `<div class="mapwrap"><svg viewBox="0 0 ${M.w} ${M.h}" role="img" aria-label="Map of the route from Biscarrosse to New York with the two bases at sea">
    <rect width="${M.w}" height="${M.h}" fill="var(--sea)"/><path d="${M.land}" fill="var(--land)" stroke="var(--ink2)" stroke-width="0.6" fill-rule="evenodd"/>
    ${circle(t, 1000)}${route}${patrol}${bases}
    <g><circle cx="${b2x}" cy="${b2y}" r="6" fill="var(--steel)"/><text x="${b2x + 9}" y="${b2y + 20}" font-size="13" fill="var(--ink)">Base 2, north of the Azores</text></g>
    <g><rect x="${hx - 5}" y="${hy - 5}" width="10" height="10" fill="var(--ink)"/><text x="${hx - 8}" y="${hy - 9}" font-size="13" fill="var(--ink)" text-anchor="end">Biscarrosse</text></g>
    <g><circle cx="${tx}" cy="${ty}" r="7" fill="var(--accent)"/><text x="${tx - 6}" y="${ty + 26}" font-size="15" font-weight="600" fill="var(--ink)">New York</text></g></svg></div>`;
}

/* ------------------------------------------------------------ the file */
function file(arg) {
  const pages = D.file.docs.flatMap(d => d.pages.map(p => ({ ...p, doc: d })));
  const cur = pages.find(p => p.id === arg);
  const list = D.file.docs.map(d => `<div><b>${esc(d.title)}</b> <span class="fine">${esc(d.ref)} · ${esc(d.src)}</span><div class="pagelist">${d.pages.map(p => `<a class="btn" href="#/file/${p.id}">${esc(p.frame)}${p.date ? " · " + esc(p.date) : ""}</a>`).join("")}</div></div>`).join("");
  if (!cur) {
    view.innerHTML = `<span class="tag">The file</span><h1>${esc(D.file.title)}</h1>
      <p class="lede readable">Eleven pages: the six pages of the Naval Staff's war diary on which the raid on New York begins and ends, and five pages of the documents put in evidence at Nuremberg, from Göring's wish of 1938 to Rosenberg's “New York Jews” of December 1941.</p>
      <div class="panel readable">${list}</div>
      <p class="fine readable">${esc(D.file.note)}</p>
      <p class="fine">${esc(D.file.source)} <a href="${D.file.url}">The war diary at archive.org →</a></p>`;
    return;
  }
  const i = pages.indexOf(cur);
  view.innerHTML = `<span class="tag">The file · ${esc(cur.doc.short)} · ${cur.date ? esc(cur.date) + " · " : ""}${esc(cur.frame)}</span>
    <h1>${esc(cur.doc.title)}</h1>
    <div class="pagelist">${pages.map(p => `<a class="btn ${p === cur ? "primary" : ""}" href="#/file/${p.id}">${esc(p.doc.short === "Naval Staff war diary" ? p.frame : p.doc.short + (p.doc.pages.length > 1 ? " " + p.frame.split(", ").pop() : ""))}</a>`).join("")}</div>
    <div class="pageview">
      <figure class="facs"><a href="assets/file/${cur.id}.jpg"><img src="assets/file/${cur.id}.jpg" alt="Facsimile of ${esc(cur.doc.short)}, ${esc(cur.frame)}"></a><figcaption>${esc(cur.doc.ref)}, ${esc(cur.frame)}. ${esc(cur.doc.src)}.</figcaption></figure>
      <div><h3>Transcription</h3><pre>${esc(cur.text)}</pre><h3 style="margin-top:1rem">Note</h3><div class="en">${esc(cur.note)}</div></div>
    </div>
    <div class="navrow">${i > 0 ? `<a class="btn" href="#/file/${pages[i - 1].id}">← previous page</a>` : "<span></span>"}${i < pages.length - 1 ? `<a class="btn" href="#/file/${pages[i + 1].id}">next page →</a>` : ""}</div>
    <p class="fine">${esc(D.file.note)}</p>`;
}

/* ------------------------------------------------------------ data */
function data() {
  const A = D.model.assumptions, N = D.model.assumptionNotes, Mo = D.model;
  view.innerHTML = `<span class="tag">Data</span><h1>The figures behind the study</h1>
    <p class="lede readable">Three kinds of number: the file's own, figures from other records and the literature, and the study's assumptions. They are marked as such wherever they appear.</p>
    <div class="panel">${PANELS.map()}</div>
    <div class="grid g2"><div class="panel">${PANELS.bv222()}</div><div class="panel">${PANELS.chain()}</div></div>
    <div class="grid g2"><div class="panel">${PANELS.price()}</div><div class="panel">${PANELS.city()}</div></div>
    <h2>Places</h2>
    <table>
      <tr><td><b>${esc(Mo.home.name)}</b></td><td class="num">${fmt(TF.dist(Mo.home, Mo.target))} km to New York</td><td class="fine">${esc(Mo.home.note)}</td></tr>
      ${Mo.base1.map(b => `<tr><td><b>${esc(b.name)}</b></td><td class="num">${fmt(TF.dist(b, Mo.target))} km to New York</td><td class="fine">${esc(b.note)}</td></tr>`).join("")}
      <tr><td><b>${esc(Mo.base2.name)}</b></td><td class="num">${fmt(TF.dist(Mo.base2, Mo.target))} km to New York</td><td class="fine">${esc(Mo.base2.note)}</td></tr>
    </table>
    <h2>The windows</h2>
    <table>${Mo.windows.map(w => `<tr><td><b>${esc(w.label)}</b></td><td>${esc(w.moon)}; night about ${w.night} h</td><td class="fine">Sea calm enough at Base 1 on ${pct(w.sea)} of days (assumption). ${esc(w.seaNote)}</td></tr>`).join("")}</table>
    <p class="fine">${esc(Mo.aircraft.note)}</p>
    <h2>The study's assumptions</h2>
    <table><tr><th>Parameter</th><th>Value</th><th>Basis</th></tr>${Object.keys(A).map(k => `<tr><td>${esc(k)}</td><td>${pct(A[k])}</td><td class="fine">${esc(N[k] || "")}</td></tr>`).join("")}</table>
    <div class="panel">${PANELS.teardrop()}</div>
    <p class="fine">The model is in <code>model.js</code>, every number in <code>data/model.json</code>. ${esc(D.map.source)}.</p>`;
}

/* ------------------------------------------------------------ plates, sources, reflection */
function plates() {
  view.innerHTML = `<span class="tag">Plates</span><h1>The aircraft, the boats and the city</h1>
    <p class="lede readable">The flying boat as the US Navy taught its crews to recognise it and as it found it in 1945, a type IXc U-boat, New York in the dim-out of 1942 as the Office of War Information photographed it, and the dead of the fear of 1945.</p>
    <div class="plates">${D.plates.plates.map(p => plateFig(p.id).replace("</figcaption>", ` <span class="fine">${esc(p.source)}</span></figcaption>`)).join("")}</div>
    <p class="fine">${esc(D.plates.credit)}</p>`;
}

function sources() {
  const order = ["skl", "r140", "ps1517", "ps001", "ps2663", "ps2441", "nca", "fc", "bdu", "poster", "owi", "fdr", "goebbels", "census", "ajyb", "dimout", "bv222lit", "laconia", "uboatlit", "moon", "amerikabomber", "ju390", "elster", "ingersoll", "teardrop", "u546", "ironhammer", "dragonslair"];
  const read = { checked: "checked by the editor at the page images or text", research: "read by a research pass, not yet checked by the editor", referred: "referred to only", lead: "lead, not seen" };
  view.innerHTML = `<span class="tag">Sources, method, limits</span><h1>How this study is made</h1>
    <div class="readable">
      <p><b>The file first.</b> The core is three entries in the war diary of the German Naval Staff, 16, 17 and 28 July 1942, read in the complete translation the US Office of Naval Intelligence made after the war. They are given in facsimile and transcription. The German original, in the Bundesarchiv, has not been seen; where the study quotes the file, it quotes the American translation.</p>
      <p><b>The wish and the city, from their own papers.</b> Göring's speech of 1938, Hitler's words on the Azores, and the Rosenberg documents of December 1941 are read in the official translations made for the Nuremberg trials and for the navies. Chapter 3 shows what “New York” meant in the leadership's language; it does not claim that the order of July 1942 was given for that reason, because no document says so.</p>
      <p><b>Public domain where it is quoted.</b> US Government translations and photographs, and British official texts whose Crown copyright has expired, are quoted and shown. Modern scholarship and books still in copyright are summarised and cited, not reproduced.</p>
      <p><b>Three kinds of number.</b> The file's own figures, figures from other records and the literature, and the study's assumptions, each named on the <a href="#/data">Data</a> page.</p>
      <p><b>Hypothetical.</b> The raid in the playable study did not happen. The model is a way of reading the file's procedure against the conditions it would have met, not a forecast of an alternative war.</p>
    </div>
    <h2>Sources</h2>
    ${order.map(id => { const s = D.sources[id]; return `<div class="panel readable"><b>${esc(s.short)}</b><p class="fine">${esc(s.cite)}</p><p class="fine">${esc(s.status)} · <i>${read[s.read]}</i>${s.url ? ` · <a href="${s.url}" target="_blank" rel="noopener">online</a>` : ""}</p></div>`; }).join("")}
    <h2>Open questions</h2>
    <ul class="readable fine">
      <li>The German original of the war diary entries (Bundesarchiv-Militärarchiv, RM 7; also on NARA microfilm) has not been seen.</li>
      <li>No Luftwaffe record of the raid has been found: neither Göring's order, nor the Quartermaster General's papers, nor the General Staff's reasons for declining.</li>
      <li>The Luftwaffe's long-range study of spring 1942, said to list twenty-one targets in North America, and its reported abandonment on 21 August 1942 are known only from the secondary literature.</li>
      <li>Hitler's reported wish to see New York in flames comes from Albert Speer's memoirs of the 1970s; it is not used as evidence here.</li>
      <li>The British interrogation report behind the Ju 390 legend, the FBI files on Operation Elster and the Eastern Sea Frontier's war diary for April and May 1945 have not been read.</li>
    </ul>`;
}

function reflection() {
  view.innerHTML = `<span class="tag">Reflection</span><h1>A wish, a price and a city</h1>
    <div class="readable">
      <p>This study, like <i>Iron Hammer</i> and <i>Dragon's Lair</i>, puts its reader in the seat of a German staff. This time it is the Naval Staff, because the only surviving record of the raid is the navy's. The navy did not ask for the raid. It was asked to pay for it.</p>
      <p><b>A wish.</b> The file begins with three words: “At the Fuehrer's request”. Göring had wanted a bomber that could reach New York in 1938, Hitler had wanted the Azores for one in 1940 and 1941. In July 1942 the wish was reduced to what was possible: one or two flying boats, a few tons of bombs, U-boats as petrol stations in mid-ocean. No one in the file asks what the raid was for. It did not need to be for anything that a staff could measure.</p>
      <p><b>A price.</b> The navy answered as it always had: in tonnage. Its arithmetic is cool and exact, and it leaves out the men on both sides of every sinking. That is the nature of a war diary. The study does not correct it; it sets it beside the people it leaves out.</p>
      <p><b>A city.</b> For the men who wished for the raid, New York was the city of “the New York Jews”, who had in their telling made the war and would pay for it. Their own papers say so, and they said it in the same weeks in which the deportations were being carried out. The war diary says nothing of this, and a study that put the motive into the file would be inventing evidence. What it can do is show both: the file, which is silent, and the words of the men who gave the order, which are not. A bomb on New York in 1942 would have been read through those words.</p>
      <p><b>What the model cannot count.</b> In most runs of the model, the raid ends at sea: in the swell beside a U-boat, short of fuel near the Azores, in the dark off a dimmed coast. Where it reaches New York, it drops about as much as one or two of the thousand RAF bombers over Cologne carried in a single night. Militarily it was nothing. As a sign it would have been something, and the model cannot weigh signs.</p>
      <p><b>Fear.</b> The raid was never flown, but the fear of it outlived the plan. In 1945 a legend of a German aircraft off Long Island, and the belief that U-boats might carry rockets to New York, led to the last great anti-submarine operation of the Atlantic war. More men died in that hunt for a weapon that did not exist than any of the July plans would have put at risk.</p>
      <p><b>Why play it.</b> The playable part does not reward destruction; it measures a plan against the conditions it would have met. The point is to see, decision by decision, what the people who planned it had in front of them, what they counted, and what they did not.</p>
    </div>`;
}

boot();
