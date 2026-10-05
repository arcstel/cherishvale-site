(function () {
  "use strict";

  const PALETTE = Core.PALETTE;
  const SAVE_KEY = "overpaint.v1";

  const $ = (id) => document.getElementById(id);
  const els = {
    board: $("board"),
    borders: $("borders"),
    minimap: $("minimap"),
    status: $("status"),
    levelBadge: $("levelBadge"),
    undoBtn: $("undoBtn"),
    hintBtn: $("hintBtn"),
    diffBtn: $("diffBtn"),
    patBtn: $("patBtn"),
    rotBtn: $("rotBtn"),
    statMoves: $("statMoves"),
    statPar: $("statPar"),
    statTime: $("statTime"),
    winStats: $("winStats"),
    shareBtn: $("shareBtn"),
    shareOut: $("shareOut"),
    restartBtn: $("restartBtn"),
    dailyBest: $("dailyBest"),
    soundBtn: $("soundBtn"),
    rulesBtn: $("rulesBtn"),
    winOverlay: $("winOverlay"),
    winTitle: $("winTitle"),
    failOverlay: $("failOverlay"),
    failTitle: $("failTitle"),
    failMark: $("failMark"),
    failLives: $("failLives"),
    retryBtn: $("retryBtn"),
    failMapBtn: $("failMapBtn"),
    statLives: $("statLives"),
    stars: $("stars"),
    nextBtn: $("nextBtn"),
    toast: $("toast"),
    alarm: $("alarm"),
    officer: $("officer"),
    rulesModal: $("rulesModal"),
    rulesClose: $("rulesClose"),
    mapBtn: $("mapBtn"),
    mapOverlay: $("mapOverlay"),
    mapClose: $("mapClose"),
    mapStars: $("mapStars"),
    mapStreak: $("mapStreak"),
    dailyBtn: $("dailyBtn"),
    dailyState: $("dailyState"),
    levelGrid: $("levelGrid"),
    stage: $("stage"),
    boardWrap: $("boardWrap"),
    tutBubble: $("tutBubble"),
    tutText: $("tutText"),
    tutNext: $("tutNext"),
    tutSkip: $("tutSkip"),
    tutPointer: $("tutPointer"),
  };

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(defaults(), JSON.parse(raw));
    } catch (e) {}
    return defaults();
  }
  function defaults() {
    return {
      level: 1,
      maxLevel: 1,
      sound: true,
      diff: true,
      pat: false,
      rulesSeen: false,
      stars: {},
      stimes: {},
      streak: 0,
      dailyLast: "",
      tutSeen: false,
      rot: 0,
    };
  }
  function persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (e) {}
  }

  const save = loadSave();

  let n = 0;
  let level = null;
  let regionOf = null;
  let placement = null;
  let order = [];
  let history = [];
  let hintsUsed = 0;
  let moves = 0;
  let par = 4;
  let pattern = null;
  let won = false;
  let currentMeta = null;
  let tut = null;
  let cellEls = [];
  let animTimer = null;
  let focusIdx = 0;
  let lastFocus = null;
  let budgetMs = 60000;
  let lives = 3;
  let failed = false;
  let moveCap = 12;
  let failReason = "time";

  let tAcc = 0;
  let tRun = false;
  let tMark = 0;
  let tPaint = null;

  function elapsedMs() {
    return tAcc + (tRun ? performance.now() - tMark : 0);
  }
  function timerSet(run) {
    run = !!run;
    if (run === tRun) return;
    if (run) tMark = performance.now();
    else tAcc += performance.now() - tMark;
    tRun = run;
    paintTimer();
    clearInterval(tPaint);
    if (run) tPaint = setInterval(paintTimer, 250);
  }
  function timerReset() {
    clearInterval(tPaint);
    tPaint = null;
    tAcc = 0;
    tRun = false;
    paintTimer();
  }
  function timeLeft() {
    return budgetMs - elapsedMs();
  }

  const ALARM_AT = 20000;
  let alarmState = "off";
  let officerState = "off";

  function setAlarm(state) {
    if (alarmState === state) return;
    alarmState = state;
    els.alarm.classList.toggle("hidden", state === "off");
    els.alarm.classList.toggle("strolling", state === "strolling");
    els.alarm.classList.toggle("angry", state === "angry");
    if (state === "strolling") {
      sound("tick");
      buzz(15);
    }
  }

  function setOfficer(state) {
    if (officerState === state) return;
    officerState = state;
    els.officer.classList.toggle("hidden", state === "off");
    els.officer.classList.toggle("sleeping", state === "sleeping");
    els.officer.classList.toggle("awake", state === "awake");
  }

  function updateOfficer() {
    if (!level || won) setOfficer("off");
    else setOfficer(failed ? "awake" : "sleeping");
  }

  function updateAlarm() {
    if (won || !level || tut) setAlarm("off");
    else if (failed) setAlarm(failReason === "time" ? "angry" : "off");
    else {
      const left = timeLeft();
      if (left <= 0) setAlarm("angry");
      else if (left <= ALARM_AT) setAlarm("strolling");
      else setAlarm("off");
    }
    updateOfficer();
  }

  function paintTimer() {
    updateAlarm();
    if (tut) {
      els.statTime.textContent = "∞";
      els.statTime.classList.remove("low");
      return;
    }
    const left = timeLeft();
    els.statTime.textContent = Core.formatTime(Math.max(0, left));
    els.statTime.classList.toggle("low", left <= 10000);
    if (left <= 0 && tRun && !won && !failed) failLevel();
  }
  function overlayOpen() {
    return (
      !els.mapOverlay.classList.contains("hidden") ||
      !els.rulesModal.classList.contains("hidden") ||
      !els.winOverlay.classList.contains("hidden") ||
      !els.failOverlay.classList.contains("hidden")
    );
  }
  function pauseForOverlay() {
    if (!won) timerSet(false);
  }
  function resumeAfterOverlay() {
    if (!won && !failed && !tut && !overlayOpen()) timerSet(true);
  }

  function activeDialog() {
    if (!els.winOverlay.classList.contains("hidden")) return els.winOverlay;
    if (!els.failOverlay.classList.contains("hidden")) return els.failOverlay;
    if (!els.rulesModal.classList.contains("hidden")) return els.rulesModal;
    if (!els.mapOverlay.classList.contains("hidden")) return els.mapOverlay;
    return null;
  }

  function focusablesIn(root) {
    const found = root.querySelectorAll(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    return Array.prototype.filter.call(
      found,
      (el) => !el.disabled && !el.closest(".hidden") && el.offsetParent !== null
    );
  }

  function trapTab(e, root) {
    const items = focusablesIn(root);
    if (!items.length) return;
    const active = document.activeElement;
    const idx = items.indexOf(active);
    if (e.shiftKey) {
      if (idx <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      }
    } else if (idx === -1 || idx === items.length - 1) {
      e.preventDefault();
      items[0].focus();
    }
  }

  function rememberFocus() {
    lastFocus = document.activeElement;
  }

  function focusOverlay(root) {
    const card = root.querySelector(".card");
    if (card) card.focus();
  }

  function restoreFocus(fallback) {
    const el = lastFocus;
    lastFocus = null;
    if (el && el !== document.body && el.isConnected && typeof el.focus === "function" && !el.closest(".hidden")) {
      el.focus();
    } else if (fallback) {
      fallback.focus();
    }
  }

  function livesText(count) {
    return "♥".repeat(count) + "♡".repeat(Math.max(0, 3 - count));
  }

  function updateLives() {
    els.statLives.textContent = livesText(lives);
    els.statLives.setAttribute("aria-label", lives + " of 3 lives left");
    els.statLives.classList.toggle("out", lives <= 0);
  }

  function spendLife() {
    lives = Math.max(0, lives - 1);
    updateLives();
    return lives;
  }

  function showFailOverlay() {
    failed = true;
    timerSet(false);
    updateAlarm();
    const out = lives <= 0;
    const spent = failReason === "moves";
    els.failTitle.textContent = out
      ? "No lives left!"
      : spent
        ? "Out of moves!"
        : "Time's up!";
    els.failMark.textContent = spent ? "\u{1F6AB}" : "\u23F0";
    els.failMark.setAttribute("aria-label", spent ? "Out of moves" : "Time ran out");
    els.failLives.textContent = livesText(lives);
    els.failLives.classList.toggle("none", out);
    els.retryBtn.disabled = out;
    els.retryBtn.textContent = out ? "↻ No lives left" : "↻ Retry — use 1 life";
    els.failOverlay.classList.remove("hidden");
    rememberFocus();
    focusOverlay(els.failOverlay);
    updateButtons();
  }

  function failLevel(reason) {
    if (failed || won || tut) return;
    failReason = reason === "moves" ? "moves" : "time";
    spendLife();
    showFailOverlay();
    sound("alarm");
    buzz([50, 70, 50, 70, 90]);
  }

  function retryLevel() {
    els.failOverlay.classList.add("hidden");
    lastFocus = null;
    if (lives <= 0) {
      openMap();
      return;
    }
    initLevel(level, currentMeta, true);
    focusBoard();
  }

  function updateStats() {
    const left = Math.max(0, moveCap - moves);
    els.statMoves.textContent = moves + "/" + moveCap;
    els.statMoves.setAttribute(
      "aria-label",
      moves + " of " + moveCap + " moves used"
    );
    els.statMoves.classList.toggle("over", moves > par);
    els.statMoves.classList.toggle("low", left <= 3 && left > 0 && !won && !tut);
    els.statPar.textContent = "par " + par;
    checkMoveBudget();
  }

  function checkMoveBudget() {
    if (won || failed || tut || !moveCap) return;
    if (moves >= moveCap) failLevel("moves");
  }

  function mixWhite(hex, w) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const m = (v) => Math.round(v + (255 - v) * w);
    return "rgb(" + m(r) + "," + m(g) + "," + m(b) + ")";
  }
  function mixBlack(hex, w) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const m = (v) => Math.round(v * (1 - w));
    return "rgb(" + m(r) + "," + m(g) + "," + m(b) + ")";
  }
  const paintColor = (rid) => mixWhite(PALETTE[rid], 0.08);
  const regionColor = (rid) => mixBlack(PALETTE[rid], 0.7);
  const orbColor = (rid) => PALETTE[rid];

  function placedCount() {
    let c = 0;
    for (let i = 0; i < n; i++) if (placement[i] >= 0) c++;
    return c;
  }
  function patternMatches() {
    for (let i = 0; i < n * n; i++) if (pattern[i] !== level.target[i]) return false;
    return true;
  }

  function setRoving() {
    for (let k = 0; k < cellEls.length; k++) {
      cellEls[k].tabIndex = k === focusIdx ? 0 : -1;
    }
  }

  function setFocusIdx(i) {
    if (!cellEls.length) return;
    focusIdx = Math.max(0, Math.min(cellEls.length - 1, i | 0));
    setRoving();
  }

  function focusCell(i) {
    setFocusIdx(i);
    const el = cellEls[focusIdx];
    if (el) el.focus();
  }

  function focusBoard() {
    if (cellEls.length) focusCell(focusIdx);
  }

  function moveFocus(dx, dy) {
    const delta = Core.screenToGrid(dx, dy, save.rot || 0);
    const r = Math.max(0, Math.min(n - 1, Math.floor(focusIdx / n) + delta[0]));
    const c = Math.max(0, Math.min(n - 1, (focusIdx % n) + delta[1]));
    focusCell(r * n + c);
  }

  function cellLabel(i) {
    const r = Math.floor(i / n) + 1;
    const c = (i % n) + 1;
    let s = "row " + r + ", column " + c + ", " + Core.colorName(regionOf[i]) + " region";
    const painted = pattern ? pattern[i] : -1;
    s += painted >= 0 ? ", painted " + Core.colorName(painted) : ", unpainted";
    if (placement) {
      for (let rid = 0; rid < n; rid++) {
        if (placement[rid] === i) {
          s += ", spray can here";
          break;
        }
      }
    }
    return s;
  }

  function updateCellLabels() {
    for (let i = 0; i < cellEls.length; i++) {
      cellEls[i].setAttribute("aria-label", cellLabel(i));
    }
  }

  function applyCellPattern(i) {
    const el = cellEls[i];
    if (!el) return;
    if (!save.pat) {
      el.removeAttribute("data-pat");
      return;
    }
    const rid = pattern && pattern[i] >= 0 ? pattern[i] : regionOf[i];
    el.setAttribute("data-pat", rid);
  }

  function applyPatterns() {
    for (let i = 0; i < cellEls.length; i++) applyCellPattern(i);
    const tiles = els.minimap.children;
    for (let i = 0; level && i < tiles.length; i++) {
      if (save.pat) tiles[i].setAttribute("data-pat", level.target[i]);
      else tiles[i].removeAttribute("data-pat");
    }
  }

  function makeLevel(size, seed) {
    try {
      return Core.generateLevel(size, seed);
    } catch (e) {
      return Core.generateLevel(size, seed + 889);
    }
  }

  function applyRotation(deg, spin) {
    document.documentElement.style.setProperty("--rot", deg + "deg");
    if (spin) {
      els.boardWrap.classList.remove("spinning");
      void els.boardWrap.offsetWidth;
      els.boardWrap.classList.add("spinning");
      setTimeout(() => els.boardWrap.classList.remove("spinning"), 640);
    }
  }

  function rotateBoard() {
    if (won || tut) return;
    save.rot = ((save.rot || 0) + 1) % 4;
    persist();
    applyRotation(save.rot * 90, true);
    sound("cycle", 2);
    buzz(10);
    updateButtons();
  }

  let lastResult = null;

  function restartLevel() {
    if (won || tut || failed || !currentMeta || !level) return;
    spendLife();
    if (lives <= 0) {
      showFailOverlay();
      sound("wrong");
      buzz([50, 70, 50, 70, 90]);
      return;
    }
    initLevel(level, currentMeta, true);
    focusBoard();
    sound("remove");
    buzz(10);
    toast("Restarted · " + lives + (lives === 1 ? " life left" : " lives left"));
  }

  function shareTitle() {
    if (currentMeta && currentMeta.daily) return "The Buff Daily " + currentMeta.date;
    return "The Buff Level " + (currentMeta ? currentMeta.num : "");
  }

  function buildShareText() {
    if (!lastResult) return "";
    return Core.shareText({
      title: shareTitle(),
      stars: lastResult.stars,
      moves: lastResult.moves,
      par: lastResult.par,
      timeMs: lastResult.timeMs,
      hints: lastResult.hints,
      target: lastResult.target,
      shapes: !!save.pat,
      url: location.href.split("#")[0],
    });
  }

  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => {
            toast("Result copied ✓");
            sound("tick");
          },
          () => fallbackCopy(text)
        );
        return;
      }
    } catch (e) {}
    fallbackCopy(text);
  }

  function fallbackCopy(text) {
    let ok = false;
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand("copy");
      ta.remove();
    } catch (e) {
      ok = false;
    }
    if (ok) {
      toast("Result copied ✓");
      sound("tick");
    } else {
      els.shareOut.classList.remove("hidden");
      els.shareOut.value = text;
      els.shareOut.focus();
      els.shareOut.select();
      toast("Press and hold to copy");
    }
  }

  function shareResult() {
    const text = buildShareText();
    if (!text) return;
    els.shareOut.textContent = text;
    els.shareOut.value = text;
    els.shareOut.classList.add("hidden");
    copyText(text);
  }

  function initLevel(lvl, meta, keepLives) {
    tutCleanup();
    currentMeta = meta;
    level = lvl;
    n = lvl.n;
    regionOf = lvl.region;
    placement = new Array(n).fill(-1);
    order = [];
    history = [];
    hintsUsed = 0;
    moves = 0;
    par = Core.parFor(n);
    moveCap = Core.moveBudget(n);
    budgetMs = window.__QA_NO_TIMEOUT ? Infinity : Core.timeBudget(n) * 1000;
    if (!keepLives) lives = 3;
    failed = false;
    won = false;
    applyRotation(((save.rot || 0) % 4) * 90, false);
    timerReset();
    els.levelBadge.textContent = meta.daily ? "Daily" : "Level " + meta.num;
    els.winOverlay.classList.add("hidden");
    els.failOverlay.classList.add("hidden");
    els.winStats.textContent = "";
    lastResult = null;
    els.shareOut.classList.add("hidden");
    els.shareOut.value = "";
    renderBoard();
    renderMinimap();
    updateStatus();
    updateStats();
    updateLives();
    if (!meta.daily && meta.num === 1 && !save.tutSeen) startTutorial();
    if (!tut) timerSet(true);
    paintTimer();
    updateButtons();
  }

  function startCampaign(num) {
    num = Math.max(1, num);
    initLevel(makeLevel(Core.difficultyFor(num), num * 7919 + 101), {
      num,
      daily: false,
    });
    if (save.level !== num) {
      save.level = num;
      persist();
    }
  }

  function startDaily() {
    const today = Core.dayString();
    initLevel(makeLevel(5, Core.dailySeed(today)), {
      num: null,
      daily: true,
      date: today,
    });
  }

  function openMap() {
    pauseForOverlay();
    renderMap();
    rememberFocus();
    els.mapOverlay.classList.remove("hidden");
    focusOverlay(els.mapOverlay);
  }

  function closeMap() {
    els.mapOverlay.classList.add("hidden");
    if (failed) {
      showFailOverlay();
      return;
    }
    resumeAfterOverlay();
    restoreFocus(els.mapBtn);
  }

  function closeRules() {
    els.rulesModal.classList.add("hidden");
    save.rulesSeen = true;
    persist();
    resumeAfterOverlay();
    restoreFocus(els.rulesBtn);
  }

  function renderMap() {
    const totalStars = Object.values(save.stars).reduce((a, b) => a + b, 0);
    els.mapStars.textContent = "⭐ " + totalStars;
    els.mapStreak.textContent = "🔥 " + (save.streak || 0);
    const today = Core.dayString();
    const solvedToday = save.dailyLast === today;
    els.dailyState.textContent = solvedToday ? "Solved today ✓" : "New puzzle today";
    if (els.dailyBest) {
      const db = save.stimes ? save.stimes.daily : null;
      els.dailyBest.textContent = solvedToday && db != null ? "best " + Core.formatTime(db) : "";
    }
    const cap = Math.max(save.maxLevel || 1, save.level || 1, 4) + 3;
    els.levelGrid.innerHTML = "";
    for (let num = 1; num <= cap; num++) {
      const b = document.createElement("button");
      const unlocked = num <= (save.maxLevel || 1);
      const st = save.stars[num] || 0;
      const best = save.stimes ? save.stimes[num] : null;
      b.className =
        "lvl-node" +
        (unlocked ? "" : " locked") +
        (num === save.level ? " current" : "");
      b.dataset.num = num;
      if (unlocked) {
        b.innerHTML =
          "<span>" +
          num +
          "</span><i>" +
          "★★★".slice(0, st) +
          "☆☆☆".slice(0, 3 - st) +
          "</i>" +
          (best != null ? "<u>" + Core.formatTime(best) + "</u>" : "<u></u>");
        b.addEventListener("click", () => {
          els.mapOverlay.classList.add("hidden");
          lastFocus = null;
          startCampaign(num);
          focusBoard();
        });
      } else {
        b.innerHTML = "<span>" + num + "</span><i>🔒</i>";
      }
      els.levelGrid.appendChild(b);
    }
  }

  function renderBoard() {
    els.board.style.setProperty("--n", n);
    els.board.style.setProperty(
      "--mural",
      'url("mural-' + ((level && level.mural) || 0) + '.png")'
    );
    els.board.innerHTML = "";
    cellEls = [];
    for (let r = 0; r < n; r++) {
      const row = document.createElement("div");
      row.className = "row";
      row.setAttribute("role", "row");
      for (let c = 0; c < n; c++) {
        const i = r * n + c;
        const d = document.createElement("div");
        d.className = "cell";
        d.dataset.i = i;
        d.setAttribute("role", "gridcell");
        d.tabIndex = -1;
        d.style.setProperty("--mx", n === 1 ? "0%" : (c * 100) / (n - 1) + "%");
        d.style.setProperty("--my", n === 1 ? "0%" : (r * 100) / (n - 1) + "%");
        row.appendChild(d);
        cellEls.push(d);
      }
      els.board.appendChild(row);
    }
    focusIdx = 0;
    setRoving();
    buildBorders();
    renderPattern(null, false, null);
  }

  function buildBorders() {
    let d = "";
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n);
      const c = i % n;
      const rid = regionOf[i];
      if (r === 0 || regionOf[i - n] !== rid) d += "M " + c + " " + r + " H " + (c + 1) + " ";
      if (r === n - 1 || regionOf[i + n] !== rid) d += "M " + c + " " + (r + 1) + " H " + (c + 1) + " ";
      if (c === 0 || regionOf[i - 1] !== rid) d += "M " + c + " " + r + " V " + (r + 1) + " ";
      if (c === n - 1 || regionOf[i + 1] !== rid) d += "M " + (c + 1) + " " + r + " V " + (r + 1) + " ";
    }
    els.borders.setAttribute("viewBox", "0 0 " + n + " " + n);
    els.borders.innerHTML =
      '<path d="' + d + '" fill="none" stroke="rgba(255,255,255,.26)" stroke-width=".055" stroke-linecap="square"/>';
  }

  function sizeMinimap() {
    const avail = Math.min(window.innerWidth * 0.94, 560) - 44;
    const tile = Math.max(12, Math.min(30, Math.floor((avail - (n - 1) * 3) / n)));
    els.minimap.style.setProperty("--tile", tile + "px");
  }

  function renderMinimap() {
    els.minimap.style.gridTemplateColumns = "repeat(" + n + ", 1fr)";
    sizeMinimap();
    els.minimap.innerHTML = level.target
      .map((rid) => '<i style="background:' + paintColor(rid) + '"></i>')
      .join("");
    applyPatterns();
    const rows = [];
    for (let r = 0; r < n; r++) {
      const row = [];
      for (let c = 0; c < n; c++) row.push(Core.colorName(level.target[r * n + c]));
      rows.push("Row " + (r + 1) + ": " + row.join(", "));
    }
    els.minimap.setAttribute("aria-label", "Target pattern. " + rows.join(". "));
  }

  function renderPattern(fromCell, animate, popRid) {
    pattern = Core.computePattern(n, placement, order);
    const fr = fromCell === null ? -1 : Math.floor(fromCell / n);
    const fc = fromCell === null ? -1 : fromCell % n;
    for (let i = 0; i < n * n; i++) {
      const el = cellEls[i];
      let delay = "";
      if (animate && fromCell !== null) {
        const r = Math.floor(i / n);
        const c = i % n;
        if (r === fr || c === fc) delay = (Math.abs(r - fr) + Math.abs(c - fc)) * 35 + "ms";
      }
      el.style.transitionDelay = delay;
      const rid = pattern[i];
      el.style.backgroundColor = rid >= 0 ? paintColor(rid) : regionColor(regionOf[i]);
      applyCellPattern(i);
    }
    renderOrbs(popRid);
    renderDots();
    updateCellLabels();
    if (animate && fromCell !== null) {
      const fresh = [];
      for (let i = 0; i < n * n; i++) {
        const r = Math.floor(i / n);
        const c = i % n;
        if (r === fr || c === fc) fresh.push(i);
      }
      for (const i of fresh) {
        const el = cellEls[i];
        const dist = Math.abs(Math.floor(i / n) - fr) + Math.abs((i % n) - fc);
        el.classList.remove("splash");
        void el.offsetWidth;
        el.style.animationDelay = dist * 35 + "ms";
        el.classList.add("splash");
      }
      clearTimeout(animTimer);
      animTimer = setTimeout(() => {
        for (const el of cellEls) {
          el.style.transitionDelay = "";
          el.style.animationDelay = "";
          el.classList.remove("splash");
        }
      }, 750);
    }
    checkWin();
    applyMural();
  }

  function applyMural() {
    if (!level || !cellEls.length) return;
    for (let i = 0; i < n * n; i++) {
      const el = cellEls[i];
      if (!el) continue;
      el.classList.toggle(
        "reveal",
        !!pattern && pattern[i] === level.target[i]
      );
    }
  }

  function renderOrbs(popRid) {
    const old = els.board.querySelectorAll(".orb");
    for (const o of old) o.remove();
    for (let rid = 0; rid < n; rid++) {
      const cell = placement[rid];
      if (cell < 0) continue;
      const orb = document.createElement("div");
      orb.className = "orb";
      orb.style.backgroundColor = orbColor(rid);
      if (popRid === rid) {
        orb.classList.add("pop");
        setTimeout(() => orb.classList.remove("pop"), 420);
      }
      cellEls[cell].appendChild(orb);
    }
  }

  function renderDots() {
    const show = save.diff && !won && placedCount() === n && pattern && !patternMatches();
    for (let i = 0; i < n * n; i++) {
      const el = cellEls[i];
      const existing = el.querySelector(".dot");
      const need = show && pattern[i] !== level.target[i];
      if (need && !existing) {
        const d = document.createElement("i");
        d.className = "dot";
        el.appendChild(d);
      } else if (!need && existing) {
        existing.remove();
      }
    }
  }

  function pushHistory() {
    history.push({ placement: placement.slice(), order: order.slice() });
    if (history.length > 80) history.shift();
    updateButtons();
  }

  function canPlaceAt(i) {
    const r = Math.floor(i / n);
    const c = i % n;
    for (let rid = 0; rid < n; rid++) {
      const p = placement[rid];
      if (p < 0) continue;
      const pr = Math.floor(p / n);
      const pc = p % n;
      if (Math.abs(pr - r) <= 1 && Math.abs(pc - c) <= 1) {
        if (pr === r) return { ok: false, msg: "That row already has a can" };
        if (pc === c) return { ok: false, msg: "That column already has a can" };
        return { ok: false, msg: "Cans can't touch, even diagonally" };
      }
    }
    return { ok: true };
  }

  function onCellTap(i) {
    if (failed) return;
    setFocusIdx(i);
    if (won) return;
    if (tut) {
      tutTap(i);
      return;
    }
    const rid = regionOf[i];
    const existing = placement[rid];
    if (existing === i) {
      cyclePot(rid);
      return;
    }
    if (existing >= 0) {
      pulseCell(existing);
      toast("That region already has a can");
      sound("wrong");
      return;
    }
    const res = canPlaceAt(i);
    if (!res.ok) {
      shakeCell(i);
      toast(res.msg);
      sound("wrong");
      return;
    }
    pushHistory();
    placePot(i, rid);
  }

  function placePot(i, rid) {
    placement[rid] = i;
    order.push(rid);
    moves++;
    sound("place", rid);
    buzz(8);
    renderPattern(i, true, rid);
    updateStatus();
    updateStats();
    updateButtons();
  }

  function cyclePot(rid) {
    pushHistory();
    order = order.filter((x) => x !== rid);
    order.push(rid);
    moves++;
    sound("cycle", rid);
    buzz(8);
    renderPattern(placement[rid], true, rid);
    updateStatus();
    updateStats();
    updateButtons();
  }

  function removePot(rid) {
    if (won || placement[rid] < 0) return;
    const cell = placement[rid];
    pushHistory();
    removePotAt(rid, cell);
  }

  function removePotAt(rid, cell) {
    placement[rid] = -1;
    order = order.filter((x) => x !== rid);
    moves++;
    sound("remove");
    buzz(12);
    renderPattern(cell, true, null);
    updateStatus();
    updateStats();
    updateButtons();
  }

  function tutSet(step, text, cell) {
    tut.step = step;
    els.tutBubble.dataset.step = step;
    els.tutText.textContent = text;
    els.tutBubble.classList.remove("hidden");
    els.tutNext.classList.toggle("hidden", step !== "intro");
    if (cell !== null && cell !== undefined) {
      const el = cellEls[cell];
      els.tutPointer.classList.remove("hidden");
      els.tutPointer.style.left = el.offsetLeft + el.offsetWidth / 2 + "px";
      els.tutPointer.style.top = el.offsetTop + el.offsetHeight / 2 + "px";
    } else {
      els.tutPointer.classList.add("hidden");
    }
  }

  function infoStep(step, text, cell, ms, nextFn) {
    tutSet(step, text, cell);
    tut.infoNext = nextFn;
    tut.infoTimer = setTimeout(() => {
      if (!tut) return;
      tut.infoTimer = null;
      tut.infoNext = null;
      nextFn();
    }, ms);
  }

  function advanceInfo() {
    if (!tut || !tut.infoNext) return;
    clearTimeout(tut.infoTimer);
    const fn = tut.infoNext;
    tut.infoTimer = null;
    tut.infoNext = null;
    fn();
  }

  function tutCleanup() {
    if (tut && tut.infoTimer) clearTimeout(tut.infoTimer);
    tut = null;
    els.tutBubble.classList.add("hidden");
    els.tutPointer.classList.add("hidden");
  }

  function startTutorial() {
    const good = Core.findOrder(n, level.solution, level.target);
    tut = {
      good,
      placeSeq: good.slice().reverse(),
      seqPos: 0,
      k: 0,
      expectCell: -1,
      infoTimer: null,
      infoNext: null,
    };
    tutSet(
      "intro",
      "Welcome to The Buff! Let's learn how to play in 30 seconds.",
      null
    );
  }

  function stepPlace(k) {
    tut.k = k;
    tut.expectCell = level.solution[tut.placeSeq[k]];
    const texts = [
      "Tap the glowing cell to drop your first spray can 👆",
      "Tap the next glowing cell",
      "Great — two cans to go. Tap the glowing cell",
      "The last can — tap the glowing cell",
    ];
    tutSet("place" + k, texts[k], tut.expectCell);
  }

  function stepLong() {
    tut.expectCell = level.solution[tut.placeSeq[0]];
    tutSet("long", "Now press & hold the can to take it down", tut.expectCell);
  }

  function stepReplace() {
    tut.expectCell = level.solution[tut.placeSeq[0]];
    tutSet("re-place", "Perfect — tap it to place it back", tut.expectCell);
  }

  function infoPaint() {
    infoStep(
      "info-paint",
      "See that? It just sprayed its WHOLE row and column!",
      tut.expectCell,
      2600,
      stepLong
    );
  }

  function infoOverlap() {
    const a = level.solution[tut.placeSeq[0]];
    const b = level.solution[tut.placeSeq[1]];
    pulseCell(Math.floor(a / n) * n + (b % n));
    pulseCell(Math.floor(b / n) * n + (a % n));
    infoStep(
      "info-overlap",
      "Where two sprays overlap, the LAST can sprayed wins!",
      tut.expectCell,
      2800,
      () => stepPlace(2)
    );
  }

  function infoOneMore() {
    infoStep("info-one", "One more!", tut.expectCell, 1500, () => stepPlace(3));
  }

  function infoOrderWrong() {
    infoStep(
      "info-order",
      "Almost! The colors don't match — the spray ORDER was wrong.",
      null,
      2600,
      stepDemo
    );
  }

  function stepDemo() {
    const cells = tut.good.map((rid) => level.solution[rid]);
    tutSet("demo", "Watch the correct order…", null);
    demoSequence(cells);
    const next = stepSeq;
    tut.infoNext = next;
    tut.infoTimer = setTimeout(() => {
      if (!tut) return;
      tut.infoTimer = null;
      tut.infoNext = null;
      next();
    }, cells.length * 380 + 600);
  }

  function stepSeq() {
    tut.seqPos = 0;
    tutSet("seq", "Now tap the cans in that order!", level.solution[tut.good[0]]);
  }

  function tutTap(i) {
    if (!tut) return;
    const step = tut.step;
    if (step === "intro" || step.indexOf("info") === 0 || step === "demo") return;
    if (step === "long") {
      if (i === tut.expectCell) toast("Press & hold the can");
      else {
        shakeCell(i);
        pulseCell(tut.expectCell);
      }
      return;
    }
    if (step === "seq") {
      const rid = tut.good[tut.seqPos];
      const cell = level.solution[rid];
      if (i !== cell) {
        shakeCell(i);
        toast("Follow the glowing order");
        return;
      }
      cyclePot(rid);
      if (!tut) return;
      tut.seqPos++;
      if (tut.seqPos >= tut.good.length) return;
      tutSet("seq", "Now tap the cans in that order!", level.solution[tut.good[tut.seqPos]]);
      return;
    }
    if (step === "re-place") {
      if (i !== tut.expectCell) {
        shakeCell(i);
        pulseCell(tut.expectCell);
        return;
      }
      placePot(i, regionOf[i]);
      stepPlace(1);
      return;
    }
    if (step.indexOf("place") === 0) {
      if (i !== tut.expectCell) {
        shakeCell(i);
        pulseCell(tut.expectCell);
        toast("Try the glowing cell");
        return;
      }
      placePot(i, regionOf[i]);
      const k = tut.k;
      if (k === 0) infoPaint();
      else if (k === 1) infoOverlap();
      else if (k === 2) infoOneMore();
      else infoOrderWrong();
    }
  }

  function tutLong(i) {
    if (!tut || tut.step !== "long") return;
    if (i !== tut.expectCell) {
      shakeCell(i);
      return;
    }
    const rid = regionOf[i];
    if (placement[rid] < 0) return;
    removePotAt(rid, i);
    stepReplace();
  }

  function undo() {
    if (!history.length) return;
    const wasWon = won;
    const prev = history.pop();
    placement = prev.placement;
    order = prev.order;
    moves++;
    won = false;
    els.winOverlay.classList.add("hidden");
    if (wasWon) focusBoard();
    updateAlarm();
    sound("remove");
    renderPattern(null, false, null);
    updateStatus();
    updateStats();
    updateButtons();
    resumeAfterOverlay();
  }

  function doHint() {
    if (won) return;
    const regionCells = Core.regionCellsOf(n, regionOf);
    const h = Core.getHint(n, regionCells, level.target, placement);
    if (!h) {
      toast("No hint available");
      return;
    }
    hintsUsed++;
    moves += Core.HINT_COST;
    if (h.type === "place") {
      pulseCell(h.cell);
      toast("Try this cell · +" + Core.HINT_COST + " moves");
      sound("tick");
    } else if (h.type === "remove") {
      pulseCell(h.cell);
      toast("Move this can · +" + Core.HINT_COST + " moves");
      sound("wrong");
    } else {
      toast("Tap the cans in this order · +" + Core.HINT_COST + " moves");
      demoSequence(h.cells);
    }
    updateStats();
    updateButtons();
  }

  function demoSequence(cells) {
    cells.forEach((cell, idx) => {
      setTimeout(() => {
        pulseCell(cell);
        sound("tick");
      }, idx * 380);
    });
  }

  function pulseCell(i) {
    const el = cellEls[i];
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
    setTimeout(() => el.classList.remove("pulse"), 1600);
  }
  function shakeCell(i) {
    const el = cellEls[i];
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 360);
  }

  function updateStatus() {
    if (won || failed) {
      els.status.textContent = "";
      return;
    }
    const left = n - placedCount();
    if (left > 0) {
      els.status.textContent =
        placedCount() === 0
          ? "One can per region, row & column — cans can't touch"
          : left + (left === 1 ? " can to go" : " cans to go");
      return;
    }
    if (patternMatches()) {
      els.status.textContent = "";
      return;
    }
    const regionCells = Core.regionCellsOf(n, regionOf);
    const h = Core.getHint(n, regionCells, level.target, placement);
    if (h && h.type === "order") {
      els.status.textContent = "Right cans — wrong paint order. Tap them again to respray on top";
    } else {
      els.status.textContent = "One of these cans can't be here — tap 💡 to find it";
    }
  }

  function checkWin() {
    if (won) return;
    if (placedCount() < n) return;
    if (!patternMatches()) return;
    won = true;
    const inTut = !!tut;
    timerSet(false);
    updateAlarm();
    const timeMs = elapsedMs();
    const stars = inTut ? 3 : Core.scoreLevel(moves, hintsUsed, par);
    if (inTut) {
      save.tutSeen = true;
      tutCleanup();
    }
    els.stars.textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    els.stars.setAttribute("aria-label", stars + " out of 3 stars");
    lastResult = {
      stars,
      moves,
      par,
      hints: hintsUsed,
      timeMs,
      target: level.target.slice(),
    };
    if (!inTut) {
      const timeKey = currentMeta.daily ? "daily" : String(currentMeta.num);
      save.stimes = save.stimes || {};
      const prevBest = save.stimes[timeKey];
      const isBest = prevBest == null || timeMs < prevBest;
      if (isBest) save.stimes[timeKey] = Math.round(timeMs);
      const bits = [
        moves + "/" + moveCap + " moves · par " + par,
        Core.formatTime(timeMs),
      ];
      if (hintsUsed) bits.push(hintsUsed + (hintsUsed === 1 ? " hint" : " hints"));
      if (isBest)
        bits.push(
          '<span class="best">★ ' + (prevBest == null ? "first clear" : "new best") + "</span>"
        );
      els.winStats.innerHTML = bits.join(" · ");
    } else {
      els.winStats.textContent = "";
    }
    if (currentMeta.daily) {
      const today = currentMeta.date;
      const streakBefore = save.streak || 0;
      save.streak = Core.computeStreak(save.dailyLast, streakBefore, today);
      save.dailyLast = today;
      els.winTitle.textContent = "Daily solved! 🔥 " + save.streak;
      els.nextBtn.textContent = "Back to map";
    } else {
      const num = currentMeta.num;
      save.stars[num] = Math.max(save.stars[num] || 0, stars);
      save.maxLevel = Math.max(save.maxLevel || 1, num + 1);
      save.level = Math.max(save.level || 1, num + 1);
      els.winTitle.textContent = "Level " + num + " complete!";
      els.nextBtn.textContent = "Next level →";
    }
    setTimeout(() => {
      if (!won) return;
      els.winOverlay.classList.remove("hidden");
      rememberFocus();
      focusOverlay(els.winOverlay);
      burstConfetti();
    }, 700);
    sound("win");
    buzz([30, 50, 30, 50, 60]);
    persist();
    updateStatus();
  }

  function burstConfetti() {
    for (let i = 0; i < 46; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.setAttribute("aria-hidden", "true");
      c.style.left = Math.random() * 100 + "%";
      c.style.background = PALETTE[i % PALETTE.length];
      const dur = 1.3 + Math.random() * 1.4;
      c.style.animationDuration = dur + "s";
      c.style.animationDelay = Math.random() * 0.5 + "s";
      els.winOverlay.appendChild(c);
      setTimeout(() => c.remove(), (dur + 0.6) * 1000);
    }
  }

  let toastTimer = null;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1900);
  }

  function updateButtons() {
    els.undoBtn.disabled = history.length === 0 || !!tut;
    els.hintBtn.disabled = !!tut || moves + Core.HINT_COST >= moveCap;
    els.rotBtn.disabled = !!tut || won || failed;
    els.restartBtn.disabled = !!tut || won || failed;
    els.mapBtn.disabled = !!tut;
    els.statLives.classList.toggle("hidden", !!tut);
    els.diffBtn.classList.toggle("on", save.diff);
    els.diffBtn.setAttribute("aria-pressed", save.diff ? "true" : "false");
    els.soundBtn.textContent = save.sound ? "🔊" : "🔇";
    els.soundBtn.setAttribute("aria-pressed", save.sound ? "true" : "false");
    els.patBtn.classList.toggle("on", !!save.pat);
    els.patBtn.setAttribute("aria-pressed", save.pat ? "true" : "false");
    els.patBtn.disabled = !!tut;
    els.hintBtn.textContent = "💡 Hint";
  }

  let actx = null;
  function ensureAudio() {
    if (!actx && window.AudioContext) actx = new AudioContext();
    if (actx && actx.state === "suspended") actx.resume();
  }
  function tone(freq, dur, type, when, vol) {
    if (!save.sound) return;
    ensureAudio();
    if (!actx) return;
    const t0 = actx.currentTime + (when || 0);
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.13, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }
  function sound(kind, rid) {
    if (!save.sound) return;
    rid = rid || 0;
    if (kind === "place") tone(300 + (rid % 8) * 45, 0.14, "triangle");
    else if (kind === "cycle") tone(430 + (rid % 8) * 40, 0.12, "triangle");
    else if (kind === "remove") tone(210, 0.16, "sine");
    else if (kind === "wrong") tone(140, 0.16, "square", 0, 0.08);
    else if (kind === "alarm")
      [1046, 784, 1046, 784, 1046].forEach((f, i) =>
        tone(f, 0.09, "square", i * 0.11, 0.1)
      );
    else if (kind === "tick") tone(620, 0.06, "triangle", 0, 0.07);
    else if (kind === "win")
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.32, "triangle", i * 0.09, 0.13));
  }
  function buzz(patternVal) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(patternVal);
      } catch (e) {}
    }
  }

  const bgm = new Audio();
  bgm.loop = true;
  bgm.preload = "none";
  bgm.volume = 0.45;
  (function pickBgmSource() {
    const probe = document.createElement("audio");
    bgm.src =
      probe.canPlayType('audio/ogg; codecs="vorbis"') !== ""
        ? "music.ogg"
        : "music.mp3";
  })();
  let bgmOn = false;

  function bgmPlay() {
    if (!save.sound || bgmOn) return;
    const attempt = bgm.play();
    if (attempt && typeof attempt.then === "function") {
      attempt.then(
        () => {
          bgmOn = true;
          stopWaitingForGesture();
        },
        () => {}
      );
    } else {
      bgmOn = true;
    }
  }

  function bgmPause() {
    bgmOn = false;
    bgm.pause();
  }

  function onFirstGesture() {
    if (bgmOn) stopWaitingForGesture();
    else bgmPlay();
  }

  function stopWaitingForGesture() {
    document.removeEventListener("pointerdown", onFirstGesture);
    document.removeEventListener("keydown", onFirstGesture);
  }

  document.addEventListener("pointerdown", onFirstGesture);
  document.addEventListener("keydown", onFirstGesture);

  let pressTimer = null;
  let pressCell = -1;
  let longFired = false;
  let startX = 0;
  let startY = 0;

  els.board.addEventListener("pointerdown", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell) return;
    pressCell = Number(cell.dataset.i);
    longFired = false;
    startX = e.clientX;
    startY = e.clientY;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      longFired = true;
      if (tut) {
        tutLong(pressCell);
        return;
      }
      const rid = regionOf[pressCell];
      if (placement[rid] >= 0) removePot(rid);
      else shakeCell(pressCell);
    }, 480);
  });
  els.board.addEventListener("pointerup", (e) => {
    clearTimeout(pressTimer);
    const moved = Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY);
    if (!longFired && pressCell >= 0 && moved < 14) onCellTap(pressCell);
    pressCell = -1;
  });
  els.board.addEventListener("pointercancel", () => {
    clearTimeout(pressTimer);
    pressCell = -1;
  });
  els.board.addEventListener("contextmenu", (e) => e.preventDefault());

  const ARROWS = {
    ArrowRight: [1, 0],
    ArrowLeft: [-1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };

  function cellTargetOf(e) {
    const t = e.target;
    return t && t.closest ? t.closest(".cell") : null;
  }

  function onKeyDown(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea") return;

    if (e.key === "Tab") {
      const dlg = activeDialog();
      if (dlg) trapTab(e, dlg);
      return;
    }

    if (e.key === "Escape") {
      if (!els.rulesModal.classList.contains("hidden")) {
        e.preventDefault();
        closeRules();
      } else if (!els.mapOverlay.classList.contains("hidden")) {
        e.preventDefault();
        closeMap();
      }
      return;
    }

    if (activeDialog()) return;

    if (ARROWS[e.key]) {
      e.preventDefault();
      if (!cellEls.length) return;
      moveFocus(ARROWS[e.key][0], ARROWS[e.key][1]);
      return;
    }

    const onCell = cellTargetOf(e);
    const inBoard = !!(onCell || e.target === document.body || e.target === document);

    if ((e.key === "Enter" || e.key === " " || e.key === "Spacebar") && inBoard) {
      e.preventDefault();
      onCellTap(onCell ? Number(onCell.dataset.i) : focusIdx);
      return;
    }

    if ((e.key === "Delete" || e.key === "Backspace") && inBoard) {
      e.preventDefault();
      const i = onCell ? Number(onCell.dataset.i) : focusIdx;
      if (tut) {
        tutLong(i);
      } else if (placement[regionOf[i]] >= 0) {
        removePot(regionOf[i]);
      } else {
        shakeCell(i);
      }
      return;
    }

    const k = e.key.length === 1 ? e.key.toLowerCase() : "";
    if (k === "u" || k === "z") {
      if (!els.undoBtn.disabled) {
        e.preventDefault();
        undo();
      }
    } else if (k === "h") {
      if (!els.hintBtn.disabled) {
        e.preventDefault();
        doHint();
      }
    } else if (k === "t") {
      if (!els.rotBtn.disabled) {
        e.preventDefault();
        rotateBoard();
      }
    } else if (k === "c") {
      e.preventDefault();
      els.diffBtn.click();
    } else if (k === "s") {
      if (!els.patBtn.disabled) {
        e.preventDefault();
        els.patBtn.click();
      }
    }
  }

  document.addEventListener("keydown", onKeyDown);

  els.undoBtn.addEventListener("click", undo);
  els.hintBtn.addEventListener("click", doHint);
  els.rotBtn.addEventListener("click", rotateBoard);
  els.restartBtn.addEventListener("click", restartLevel);
  els.shareBtn.addEventListener("click", shareResult);
  els.diffBtn.addEventListener("click", () => {
    save.diff = !save.diff;
    persist();
    renderDots();
    applyMural();
    updateButtons();
  });
  els.patBtn.addEventListener("click", () => {
    save.pat = !save.pat;
    persist();
    applyPatterns();
    updateButtons();
    sound("tick");
  });
  els.soundBtn.addEventListener("click", () => {
    save.sound = !save.sound;
    persist();
    updateButtons();
    if (save.sound) {
      sound("tick");
      bgmPlay();
    } else {
      bgmPause();
    }
  });
  els.rulesBtn.addEventListener("click", () => {
    pauseForOverlay();
    rememberFocus();
    els.rulesModal.classList.remove("hidden");
    focusOverlay(els.rulesModal);
  });
  els.rulesClose.addEventListener("click", closeRules);
  els.nextBtn.addEventListener("click", () => {
    if (currentMeta && currentMeta.daily) {
      els.winOverlay.classList.add("hidden");
      lastFocus = null;
      openMap();
      return;
    }
    startCampaign(save.level);
    focusBoard();
  });
  els.tutNext.addEventListener("click", (e) => {
    e.stopPropagation();
    if (tut && tut.step === "intro") stepPlace(0);
  });
  els.tutSkip.addEventListener("click", (e) => {
    e.stopPropagation();
    save.tutSeen = true;
    persist();
    tutCleanup();
    moves = 0;
    updateStats();
    updateButtons();
    if (!save.rulesSeen) els.rulesModal.classList.remove("hidden");
    resumeAfterOverlay();
  });
  els.tutBubble.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    advanceInfo();
  });
  els.mapBtn.addEventListener("click", openMap);
  els.mapClose.addEventListener("click", closeMap);
  els.mapOverlay.addEventListener("click", (e) => {
    if (e.target === els.mapOverlay) closeMap();
  });
  els.dailyBtn.addEventListener("click", () => {
    els.mapOverlay.classList.add("hidden");
    lastFocus = null;
    startDaily();
    focusBoard();
  });
  els.retryBtn.addEventListener("click", retryLevel);
  els.failMapBtn.addEventListener("click", () => {
    els.failOverlay.classList.add("hidden");
    lastFocus = null;
    openMap();
  });

  const finePointer = window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
    : false;
  const reducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  if (finePointer && !reducedMotion) {
    let tiltTimer = null;
    const tilt = (x, y) => {
      document.documentElement.style.setProperty("--tiltX", x.toFixed(2) + "deg");
      document.documentElement.style.setProperty("--tiltY", y.toFixed(2) + "deg");
    };
    els.stage.addEventListener("pointermove", (e) => {
      const r = els.stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      clearTimeout(tiltTimer);
      tiltTimer = setTimeout(() => tilt(-ny * 6, nx * 9), 40);
    });
    els.stage.addEventListener("pointerleave", () => {
      clearTimeout(tiltTimer);
      tilt(0, 0);
    });
  }

  let pausedByHide = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pausedByHide = tRun;
      if (pausedByHide) timerSet(false);
      bgmOn = false;
      bgm.pause();
    } else {
      bgmPlay();
      if (pausedByHide) {
        pausedByHide = false;
        resumeAfterOverlay();
      }
    }
  });

  let sizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(sizeTimer);
    sizeTimer = setTimeout(() => {
      if (n) sizeMinimap();
    }, 120);
  });

  if ("serviceWorker" in navigator && !/qa\.html$/.test(location.pathname)) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  if (/qa\.html$/.test(location.pathname)) {
    window.__overpaint = {
      fail: failLevel,
      lives: () => lives,
      timeLeft: () => timeLeft(),
      failed: () => failed,
      budget: () => Core.timeBudget(n) * 1000,
      setBudget: (ms) => {
        budgetMs = ms;
        paintTimer();
      },
    };
  }

  const hashLevel = location.hash.match(/level=(\d+)/);  if (hashLevel) save.level = Math.max(1, parseInt(hashLevel[1], 10));
  startCampaign(save.level);
  updateButtons();
  if (!save.rulesSeen && save.tutSeen) els.rulesModal.classList.remove("hidden");
  if (!els.rulesModal.classList.contains("hidden")) pauseForOverlay();
})();
