const IMG = (n) => "/pattybug-live/assets/skins/" + n + ".jpg";

export const SKINS = [
  { key: "ladybug", label: "Ladybug", primary: "#D7263D", secondary: "#1B1B1E", tertiary: "#3E9B4F", motif: "ladybugs", image: IMG("skin_ladybug") },
  { key: "pink", label: "Pink", primary: "#EC6A9C", secondary: "#B23A72", tertiary: "#FFC1D9", motif: "sparkles", image: IMG("skin_pink") },
  { key: "halloween", label: "Halloween", primary: "#F26A1B", secondary: "#6A2C91", tertiary: "#7CB342", motif: "pumpkins", image: IMG("skin_halloween") },
  { key: "valentine", label: "Valentine's Day", primary: "#E5487E", secondary: "#B3123C", tertiary: "#D9A441", motif: "hearts", image: IMG("skin_valentine") },
  { key: "independence", label: "Independence Day", primary: "#B22234", secondary: "#3C3B6E", tertiary: "#C9A227", motif: "stars", image: IMG("skin_independence") },
  { key: "mothers", label: "Mother's Day", primary: "#D4869C", secondary: "#8E6BAE", tertiary: "#D9A441", motif: "flowers", image: IMG("skin_mothers") },
  { key: "cats", label: "Kittens", primary: "#9C7BD6", secondary: "#6D5A9C", tertiary: "#5B8DEF", motif: "cats", image: IMG("skin_cats") },
  { key: "puppies", label: "Puppies", primary: "#4F8FEF", secondary: "#7E8FA8", tertiary: "#7EC8E3", motif: "dogs", image: IMG("skin_puppies") },
  { key: "cheetah", label: "Cheetah", primary: "#B07A3C", secondary: "#6B4A2B", tertiary: "#E3C48D", motif: "cheetah", image: IMG("skin_cheetah") },
  { key: "christmas", label: "Christmas", primary: "#C0392B", secondary: "#1F5C3A", tertiary: "#C9A227", motif: "none", image: IMG("skin_christmas") },
  { key: "newyears", label: "New Year's", primary: "#C9A227", secondary: "#1B2A5B", tertiary: "#E8C766", motif: "none", image: IMG("skin_newyear") },
  { key: "fathers", label: "Father's Day", primary: "#33506E", secondary: "#6E4A2A", tertiary: "#C9A227", motif: "none", image: IMG("skin_fathers") },
  { key: "patrick", label: "St. Patrick's Day", primary: "#2E8B57", secondary: "#1F6B3A", tertiary: "#D4AF37", motif: "none", image: IMG("skin_patrick") },
  { key: "easter", label: "Easter", primary: "#E8A0BF", secondary: "#A78BC7", tertiary: "#8FCB9B", motif: "none", image: IMG("skin_easter") },
  { key: "plain", label: "Plain", primary: "#4C6FFF", secondary: "#5B6472", tertiary: "#2FA3A9", motif: "none", image: null },
];

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(rgb) {
  return "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

function blend(a, b, t) {
  const f = Math.max(0, Math.min(1, t));
  return rgbToHex([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * f));
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastOn(hex) {
  return luminance(hex) > 0.5 ? "#1B1B1E" : "#FFFFFF";
}

function lightScheme(skin) {
  const p = hexToRgb(skin.primary);
  const s = hexToRgb(skin.secondary);
  const t = hexToRgb(skin.tertiary);
  return {
    "--primary": skin.primary,
    "--on-primary": contrastOn(skin.primary),
    "--primary-container": blend(p, WHITE, 0.8),
    "--on-primary-container": blend(p, BLACK, 0.45),
    "--secondary": skin.secondary,
    "--on-secondary": contrastOn(skin.secondary),
    "--secondary-container": blend(s, WHITE, 0.82),
    "--on-secondary-container": blend(s, BLACK, 0.45),
    "--tertiary": skin.tertiary,
    "--on-tertiary": contrastOn(skin.tertiary),
    "--tertiary-container": blend(t, WHITE, 0.8),
    "--on-tertiary-container": blend(t, BLACK, 0.45),
    "--bg": blend(p, WHITE, 0.95),
    "--on-bg": "#1C1B1F",
    "--surface": "#FFFFFF",
    "--on-surface": "#1C1B1F",
    "--surface-variant": blend(p, WHITE, 0.9),
    "--on-surface-variant": blend(p, BLACK, 0.42),
    "--outline": blend(p, WHITE, 0.58),
    "--outline-variant": blend(p, WHITE, 0.78),
  };
}

function darkScheme(skin) {
  const p = hexToRgb(skin.primary);
  const s = hexToRgb(skin.secondary);
  const t = hexToRgb(skin.tertiary);
  return {
    "--primary": blend(p, WHITE, 0.3),
    "--on-primary": blend(p, BLACK, 0.72),
    "--primary-container": blend(p, BLACK, 0.52),
    "--on-primary-container": blend(p, WHITE, 0.78),
    "--secondary": blend(s, WHITE, 0.55),
    "--on-secondary": blend(s, BLACK, 0.7),
    "--secondary-container": blend(s, BLACK, 0.58),
    "--on-secondary-container": blend(s, WHITE, 0.82),
    "--tertiary": blend(t, WHITE, 0.45),
    "--on-tertiary": blend(t, BLACK, 0.7),
    "--tertiary-container": blend(t, BLACK, 0.55),
    "--on-tertiary-container": blend(t, WHITE, 0.8),
    "--bg": blend(p, BLACK, 0.9),
    "--on-bg": blend(p, WHITE, 0.92),
    "--surface": blend(p, BLACK, 0.85),
    "--on-surface": blend(p, WHITE, 0.94),
    "--surface-variant": blend(p, BLACK, 0.76),
    "--on-surface-variant": blend(p, WHITE, 0.72),
    "--outline": blend(p, WHITE, 0.38),
    "--outline-variant": blend(p, BLACK, 0.64),
  };
}

export function resolveDark(brightness) {
  if (brightness === "dark") return true;
  if (brightness === "light") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(skinKey, brightness) {
  const skin = SKINS.find((s) => s.key === skinKey) || SKINS[0];
  const dark = resolveDark(brightness);
  const scheme = dark ? darkScheme(skin) : lightScheme(skin);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(scheme)) root.style.setProperty(k, v);
  root.dataset.dark = dark ? "1" : "0";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", scheme["--bg"]);
}
