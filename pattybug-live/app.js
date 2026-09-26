import { AngleMode, REASONS, evaluate, format, slope, circle } from "./engine.js";
import { SKINS, applyTheme } from "./theme.js";
import { drawMotifBackground } from "./motif.js";

const $ = (id) => document.getElementById(id);

const ERROR_TEXT = {
  [REASONS.SYNTAX]: "Check the expression",
  [REASONS.DIVIDE_ZERO]: "Cannot divide by zero",
  [REASONS.DOMAIN]: "Domain error",
  [REASONS.NOT_A_NUMBER]: "Not a number",
};

const state = {
  expression: "",
  angleMode: AngleMode.DEG,
  result: null,
  error: null,
  justEvaluated: false,
  inv: false,
  lastAns: 0,
  history: [],
};

function loadSettings() {
  const params = new URLSearchParams(location.search);
  const querySkin = params.get("skin");
  const queryBrightness = params.get("brightness");
  const storedSkin = querySkin || localStorage.getItem("pb.skin") || "ladybug";
  const storedBrightness = queryBrightness || localStorage.getItem("pb.brightness") || "system";
  $("skin").value = SKINS.some((s) => s.key === storedSkin) ? storedSkin : "ladybug";
  $("brightness").value = ["system", "light", "dark"].includes(storedBrightness) ? storedBrightness : "system";
  applyTheme($("skin").value, $("brightness").value);
  try {
    state.history = JSON.parse(localStorage.getItem("pb.history") || "[]");
  } catch {
    state.history = [];
  }
}

function saveHistory() {
  localStorage.setItem("pb.history", JSON.stringify(state.history.slice(0, 200)));
}

function preview() {
  if (!state.expression || state.justEvaluated) return null;
  return evaluate(state.expression, state.angleMode, state.lastAns);
}

function render() {
  const exprEl = $("expr");
  const valEl = $("value");
  const p = preview();
  exprEl.textContent = state.justEvaluated || (p && p.ok) ? state.expression : "";
  if (state.error) {
    valEl.textContent = ERROR_TEXT[state.error] || "Error";
    valEl.classList.add("error");
  } else {
    valEl.classList.remove("error");
    if (state.justEvaluated) valEl.textContent = state.result ?? "0";
    else if (p && p.ok) valEl.textContent = format(p.value);
    else valEl.textContent = state.expression || "0";
  }
  $("angle-key").textContent = state.angleMode === AngleMode.DEG ? "DEG" : "RAD";
}

function input(text) {
  if (state.justEvaluated) {
    const continues = text && "+-*/^".includes(text[0]);
    state.expression = continues ? state.result || "" : "";
    state.result = null;
    state.justEvaluated = false;
  }
  state.expression += text;
  state.error = null;
  render();
}

function clearAll() {
  state.expression = "";
  state.result = null;
  state.error = null;
  state.justEvaluated = false;
  render();
}

function backspace() {
  if (state.justEvaluated) return clearAll();
  state.expression = state.expression.slice(0, -1);
  state.error = null;
  render();
}

function toggleAngle() {
  state.angleMode = state.angleMode === AngleMode.DEG ? AngleMode.RAD : AngleMode.DEG;
  render();
  drawGraph();
}

function negate() {
  state.expression = negateExpr(state.expression);
  state.error = null;
  render();
}

function negateExpr(expr) {
  if (!expr) return "-";
  let j = expr.length;
  while (j > 0 && /[0-9.]/.test(expr[j - 1])) j--;
  if (j === expr.length) return expr.startsWith("-") ? expr.slice(1) : "-" + expr;
  const before = j - 1 >= 0 && (j - 1 === 0 || "+-*/^(".includes(expr[j - 2]));
  if (before && expr[j - 1] === "-") return expr.slice(0, j - 1) + expr.slice(j);
  return expr.slice(0, j) + "-" + expr.slice(j);
}

function equals() {
  if (!state.expression) return;
  const r = evaluate(state.expression, state.angleMode, state.lastAns);
  if (r.ok) {
    const text = format(r.value);
    state.lastAns = r.value;
    state.result = text;
    state.error = null;
    state.justEvaluated = true;
    state.history.unshift({ expression: state.expression, result: text, at: Date.now() });
    saveHistory();
  } else {
    state.error = r.reason;
    state.result = null;
  }
  render();
}

function useValue(text) {
  if (state.justEvaluated) {
    state.expression = text;
    state.result = null;
    state.justEvaluated = false;
  } else {
    state.expression += text;
  }
  state.error = null;
  closeHistory();
  render();
}

const ROWS = () => [
  [
    { label: "DEG", kind: "angle", id: "angle-key", action: toggleAngle },
    { label: "(", kind: "func", action: () => input("(") },
    { label: ")", kind: "func", action: () => input(")") },
    { label: "π", kind: "const", action: () => input("π") },
    { label: "e", kind: "const", action: () => input("e") },
  ],
  [
    { label: state.inv ? "sin⁻¹" : "sin", kind: "func", action: () => input(state.inv ? "asin(" : "sin(") },
    { label: state.inv ? "cos⁻¹" : "cos", kind: "func", action: () => input(state.inv ? "acos(" : "cos(") },
    { label: state.inv ? "tan⁻¹" : "tan", kind: "func", action: () => input(state.inv ? "atan(" : "tan(") },
    { label: state.inv ? "eˣ" : "ln", kind: "func", action: () => input(state.inv ? "exp(" : "ln(") },
    { label: state.inv ? "10ˣ" : "log", kind: "func", action: () => input(state.inv ? "10^(" : "log(") },
  ],
  [
    { label: "√", kind: "func", action: () => input("sqrt(") },
    { label: "x²", kind: "func", action: () => input("^2") },
    { label: "xʸ", kind: "func", action: () => input("^") },
    { label: "!", kind: "func", action: () => input("!") },
    { label: "%", kind: "func", action: () => input("%") },
  ],
  [
    { label: "7", kind: "digit", action: () => input("7") },
    { label: "8", kind: "digit", action: () => input("8") },
    { label: "9", kind: "digit", action: () => input("9") },
    { label: "÷", kind: "op", action: () => input("÷") },
    { label: "C", kind: "clear", action: clearAll },
  ],
  [
    { label: "4", kind: "digit", action: () => input("4") },
    { label: "5", kind: "digit", action: () => input("5") },
    { label: "6", kind: "digit", action: () => input("6") },
    { label: "×", kind: "op", action: () => input("×") },
    { label: "⌫", kind: "back", action: backspace },
  ],
  [
    { label: "1", kind: "digit", action: () => input("1") },
    { label: "2", kind: "digit", action: () => input("2") },
    { label: "3", kind: "digit", action: () => input("3") },
    { label: "−", kind: "op", action: () => input("−") },
    { label: "Ans", kind: "func", action: () => input("ans") },
  ],
  [
    { label: "0", kind: "digit", action: () => input("0") },
    { label: ".", kind: "digit", action: () => input(".") },
    { label: "±", kind: "func", action: negate },
    { label: "+", kind: "op", action: () => input("+") },
    { label: "=", kind: "equals", action: equals },
  ],
];

function buildKeypad() {
  const pad = $("keypad");
  pad.innerHTML = "";
  for (const row of ROWS()) {
    const rowEl = document.createElement("div");
    rowEl.className = "key-row";
    for (const key of row) {
      const btn = document.createElement("button");
      btn.className = "key key-" + key.kind;
      btn.textContent = key.label;
      if (key.id) btn.id = key.id;
      btn.type = "button";
      btn.addEventListener("click", key.action);
      rowEl.appendChild(btn);
    }
    pad.appendChild(rowEl);
  }
}

function openHistory() {
  renderHistory();
  $("history").hidden = false;
}

function closeHistory() {
  $("history").hidden = true;
}

function renderHistory() {
  const list = $("history-list");
  list.innerHTML = "";
  if (!state.history.length) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No calculations yet.";
    list.appendChild(p);
    return;
  }
  for (const entry of state.history) {
    const item = document.createElement("button");
    item.className = "history-item";
    item.type = "button";
    item.innerHTML = `<span class="history-expr"></span><span class="history-result"></span>`;
    item.querySelector(".history-expr").textContent = entry.expression;
    item.querySelector(".history-result").textContent = "= " + entry.result;
    item.addEventListener("click", () => useValue(entry.result));
    list.appendChild(item);
  }
}

const graph = { centerX: 0, halfWidth: 10 };

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawBg() {
  const canvas = $("bg");
  if (!canvas) return;
  const skin = SKINS.find((s) => s.key === $("skin").value) || SKINS[0];
  drawMotifBackground(canvas, skin.motif, cssVar("--bg") || "#ffffff");
}

function fitY(ys) {
  const finite = ys.filter((y) => y !== null && Number.isFinite(y)).sort((a, b) => a - b);
  if (!finite.length) return [-1, 1];
  const lo = finite[Math.min(finite.length - 1, Math.floor(finite.length * 0.02))];
  const hi = finite[Math.min(finite.length - 1, Math.floor(finite.length * 0.98))];
  if (hi - lo < 1e-12) {
    const c = finite[0] === 0 ? 0 : finite[0];
    return [c - 1, c + 1];
  }
  const pad = (hi - lo) * 0.1;
  return [lo - pad, hi + pad];
}

function drawGraph() {
  const canvas = $("graph");
  if (!canvas || canvas.offsetParent === null) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width;
  const H = rect.height;
  const expr = $("fx").value;
  const xMin = graph.centerX - graph.halfWidth;
  const xMax = graph.centerX + graph.halfWidth;

  const n = Math.max(2, Math.min(Math.round(W), 900));
  const xs = [];
  const ys = [];
  for (let i = 0; i < n; i++) {
    const x = xMin + ((xMax - xMin) * i) / (n - 1);
    const r = evaluate(expr, state.angleMode, 0, x);
    xs.push(x);
    ys.push(r.ok ? r.value : null);
  }
  const [yMin, yMax] = fitY(ys);
  const ySpan = yMax - yMin || 1;
  const px = (x) => ((x - xMin) / (xMax - xMin)) * W;
  const py = (y) => H - ((y - yMin) / ySpan) * H;

  const gridColor = cssVar("--outline-variant") || "#ddd";
  const axisColor = cssVar("--on-surface-variant") || "#888";
  const curveColor = cssVar("--primary") || "#d7263d";

  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const gx = (W * i) / 10;
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
    const gy = (H * i) / 10;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2;
  if (xMin <= 0 && xMax >= 0) {
    ctx.beginPath();
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), H);
    ctx.stroke();
  }
  if (yMin <= 0 && yMax >= 0) {
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(W, py(0));
    ctx.stroke();
  }
  ctx.strokeStyle = curveColor;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.beginPath();
  let drawing = false;
  for (let i = 0; i < n; i++) {
    const y = ys[i];
    if (y === null || !Number.isFinite(y)) {
      drawing = false;
      continue;
    }
    const sx = px(xs[i]);
    const sy = py(y);
    if (!drawing) {
      ctx.moveTo(sx, sy);
      drawing = true;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();
  $("graph-range").textContent = `x: ${format(xMin)} … ${format(xMax)}`;
}

function setupGraph() {
  const canvas = $("graph");
  $("fx").addEventListener("input", drawGraph);
  let dragging = false;
  let lastX = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const span = graph.halfWidth * 2;
    graph.centerX -= ((e.clientX - lastX) / rect.width) * span;
    lastX = e.clientX;
    drawGraph();
  });
  canvas.addEventListener("pointerup", () => (dragging = false));
  canvas.addEventListener("pointercancel", () => (dragging = false));
}

function setupTools() {
  const ids = ["x1", "y1", "x2", "y2"];
  ids.forEach((id) => $(id).addEventListener("input", updateSlope));
  $("radius").addEventListener("input", updateCircle);
  updateSlope();
  updateCircle();
}

function num(id) {
  const v = $(id).value;
  if (v === "" || v === "-" || v === ".") return NaN;
  return Number(v);
}

function updateSlope() {
  const x1 = num("x1");
  const y1 = num("y1");
  const x2 = num("x2");
  const y2 = num("y2");
  const box = $("slope-result");
  if ([x1, y1, x2, y2].some((v) => Number.isNaN(v))) {
    box.innerHTML = '<p class="muted">Enter four numbers to see the slope.</p>';
    return;
  }
  const r = slope(x1, y1, x2, y2);
  const rows = [];
  if (r.vertical) {
    rows.push(["Slope", "undefined (vertical line)"]);
    rows.push(["Equation", `x = ${format(r.midX)}`]);
  } else {
    rows.push(["Slope (m)", format(r.slope)]);
    rows.push(["Angle", `${format(r.angleDeg)}°`]);
    rows.push(["Equation", `y = ${format(r.slope)}x + ${format(r.intercept)}`]);
  }
  rows.push(["Distance", format(r.distance)]);
  rows.push(["Midpoint", `(${format(r.midX)}, ${format(r.midY)})`]);
  box.innerHTML = rows.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join("");
  drawSlopeMini(x1, y1, x2, y2);
}

function updateCircle() {
  const r = num("radius");
  const box = $("circle-result");
  if (Number.isNaN(r)) {
    box.innerHTML = '<p class="muted">Enter a radius.</p>';
    return;
  }
  const c = circle(r);
  const rows = [
    ["π", format(Math.PI)],
    ["Diameter", format(c.diameter)],
    ["Circumference", format(c.circumference)],
    ["Area", format(c.area)],
  ];
  box.innerHTML = rows.map(([k, v]) => `<div class="row"><span>${k}</span><b>${v}</b></div>`).join("");
}

function drawSlopeMini(x1, y1, x2, y2) {
  const canvas = $("slope-graph");
  if (!canvas || canvas.offsetParent === null) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width;
  const H = rect.height;
  const minX = Math.min(x1, x2, 0);
  const maxX = Math.max(x1, x2, 0);
  const minY = Math.min(y1, y2, 0);
  const maxY = Math.max(y1, y2, 0);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const padX = spanX * 0.2;
  const padY = spanY * 0.2;
  const px = (x) => ((x - (minX - padX)) / (spanX + 2 * padX)) * W;
  const py = (y) => H - ((y - (minY - padY)) / (spanY + 2 * padY)) * H;
  const axisColor = cssVar("--outline") || "#ccc";
  const lineColor = cssVar("--primary") || "#d7263d";
  const pointColor = cssVar("--tertiary") || "#3e9b4f";
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 2;
  if (minX - padX <= 0 && maxX + padX >= 0) {
    ctx.beginPath();
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), H);
    ctx.stroke();
  }
  if (minY - padY <= 0 && maxY + padY >= 0) {
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(W, py(0));
    ctx.stroke();
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px(x1), py(y1));
  ctx.lineTo(px(x2), py(y2));
  ctx.stroke();
  ctx.fillStyle = pointColor;
  for (const [x, y] of [
    [x1, y1],
    [x2, y2],
  ]) {
    ctx.beginPath();
    ctx.arc(px(x), py(y), 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab");
  function selectTab(tab, updateHash) {
    buttons.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".panel").forEach((p) => {
      p.hidden = p.dataset.panel !== tab;
    });
    if (updateHash) history.replaceState(null, "", "#" + tab);
    if (tab === "graph") requestAnimationFrame(drawGraph);
    if (tab === "tools") {
      updateSlope();
      updateCircle();
    }
  }
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => selectTab(btn.dataset.tab, true));
  });
  $("graph-in").addEventListener("click", () => {
    graph.halfWidth = Math.max(1e-3, graph.halfWidth / 2);
    drawGraph();
  });
  $("graph-out").addEventListener("click", () => {
    graph.halfWidth = Math.min(1e7, graph.halfWidth * 2);
    drawGraph();
  });
  $("graph-reset").addEventListener("click", () => {
    graph.centerX = 0;
    graph.halfWidth = 10;
    drawGraph();
  });
  const initial = (location.hash || "").replace("#", "");
  if (["calc", "graph", "tools"].includes(initial)) selectTab(initial, false);
}

function setupChrome() {
  $("skin").addEventListener("change", () => {
    localStorage.setItem("pb.skin", $("skin").value);
    applyTheme($("skin").value, $("brightness").value);
    drawBg();
    drawGraph();
    if ($("panel-tools").hidden === false) drawSlopeMini(num("x1"), num("y1"), num("x2"), num("y2"));
  });
  $("brightness").addEventListener("change", () => {
    localStorage.setItem("pb.brightness", $("brightness").value);
    applyTheme($("skin").value, $("brightness").value);
    drawBg();
    drawGraph();
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if ($("brightness").value === "system") {
      applyTheme($("skin").value, "system");
      drawBg();
      drawGraph();
    }
  });
  $("history-open").addEventListener("click", openHistory);
  $("inv").addEventListener("click", () => {
    state.inv = !state.inv;
    $("inv").classList.toggle("active", state.inv);
    buildKeypad();
    render();
  });
  $("history-close").addEventListener("click", closeHistory);
  $("history-clear").addEventListener("click", () => {
    state.history = [];
    saveHistory();
    renderHistory();
  });
  $("copy").addEventListener("click", async () => {
    const p = preview();
    const text = state.justEvaluated ? state.result || "" : p && p.ok ? format(p.value) : "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      $("copy").textContent = "Copied";
      setTimeout(() => ($("copy").textContent = "Copy"), 1200);
    } catch {
      /* clipboard unavailable */
    }
  });
}

function setupKeyboard() {
  window.addEventListener("keydown", (e) => {
    if ($("panel-calc").hidden) return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    const k = e.key;
    if (/^[0-9.]$/.test(k)) return input(k);
    if ("+-*/^%()!".includes(k)) return input(k);
    if (k === "Enter" || k === "=") {
      e.preventDefault();
      return equals();
    }
    if (k === "Backspace") {
      e.preventDefault();
      return backspace();
    }
    if (k === "Escape") return clearAll();
    if (k === "p") return input("π");
  });
}

function setupSkinOptions() {
  const sel = $("skin");
  for (const s of SKINS) {
    const opt = document.createElement("option");
    opt.value = s.key;
    opt.textContent = s.label;
    sel.appendChild(opt);
  }
}

setupSkinOptions();
buildKeypad();
loadSettings();
setupChrome();
setupTabs();
setupGraph();
setupTools();
setupKeyboard();
render();
drawBg();
if (new URLSearchParams(location.search).get("inv") === "1") {
  state.inv = true;
  $("inv").classList.add("active");
  buildKeypad();
  render();
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawGraph);
window.addEventListener("resize", () => {
  drawBg();
  drawGraph();
});
