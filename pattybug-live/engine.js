export const AngleMode = { DEG: "DEG", RAD: "RAD" };

const REASONS = {
  SYNTAX: "SYNTAX",
  DOMAIN: "DOMAIN",
  DIVIDE_ZERO: "DIVIDE_ZERO",
  NOT_A_NUMBER: "NOT_A_NUMBER",
};

class CalcError extends Error {
  constructor(reason) {
    super(reason);
    this.reason = reason;
  }
}

export function sanitize(raw) {
  return String(raw)
    .replace(/×/g, "*")
    .replace(/·/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/,/g, "")
    .replace(/\s+/g, "");
}

const T = { NUM: "NUM", IDENT: "IDENT", OP: "OP", LP: "LP", RP: "RP", BANG: "BANG", PCT: "PCT" };

function tokenize(s) {
  const out = [];
  let i = 0;
  const isDigit = (c) => c >= "0" && c <= "9";
  const isLetter = (c) => /[a-zA-Z]/.test(c);
  while (i < s.length) {
    const c = s[i];
    if (isDigit(c) || (c === "." && isDigit(s[i + 1] || ""))) {
      const start = i;
      let dot = false;
      while (i < s.length && (isDigit(s[i]) || (s[i] === "." && !dot))) {
        if (s[i] === ".") dot = true;
        i++;
      }
      if (i < s.length && (s[i] === "e" || s[i] === "E")) {
        const save = i;
        i++;
        if (i < s.length && (s[i] === "+" || s[i] === "-")) i++;
        if (i < s.length && isDigit(s[i])) {
          while (i < s.length && isDigit(s[i])) i++;
        } else {
          i = save;
        }
      }
      out.push({ type: T.NUM, text: s.slice(start, i) });
    } else if (isLetter(c)) {
      const start = i;
      while (i < s.length && /[a-zA-Z0-9]/.test(s[i])) i++;
      out.push({ type: T.IDENT, text: s.slice(start, i).toLowerCase() });
    } else if (c === "(") {
      out.push({ type: T.LP, text: c });
      i++;
    } else if (c === ")") {
      out.push({ type: T.RP, text: c });
      i++;
    } else if (c === "!") {
      out.push({ type: T.BANG, text: c });
      i++;
    } else if (c === "%") {
      out.push({ type: T.PCT, text: c });
      i++;
    } else if ("+-*/^".includes(c)) {
      out.push({ type: T.OP, text: c });
      i++;
    } else {
      throw new CalcError(REASONS.SYNTAX);
    }
  }
  return out;
}

class Parser {
  constructor(tokens, angleMode, ans, x) {
    this.tokens = tokens;
    this.angle = angleMode;
    this.ans = ans;
    this.x = x;
    this.pos = 0;
  }
  peek() {
    return this.tokens[this.pos] || null;
  }
  advance() {
    return this.tokens[this.pos++];
  }
  atEnd() {
    return this.pos >= this.tokens.length;
  }
  norm(v) {
    return v.percent ? v.value / 100 : v.value;
  }
  parse() {
    const r = this.expr();
    if (!this.atEnd()) throw new CalcError(REASONS.SYNTAX);
    return this.norm(r);
  }
  expr() {
    let left = this.term();
    for (;;) {
      const t = this.peek();
      if (t && t.type === T.OP && (t.text === "+" || t.text === "-")) {
        if (left.percent) left = { value: left.value / 100 };
        this.advance();
        const right = this.term();
        const delta = right.percent ? (left.value * right.value) / 100 : right.value;
        left = { value: t.text === "+" ? left.value + delta : left.value - delta };
      } else break;
    }
    return left;
  }
  term() {
    let v = this.unary();
    let single = true;
    for (;;) {
      const t = this.peek();
      if (!t) break;
      if (t.type === T.OP && (t.text === "*" || t.text === "/")) {
        single = false;
        this.advance();
        const r = this.unary();
        const lv = this.norm(v);
        const rv = this.norm(r);
        if (t.text === "*") v = { value: lv * rv };
        else {
          if (rv === 0) throw new CalcError(REASONS.DIVIDE_ZERO);
          v = { value: lv / rv };
        }
      } else if (t.type === T.NUM || t.type === T.IDENT || t.type === T.LP) {
        single = false;
        const r = this.unary();
        v = { value: this.norm(v) * this.norm(r) };
      } else break;
    }
    return single ? v : { value: v.value };
  }
  unary() {
    const t = this.peek();
    if (t && t.type === T.OP && t.text === "-") {
      this.advance();
      return { value: -this.unary().value };
    }
    if (t && t.type === T.OP && t.text === "+") {
      this.advance();
      return this.unary();
    }
    return this.power();
  }
  power() {
    const base = this.postfix();
    const t = this.peek();
    if (t && t.type === T.OP && t.text === "^") {
      this.advance();
      const exponent = this.unary();
      return { value: Math.pow(this.norm(base), this.norm(exponent)) };
    }
    return base;
  }
  postfix() {
    let v = this.primary();
    for (;;) {
      const t = this.peek();
      if (!t) break;
      if (t.type === T.BANG) {
        this.advance();
        v = { value: factorial(this.norm(v)) };
      } else if (t.type === T.PCT) {
        this.advance();
        v = { value: v.value, percent: true };
      } else break;
    }
    return v;
  }
  primary() {
    const t = this.peek();
    if (!t) throw new CalcError(REASONS.SYNTAX);
    if (t.type === T.NUM) {
      this.advance();
      const n = Number(t.text);
      if (Number.isNaN(n)) throw new CalcError(REASONS.SYNTAX);
      return { value: n };
    }
    if (t.type === T.LP) {
      this.advance();
      const inner = this.expr();
      this.expect(T.RP);
      return { value: this.norm(inner) };
    }
    if (t.type === T.IDENT) {
      this.advance();
      return this.ident(t.text);
    }
    throw new CalcError(REASONS.SYNTAX);
  }
  ident(name) {
    const a = () => this.arg(name);
    switch (name) {
      case "pi":
        return { value: Math.PI };
      case "tau":
        return { value: 2 * Math.PI };
      case "e":
        return { value: Math.E };
      case "ans":
        return { value: this.ans };
      case "x":
        return { value: this.x };
      case "sin":
        return { value: Math.sin(this.toRad(a())) };
      case "cos":
        return { value: Math.cos(this.toRad(a())) };
      case "tan":
        return { value: Math.tan(this.toRad(a())) };
      case "csc": {
        const s = Math.sin(this.toRad(a()));
        if (s === 0) throw new CalcError(REASONS.DOMAIN);
        return { value: 1 / s };
      }
      case "sec": {
        const c = Math.cos(this.toRad(a()));
        if (c === 0) throw new CalcError(REASONS.DOMAIN);
        return { value: 1 / c };
      }
      case "cot": {
        const t2 = Math.tan(this.toRad(a()));
        if (t2 === 0) throw new CalcError(REASONS.DOMAIN);
        return { value: 1 / t2 };
      }
      case "asin": {
        const x = a();
        if (x < -1 || x > 1) throw new CalcError(REASONS.DOMAIN);
        return { value: this.fromRad(Math.asin(x)) };
      }
      case "acos": {
        const x = a();
        if (x < -1 || x > 1) throw new CalcError(REASONS.DOMAIN);
        return { value: this.fromRad(Math.acos(x)) };
      }
      case "atan":
        return { value: this.fromRad(Math.atan(a())) };
      case "sinh":
        return { value: Math.sinh(a()) };
      case "cosh":
        return { value: Math.cosh(a()) };
      case "tanh":
        return { value: Math.tanh(a()) };
      case "ln": {
        const x = a();
        if (x <= 0) throw new CalcError(REASONS.DOMAIN);
        return { value: Math.log(x) };
      }
      case "log":
      case "lg": {
        const x = a();
        if (x <= 0) throw new CalcError(REASONS.DOMAIN);
        return { value: Math.log10(x) };
      }
      case "log2": {
        const x = a();
        if (x <= 0) throw new CalcError(REASONS.DOMAIN);
        return { value: Math.log2(x) };
      }
      case "sqrt": {
        const x = a();
        if (x < 0) throw new CalcError(REASONS.DOMAIN);
        return { value: Math.sqrt(x) };
      }
      case "cbrt":
        return { value: Math.cbrt(a()) };
      case "abs":
        return { value: Math.abs(a()) };
      case "exp":
        return { value: Math.exp(a()) };
      case "floor":
        return { value: Math.floor(a()) };
      case "ceil":
        return { value: Math.ceil(a()) };
      case "round":
        return { value: Math.round(a()) };
      case "sign":
        return { value: Math.sign(a()) };
      default:
        throw new CalcError(REASONS.SYNTAX);
    }
  }
  arg() {
    this.expect(T.LP);
    const inner = this.expr();
    this.expect(T.RP);
    return this.norm(inner);
  }
  expect(type) {
    const t = this.peek();
    if (!t || t.type !== type) throw new CalcError(REASONS.SYNTAX);
    this.advance();
  }
  toRad(d) {
    return this.angle === AngleMode.DEG ? (d * Math.PI) / 180 : d;
  }
  fromRad(r) {
    return this.angle === AngleMode.DEG ? (r * 180) / Math.PI : r;
  }
}

function factorial(x) {
  if (x < 0 || x !== Math.floor(x) || x > 170) throw new CalcError(REASONS.DOMAIN);
  let acc = 1;
  for (let n = 2; n <= x; n++) acc *= n;
  return acc;
}

export function evaluate(input, angleMode = AngleMode.DEG, ans = 0, x = 0) {
  const text = sanitize(input);
  if (text === "") return { ok: true, value: 0 };
  try {
    const value = new Parser(tokenize(text), angleMode, ans, x).parse();
    if (!Number.isFinite(value)) return { ok: false, reason: REASONS.NOT_A_NUMBER };
    return { ok: true, value };
  } catch (e) {
    const reason = e instanceof CalcError ? e.reason : REASONS.SYNTAX;
    return { ok: false, reason };
  }
}

export function format(value) {
  if (!Number.isFinite(value)) return "Error";
  if (value === 0) return "0";
  const mag = Math.abs(value);
  if (mag >= 1e12 || mag < 1e-6) {
    return value
      .toExponential(9)
      .replace(/0+e/, "e")
      .replace(/\.e/, "e")
      .replace("e+", "e");
  }
  return String(Number(value.toPrecision(12)));
}

export function slope(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const vertical = dx === 0;
  const m = vertical ? NaN : dy / dx;
  const angle = vertical ? 90 : normalizeZero((Math.atan(m) * 180) / Math.PI);
  return {
    vertical,
    slope: m,
    angleDeg: angle,
    intercept: vertical ? NaN : y1 - m * x1,
    distance: Math.hypot(dx, dy),
    midX: (x1 + x2) / 2,
    midY: (y1 + y2) / 2,
  };
}

export function circle(radius) {
  return {
    radius,
    diameter: 2 * radius,
    circumference: 2 * Math.PI * radius,
    area: Math.PI * radius * radius,
  };
}

function normalizeZero(v) {
  return Object.is(v, -0) ? 0 : v;
}

export { REASONS };
