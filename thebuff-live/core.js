(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Core = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function regionCellsOf(n, region) {
    const cells = Array.from({ length: n }, () => []);
    for (let i = 0; i < region.length; i++) cells[region[i]].push(i);
    return cells;
  }

  function generateRegions(n, rng) {
    const total = n * n;
    const region = new Array(total).fill(-1);
    const cells = shuffle(Array.from({ length: total }, (_, i) => i), rng);
    const seeds = [];
    for (const cell of cells) {
      if (seeds.length >= n) break;
      const r = Math.floor(cell / n);
      const c = cell % n;
      let ok = true;
      for (const s of seeds) {
        const sr = Math.floor(s / n);
        const sc = s % n;
        if (Math.abs(sr - r) <= 1 && Math.abs(sc - c) <= 1) {
          ok = false;
          break;
        }
      }
      if (ok) seeds.push(cell);
    }
    for (const cell of cells) {
      if (seeds.length >= n) break;
      if (!seeds.includes(cell)) seeds.push(cell);
    }
    seeds.forEach((cell, i) => (region[cell] = i));
    const sizes = new Array(n).fill(1);
    const cap = Math.ceil((total / n) * 1.8);
    let remaining = total - n;
    while (remaining > 0) {
      const frontier = [];
      for (let cell = 0; cell < total; cell++) {
        if (region[cell] !== -1) continue;
        const r = Math.floor(cell / n);
        const c = cell % n;
        const found = new Set();
        if (r > 0) {
          const v = region[(r - 1) * n + c];
          if (v >= 0) found.add(v);
        }
        if (r < n - 1) {
          const v = region[(r + 1) * n + c];
          if (v >= 0) found.add(v);
        }
        if (c > 0) {
          const v = region[r * n + (c - 1)];
          if (v >= 0) found.add(v);
        }
        if (c < n - 1) {
          const v = region[r * n + (c + 1)];
          if (v >= 0) found.add(v);
        }
        if (found.size) frontier.push([cell, Array.from(found)]);
      }
      if (!frontier.length) break;
      const withSpace = frontier.filter((f) =>
        f[1].some((rid) => sizes[rid] < cap)
      );
      const source = withSpace.length ? withSpace : frontier;
      const pick = source[Math.floor(rng() * source.length)];
      let pool = pick[1].filter((rid) => sizes[rid] < cap);
      if (!pool.length) pool = pick[1];
      let minSize = Infinity;
      for (const rid of pool) minSize = Math.min(minSize, sizes[rid]);
      const best = pool.filter((rid) => sizes[rid] === minSize);
      const rid = best[Math.floor(rng() * best.length)];
      region[pick[0]] = rid;
      sizes[rid]++;
      remaining--;
    }
    return region;
  }

  function findOrder(n, placement, target) {
    const rowOrb = new Array(n).fill(-1);
    const colOrb = new Array(n).fill(-1);
    const spots = [];
    for (let rid = 0; rid < placement.length; rid++) {
      const cell = placement[rid];
      if (cell < 0) return null;
      const r = Math.floor(cell / n);
      const c = cell % n;
      if (rowOrb[r] !== -1 || colOrb[c] !== -1) return null;
      rowOrb[r] = rid;
      colOrb[c] = rid;
      spots.push([r, c]);
    }
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        if (
          Math.abs(spots[i][0] - spots[j][0]) <= 1 &&
          Math.abs(spots[i][1] - spots[j][1]) <= 1
        ) {
          return null;
        }
      }
    }
    const succ = Array.from({ length: n }, () => []);
    const indeg = new Array(n).fill(0);
    const addEdge = (a, b) => {
      succ[a].push(b);
      indeg[b]++;
    };
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const A = rowOrb[r];
        const B = colOrb[c];
        const t = target[r * n + c];
        if (A === B) {
          if (t !== A) return null;
          continue;
        }
        if (t === A) addEdge(B, A);
        else if (t === B) addEdge(A, B);
        else return null;
      }
    }
    const order = [];
    const deg = indeg.slice();
    const queue = [];
    for (let i = 0; i < n; i++) if (deg[i] === 0) queue.push(i);
    while (queue.length) {
      const x = queue.pop();
      order.push(x);
      for (const y of succ[x]) {
        deg[y]--;
        if (deg[y] === 0) queue.push(y);
      }
    }
    if (order.length !== n) return null;
    return order;
  }

  function computePattern(n, placement, order) {
    const pos = new Array(n).fill(-1);
    order.forEach((rid, i) => (pos[rid] = i));
    const rowOrb = new Array(n).fill(-1);
    const colOrb = new Array(n).fill(-1);
    for (let rid = 0; rid < n; rid++) {
      const cell = placement[rid];
      if (cell < 0 || cell === undefined) continue;
      const r = Math.floor(cell / n);
      const c = cell % n;
      rowOrb[r] = rid;
      colOrb[c] = rid;
    }
    const pat = new Array(n * n).fill(-1);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const A = rowOrb[r];
        const B = colOrb[c];
        let winner = -1;
        if (A < 0 && B < 0) winner = -1;
        else if (A < 0) winner = B;
        else if (B < 0) winner = A;
        else if (A === B) winner = A;
        else winner = pos[A] > pos[B] ? A : B;
        pat[r * n + c] = winner;
      }
    }
    return pat;
  }

  function placementsFor(n, regionCells, target, cap) {
    const regionOrder = regionCells
      .map((_, i) => i)
      .sort((a, b) => regionCells[a].length - regionCells[b].length);
    const rowUsed = new Array(n).fill(0);
    const colUsed = new Array(n).fill(0);
    const placedR = new Array(n).fill(0);
    const placedC = new Array(n).fill(0);
    const result = new Array(n).fill(-1);
    const out = [];
    let step = 0;
    function okCell(r, c) {
      if (rowUsed[r] || colUsed[c]) return false;
      for (let s = 0; s < step; s++) {
        if (Math.abs(placedR[s] - r) <= 1 && Math.abs(placedC[s] - c) <= 1) {
          return false;
        }
      }
      return true;
    }
    function dfs() {
      if (out.length >= cap) return;
      if (step === regionOrder.length) {
        if (!target || findOrder(n, result, target)) out.push(result.slice());
        return;
      }
      const rid = regionOrder[step];
      for (const cell of regionCells[rid]) {
        const r = Math.floor(cell / n);
        const c = cell % n;
        if (!okCell(r, c)) continue;
        result[rid] = cell;
        rowUsed[r] = 1;
        colUsed[c] = 1;
        placedR[step] = r;
        placedC[step] = c;
        step++;
        dfs();
        step--;
        rowUsed[r] = 0;
        colUsed[c] = 0;
      }
      result[rid] = -1;
    }
    dfs();
    return out;
  }

  function generateLevel(n, seed, opts) {
    opts = opts || {};
    const maxAttempts = opts.maxAttempts || 50;
    const rng = makeRng(seed);
    let best = null;
    let bestCount = Infinity;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const region = generateRegions(n, rng);
      const regionCells = regionCellsOf(n, region);
      const all = placementsFor(n, regionCells, null, 600);
      if (!all.length) continue;
      const placement = all[Math.floor(rng() * all.length)];
      const order = shuffle(
        Array.from({ length: n }, (_, i) => i),
        rng
      );
      const target = computePattern(n, placement, order);
      const sols = placementsFor(n, regionCells, target, 2);
      if (sols.length === 1) {
        return {
          n,
          region: region.slice(),
          target: target.slice(),
          solution: sols[0],
          slot: muralFor(seed),
          unique: true,
        };
      }
      if (sols.length > 0 && sols.length < bestCount) {
        best = {
          n,
          region: region.slice(),
          target: target.slice(),
          solution: placement,
          slot: muralFor(seed),
          unique: false,
        };
        bestCount = sols.length;
      }
    }
    if (best) return best;
    throw new Error("level generation failed for n=" + n);
  }

  function getHint(n, regionCells, target, playerPlacement) {
    const sols = placementsFor(n, regionCells, target, 300);
    if (!sols.length) return null;
    const placedRids = [];
    for (let rid = 0; rid < n; rid++) {
      if (playerPlacement[rid] >= 0) placedRids.push(rid);
    }
    const compatible = sols.filter((s) =>
      placedRids.every((rid) => s[rid] === playerPlacement[rid])
    );
    if (compatible.length) {
      const sol = compatible[0];
      const missing = [];
      for (let rid = 0; rid < n; rid++) {
        if (playerPlacement[rid] < 0) missing.push(rid);
      }
      if (missing.length) {
        return { type: "place", rid: missing[0], cell: sol[missing[0]] };
      }
      const order = findOrder(n, sol, target);
      return { type: "order", order, cells: order.map((rid) => sol[rid]) };
    }
    for (const rid of placedRids) {
      if (!sols.some((s) => s[rid] === playerPlacement[rid])) {
        return { type: "remove", rid, cell: playerPlacement[rid] };
      }
    }
    for (const rid of placedRids) {
      const others = placedRids.filter((x) => x !== rid);
      if (
        sols.some((s) => others.every((x) => s[x] === playerPlacement[x]))
      ) {
        return { type: "remove", rid, cell: playerPlacement[rid] };
      }
    }
    return null;
  }

  function dayString(d) {
    const date = d || new Date();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + m + "-" + day;
  }

  function dayIndex(str) {
    const p = str.split("-");
    return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  }

  function computeStreak(lastSolved, streak, today) {
    if (!lastSolved) return 1;
    if (lastSolved === today) return streak || 1;
    const gap = dayIndex(today) - dayIndex(lastSolved);
    if (gap === 1) return (streak || 0) + 1;
    return 1;
  }

  function dailySeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function difficultyFor(level) {
    if (level <= 2) return 4;
    if (level <= 6) return 5;
    if (level <= 12) return 6;
    return 7;
  }

  const HINT_COST = 3;

  function parFor(n) {
    return n;
  }

  const MURAL_COUNT = 45;

  function muralFor(seed) {
    return ((seed >>> 0) % MURAL_COUNT) | 0;
  }

  function moveBudget(n) {
    return parFor(n) * 3;
  }

  function timeBudget(n) {
    if (n <= 4) return 60;
    if (n === 5) return 90;
    if (n === 6) return 120;
    return 150;
  }

  function scoreLevel(moves, hints, par) {
    if (!par || par < 1) par = 1;
    if (hints === 0 && moves <= par) return 3;
    if (hints <= 1 && moves <= par * 2) return 2;
    return 1;
  }

  function formatTime(ms) {
    if (!isFinite(ms) || ms < 0) ms = 0;
    const total = Math.floor(ms / 1000);
    const s = total % 60;
    const m = Math.floor(total / 60) % 60;
    const h = Math.floor(total / 3600);
    const pad = (v) => String(v).padStart(2, "0");
    return h > 0 ? h + ":" + pad(m) + ":" + pad(s) : m + ":" + pad(s);
  }

  function rotateCell(i, n, turns) {
    turns = ((turns % 4) + 4) % 4;
    let r = Math.floor(i / n);
    let c = i % n;
    while (turns-- > 0) {
      const nr = c;
      const nc = n - 1 - r;
      r = nr;
      c = nc;
    }
    return r * n + c;
  }

  function rotateGrid(arr, n, turns) {
    const out = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      out[rotateCell(i, n, turns)] = arr[i];
    }
    return out;
  }

  function screenToGrid(dx, dy, turns) {
    const t = ((turns % 4) + 4) % 4;
    let dr = dy;
    let dc = dx;
    if (t === 1) {
      dr = -dx;
      dc = dy;
    } else if (t === 2) {
      dr = -dy;
      dc = -dx;
    } else if (t === 3) {
      dr = dx;
      dc = -dy;
    }
    return [dr + 0, dc + 0];
  }

  const PALETTE = [
    "#ff5f46",
    "#4285f4",
    "#ffa61f",
    "#22c55e",
    "#a855f7",
    "#12c4b8",
    "#ff5b9d",
    "#b8823c",
  ];

  const COLOR_NAMES = [
    "red",
    "blue",
    "amber",
    "green",
    "purple",
    "teal",
    "pink",
    "brown",
  ];

  function colorName(rid) {
    if (typeof rid !== "number" || rid < 0 || rid >= COLOR_NAMES.length) {
      return "unpainted";
    }
    return COLOR_NAMES[rid];
  }

  const PATTERNS = [
    "solid",
    "diagonal",
    "vertical",
    "horizontal",
    "dots",
    "checker",
    "crosshatch",
    "rings",
  ];

  const PATTERN_GLYPHS = ["■", "╱", "║", "═", "·", "▦", "╳", "◎"];

  function patternFor(rid) {
    if (typeof rid !== "number" || rid < 0 || rid >= PATTERNS.length) return 0;
    return rid;
  }

  function patternName(rid) {
    if (typeof rid !== "number" || rid < 0 || rid >= PATTERNS.length) {
      return "blank";
    }
    return PATTERNS[rid];
  }

  function glyphFor(rid) {
    if (typeof rid !== "number" || rid < 0 || rid >= PATTERN_GLYPHS.length) {
      return "□";
    }
    return PATTERN_GLYPHS[rid];
  }

  const SHARE_SWATCHES = [
    ["#e05a45", "🟥"],
    ["#f0a41e", "🟧"],
    ["#f2c200", "🟨"],
    ["#2fa06a", "🟩"],
    ["#3b6fd4", "🟦"],
    ["#8b5cd6", "🟪"],
    ["#8a6a3f", "🟫"],
    ["#ffffff", "⬜"],
  ];

  function tileFor(rid, colors) {
    if (rid === null || rid === undefined || rid < 0) return "⬜";
    const hex = (colors || PALETTE)[rid];
    if (!hex) return "⬜";
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    let best = SHARE_SWATCHES[0];
    let bestD = Infinity;
    for (const sw of SHARE_SWATCHES) {
      const sr = parseInt(sw[0].slice(1, 3), 16);
      const sg = parseInt(sw[0].slice(3, 5), 16);
      const sb = parseInt(sw[0].slice(5, 7), 16);
      const d = (r - sr) * (r - sr) + (g - sg) * (g - sg) + (b - sb) * (b - sb);
      if (d < bestD) {
        bestD = d;
        best = sw;
      }
    }
    return best[1];
  }

  function shareText(opts) {
    opts = opts || {};
    const stars = Math.max(0, Math.min(3, opts.stars | 0));
    const lines = [];
    lines.push(opts.title || "The Buff");
    let head = "★".repeat(stars) + "☆".repeat(3 - stars);
    if (opts.moves != null && opts.par != null) head += " " + opts.moves + "/" + opts.par;
    if (opts.timeMs != null) head += " · " + formatTime(opts.timeMs);
    if (opts.hints) head += " · " + opts.hints + (opts.hints === 1 ? " hint" : " hints");
    lines.push(head);
    const t = opts.target;
    if (Array.isArray(t) && t.length > 0) {
      const side = Math.sqrt(t.length);
      const n = Math.round(side);
      if (n * n === t.length) {
        for (let r = 0; r < n; r++) {
          let row = "";
          for (let c = 0; c < n; c++) {
            const rid = t[r * n + c];
            row += tileFor(rid, opts.colors);
            if (opts.shapes) row += glyphFor(rid);
          }
          lines.push(row);
        }
      }
    }
    if (opts.url) lines.push(opts.url);
    return lines.join("\n");
  }

  return {
    makeRng,
    shuffle,
    regionCellsOf,
    generateRegions,
    findOrder,
    computePattern,
    placementsFor,
    generateLevel,
    getHint,
    difficultyFor,
    HINT_COST,
    parFor,
    moveBudget,
    MURAL_COUNT,
    muralFor,
    timeBudget,
    scoreLevel,
    formatTime,
    rotateCell,
    rotateGrid,
    screenToGrid,
    PALETTE,
    COLOR_NAMES,
    colorName,
    PATTERNS,
    PATTERN_GLYPHS,
    patternFor,
    patternName,
    glyphFor,
    tileFor,
    shareText,
    dayString,
    dayIndex,
    computeStreak,
    dailySeed,
  };
});
