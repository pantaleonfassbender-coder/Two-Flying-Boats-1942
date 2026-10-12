/* Two Flying Boats, 1942 — the raid model.
   Takes the decisions of the playable study and the figures in data/model.json and runs the raid on New York
   that the Naval Staff's war diary of July 1942 describes: two bases at sea, U-boats as tankers, a night attack.
   Every probability is either the file's own or an assumption named in model.json. */
"use strict";

const TF = (function () {
  let D = null;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function dist(a, b) {
    const r = x => x * Math.PI / 180;
    const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }

  const win = id => D.windows.find(w => w.id === id);
  const base1 = id => D.base1.find(b => b.id === id);
  const flies = c => c.naval === "support" && c.final === "press";

  /* One aircraft from France to New York and back. */
  function sortie(i, c, w, b1, rnd, L, base2ok) {
    const A = D.assumptions, ac = D.aircraft;
    const a = { reached: false, bombs: 0, lost: false, crewLost: false };
    const name = c.planes === "2" ? `Aircraft ${i + 1}` : "The aircraft";
    if (rnd() >= A.weatherHolds) { L(`${name}: the weather at Base 1 turns while it is on its way; it lands, rides out the sea for a day and goes home without fuel for the attack.`); return a; }
    if (rnd() >= A.findBase1) { L(`${name} does not find the U-boat at Base 1 and turns back with what fuel is left.`); return a; }
    const spot = b1.id === "ny600" ? A.patrolSpot : b1.id === "ny1000" ? A.patrolSpot / 2 : 0;
    if (rnd() < spot) {
      a.lost = true; a.crewLost = rnd() >= A.crewRescue;
      L(`${name} is seen on the surface beside the U-boat by a patrol aircraft and bombed before the refuelling is done; ${a.crewLost ? "most of the crew are lost" : "the crew are taken aboard the U-boat, the aircraft sinks"}.`);
      return a;
    }
    if (rnd() >= A.refuel) { L(`${name}: the swell parts the hoses twice; with too little fuel for the attack, it is sent home.`); return a; }
    const leg = dist(b1, D.target), hours = leg / ac.cruise;
    L(`${name} refuels at Base 1 and takes off at dusk: ${Math.round(leg).toLocaleString("en")} km and about ${hours.toFixed(1)} hours to New York.`);
    const clear = 800 / ac.cruise; // hours to leave the coastal patrol zone after the attack
    const daylight = hours + clear + 0.5 > w.night;
    if (daylight) L(`The night is too short for the way in and out: the aircraft will be over the sea in daylight on its return.`);
    if (rnd() < A.detectApproach) {
      L("It is picked up on the way in.");
      if (rnd() < A.interceptNight) { a.lost = true; a.crewLost = true; L(`${name} is caught by a fighter off the coast and shot down. The crew of eleven are killed.`); return a; }
    }
    if (rnd() >= A.findCity) { L(`Over the dimmed coast the crew cannot make out the city; the bombs go into the sea off Long Island.`); }
    else {
      a.reached = true; a.bombs = ac.load;
      L(`${name} reaches New York and drops about ${ac.load.toFixed(1)} tonne of bombs.`);
      if (rnd() < A.aaLoss) { a.lost = true; a.crewLost = true; L("It is hit by the anti-aircraft guns over the harbour and crashes."); return a; }
    }
    if (daylight && rnd() < A.interceptDay) {
      a.lost = true; a.crewLost = true;
      L(`${name} is still within reach of the coast at first light; a patrol aircraft finds it and shoots it down. The crew are killed.`);
      return a;
    }
    const total = leg + dist(D.target, D.base2), margin = ac.range - total;
    const short = margin >= 1000 ? 0 : Math.min(1, (1000 - margin) / 1000) * 0.5;
    if (short && rnd() < short) {
      a.lost = true; a.crewLost = rnd() >= A.crewRescue / 2;
      L(`${name} has flown ${Math.round(total).toLocaleString("en")} km since Base 1, close to the limit of its range with the bomb load; it runs out of fuel short of Base 2 and comes down at sea. ${a.crewLost ? "The crew are not found." : "The U-boat finds the crew after a day's search."}`);
      return a;
    }
    if (!base2ok) {
      a.lost = true; a.crewLost = rnd() >= 0.5;
      L(`Without the second tanker ${name.toLowerCase()} comes down at sea short of fuel on the way back; ${a.crewLost ? "the crew are not found" : "a U-boat picks up the crew days later"}.`);
      return a;
    }
    if (rnd() >= A.findBase2 || rnd() >= A.refuel2) {
      a.lost = true; a.crewLost = rnd() >= A.crewRescue;
      L(`On the way back ${name.toLowerCase()} runs short of fuel near Base 2 and is scuttled; ${a.crewLost ? "the crew are not found" : "the U-boat takes the crew aboard"}.`);
      return a;
    }
    L(`${name} refuels north of the Azores and flies home: about ${Math.round(dist(D.base2, D.home)).toLocaleString("en")} km more to France.`);
    return a;
  }

  function run(c, seed) {
    const R = mulberry32(seed >>> 0), rnd = () => R();
    const out = { choices: c, log: [], flown: false, reached: 0, bombs: 0, planesLost: 0, crewsLost: 0, uboatsLost: 0, tonnage: 0 };
    const L = msg => out.log.push(msg);
    const A = D.assumptions;
    if (c.naval === "object") {
      L("The Naval Staff puts the price to the Fuehrer's headquarters: two U-boat missions against shipping for one or two aircraft over New York. No U-boats are made available; the raid is not flown.");
      return out;
    }
    out.tonnage = (D.costs.tonnage[0] + D.costs.tonnage[1]) / 2;
    if (c.final !== "press") {
      L("The Air Force General Staff declines to take part, as it did on 28 July 1942, and the Naval Staff lets the matter rest. The two type IXc boats prepared for the operation go back to the war on shipping.");
      out.tonnage = 0;
      return out;
    }
    out.flown = true;
    const w = win(c.when || "sep"), b1 = base1(c.base1 || "ny1000"), n = c.planes === "2" ? 2 : 1;
    L(`The Fuehrer's headquarters overrules the Air Force General Staff. ${n === 1 ? "One BV 222" : "Two BV 222s"}, ${w.date}; ${b1.name}.`);
    const boats = [rnd() < A.uboatOnStation, rnd() < A.uboatOnStation];
    if (!boats[0]) { L("The tanker boat for Base 1 does not reach its position in time; the operation is called off before the aircraft leave France."); out.flown = false; return out; }
    if (!boats[1]) L("The boat for Base 2 is delayed and will not be on station: the aircraft will have to come home without refuelling north of the Azores.");
    let tries = 0, calm = false;
    while (tries < 3 && !calm) { calm = rnd() < w.sea; tries++; }
    if (!calm) { L(`For three days the sea at Base 1 is too rough to land beside the U-boat. The operation is put off and not resumed.`); out.flown = false; return out; }
    L(`On day ${tries} the U-boat at Base 1 reports a calm sea and the go-ahead is given.`);
    for (let i = 0; i < n; i++) {
      const a = sortie(i, c, w, b1, rnd, L, boats[1]);
      out.reached += a.reached ? 1 : 0; out.bombs += a.bombs; out.planesLost += a.lost ? 1 : 0; out.crewsLost += a.crewLost ? 1 : 0;
    }
    for (let k = 0; k < 2; k++) if (rnd() < A.uboatLostAfter) { out.uboatsLost++; }
    if (out.uboatsLost) L(`${out.uboatsLost === 1 ? "One of the tanker boats is" : "Both tanker boats are"} hunted down on the way home.`);
    L(out.reached ? `In all: ${out.bombs.toFixed(1)} tonne${out.bombs > 1 ? "s" : ""} of bombs on New York.` : "No bomb falls on New York.");
    return out;
  }

  function monteCarlo(c, n, seed0) {
    const rows = [];
    for (let i = 0; i < n; i++) rows.push(run(c, (seed0 || 1) + i));
    const q = (k, f) => { const s = rows.map(x => x[k]).sort((a, b) => a - b); return s[Math.floor(f * (s.length - 1))]; };
    const share = fn => rows.filter(fn).length / n;
    return { n, flown: share(x => x.flown), anyReached: share(x => x.reached > 0), bombs: { med: q("bombs", 0.5), p90: q("bombs", 0.9) },
      planesLost: q("planesLost", 0.5), anyCrewLost: share(x => x.crewsLost > 0), meanCrews: rows.reduce((s, x) => s + x.crewsLost, 0) / n,
      uboatLost: share(x => x.uboatsLost > 0), tonnage: q("tonnage", 0.5) };
  }

  return { setData: d => { D = d; }, run, monteCarlo, dist, win, base1, flies };
})();

if (typeof module !== "undefined") module.exports = TF;
