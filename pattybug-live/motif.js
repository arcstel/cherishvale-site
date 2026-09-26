function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BLACK = "rgba(32,32,31,0.62)";

function ladybug(ctx, x, y, r, variant) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((variant - 1.5) * 0.15);
  ctx.fillStyle = "rgba(226,58,78,0.62)";
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BLACK;
  ctx.beginPath();
  ctx.arc(0, -r * 0.85, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BLACK;
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.lineTo(0, r * 0.8);
  ctx.stroke();
  ctx.fillStyle = BLACK;
  [[-0.45, -0.2], [0.45, -0.2], [-0.4, 0.45], [0.4, 0.45]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx * r, dy * r, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = BLACK;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, -r * 1.15);
  ctx.lineTo(-r * 0.45, -r * 1.5);
  ctx.moveTo(r * 0.2, -r * 1.15);
  ctx.lineTo(r * 0.45, -r * 1.5);
  ctx.stroke();
  ctx.restore();
}

function pumpkin(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(91,127,58,0.6)";
  ctx.fillRect(-r * 0.12, -r * 1.35, r * 0.24, r * 0.5);
  ctx.fillStyle = "rgba(240,124,30,0.6)";
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.05, r * 1.05, r * 0.95, 0, 0, Math.PI * 2);
  ctx.ellipse(0, -r * 0.05, r * 0.75, r * 1.0, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(58,36,16,0.55)";
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.35);
  ctx.lineTo(-r * 0.15, -r * 0.35);
  ctx.lineTo(-r * 0.35, r * 0.02);
  ctx.closePath();
  ctx.moveTo(r * 0.15, -r * 0.35);
  ctx.lineTo(r * 0.55, -r * 0.35);
  ctx.lineTo(r * 0.35, r * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(58,36,16,0.55)";
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.3);
  ctx.quadraticCurveTo(-r * 0.25, r * 0.55, 0, r * 0.32);
  ctx.quadraticCurveTo(r * 0.25, r * 0.55, r * 0.5, r * 0.3);
  ctx.stroke();
  ctx.restore();
}

function heart(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(229,87,126,0.6)";
  ctx.beginPath();
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.55, -r * 0.9, 0, -r * 0.35);
  ctx.bezierCurveTo(r * 0.55, -r * 0.9, r * 1.3, -r * 0.1, 0, r * 0.9);
  ctx.fill();
  ctx.restore();
}

function star(ctx, x, y, r, points) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(233,196,106,0.6)";
  ctx.beginPath();
  const inner = r * 0.45;
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const ang = (-90 + (i * 180) / points) * (Math.PI / 180);
    const px = rad * Math.cos(ang);
    const py = rad * Math.sin(ang);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function flower(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(231,169,198,0.62)";
  for (let i = 0; i < 6; i++) {
    const ang = (i * 60 * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(r * 0.6 * Math.cos(ang), r * 0.6 * Math.sin(ang), r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(242,193,78,0.7)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function sparkle(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(243,183,208,0.7)";
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.18, -r * 0.18, r, 0);
  ctx.quadraticCurveTo(r * 0.18, r * 0.18, 0, r);
  ctx.quadraticCurveTo(-r * 0.18, r * 0.18, -r, 0);
  ctx.quadraticCurveTo(-r * 0.18, -r * 0.18, 0, -r);
  ctx.fill();
  ctx.restore();
}

function paw(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.25, r * 0.6, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  [[-0.62, -0.55], [-0.2, -0.8], [0.2, -0.8], [0.62, -0.55]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(dx * r, dy * r, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function catFace(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(90,70,50,0.68)";
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, -r * 0.45);
  ctx.lineTo(-r * 0.95, -r * 1.35);
  ctx.lineTo(-r * 0.2, -r * 0.95);
  ctx.closePath();
  ctx.moveTo(r * 0.85, -r * 0.45);
  ctx.lineTo(r * 0.95, -r * 1.35);
  ctx.lineTo(r * 0.2, -r * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(231,211,179,0.7)";
  ctx.beginPath();
  ctx.arc(0, -r * 0.05, r * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(90,70,50,0.68)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.18, r * 0.5, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(91,141,239,0.85)";
  ctx.beginPath();
  ctx.arc(-r * 0.38, -r * 0.32, r * 0.18, 0, Math.PI * 2);
  ctx.arc(r * 0.38, -r * 0.32, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(231,169,198,0.75)";
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, r * 0.05);
  ctx.lineTo(r * 0.1, r * 0.05);
  ctx.lineTo(0, r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(90,70,50,0.6)";
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, r * 0.15);
  ctx.lineTo(-r * 0.35, r * 0.28);
  ctx.moveTo(r * 0.9, r * 0.15);
  ctx.lineTo(r * 0.35, r * 0.28);
  ctx.stroke();
  ctx.restore();
}

function dogFace(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(215,222,232,0.72)";
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, -r * 0.55);
  ctx.lineTo(-r * 0.55, -r * 1.45);
  ctx.lineTo(-r * 0.05, -r * 0.8);
  ctx.closePath();
  ctx.moveTo(r * 0.75, -r * 0.55);
  ctx.lineTo(r * 0.55, -r * 1.45);
  ctx.lineTo(r * 0.05, -r * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(247,247,245,0.8)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(43,43,43,0.75)";
  ctx.beginPath();
  ctx.arc(0, r * 0.08, r * 0.16, 0, Math.PI * 2);
  ctx.arc(-r * 0.36, -r * 0.28, r * 0.09, 0, Math.PI * 2);
  ctx.arc(r * 0.36, -r * 0.28, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(231,154,169,0.8)";
  ctx.beginPath();
  ctx.moveTo(-r * 0.22, r * 0.42);
  ctx.quadraticCurveTo(0, r * 0.8, r * 0.22, r * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function cheetahField(ctx, W, H) {
  ctx.fillStyle = "#D9B679";
  ctx.fillRect(0, 0, W, H);
  const rand = rng(99);
  const spot = "rgba(74,48,22,0.92)";
  const count = Math.max(40, Math.min(700, Math.round((W * H) / (120 * 120))));
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = Math.min(W, H) * (0.008 + rand() * 0.014);
    const blobs = 2 + Math.floor(rand() * 3);
    ctx.fillStyle = spot;
    for (let b = 0; b < blobs; b++) {
      const ox = (rand() - 0.5) * r * 2.2;
      const oy = (rand() - 0.5) * r * 2.2;
      ctx.beginPath();
      ctx.ellipse(x + ox, y + oy, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawMotifBackground(canvas, motif, background) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(W * dpr));
  canvas.height = Math.max(1, Math.round(H * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  if (motif === "cheetah") {
    cheetahField(ctx, W, H);
    return;
  }
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, H);
  if (motif === "none") return;

  const rand = rng(motif.length * 53 + 7);
  const count = motif === "cats" || motif === "dogs" ? 18 : motif === "pumpkins" ? 16 : 26;
  const unit = Math.min(W, H);
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = unit * 0.05 * (0.6 + rand() * 0.8);
    const variant = Math.floor(rand() * 4);
    switch (motif) {
      case "ladybugs": ladybug(ctx, x, y, r, variant); break;
      case "sparkles": sparkle(ctx, x, y, r); break;
      case "pumpkins": pumpkin(ctx, x, y, r); break;
      case "hearts": heart(ctx, x, y, r); break;
      case "stars": star(ctx, x, y, r, 5); break;
      case "flowers": flower(ctx, x, y, r); break;
      case "cats":
        if (variant < 3) catFace(ctx, x, y, r);
        else paw(ctx, x, y, r * 0.9, "rgba(156,123,214,0.55)");
        break;
      case "dogs":
        if (variant < 3) dogFace(ctx, x, y, r);
        else paw(ctx, x, y, r * 0.9, "rgba(126,143,168,0.55)");
        break;
      default: break;
    }
  }
}
