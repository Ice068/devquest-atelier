/**
 * Visual FX, Toast Rack, Confetti Physics & Live DOM X-Ray Renderer
 */

const SEMANTIC_TAGS = new Set([
  "HEADER",
  "NAV",
  "MAIN",
  "ARTICLE",
  "SECTION",
  "ASIDE",
  "FOOTER",
  "FIGURE",
  "FIGCAPTION",
  "DETAILS",
  "SUMMARY",
  "TIME",
  "MARK",
]);

export function showToast(message) {
  const rack = document.getElementById("toast-rack");
  if (!rack) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  rack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    el.style.transition = "all 0.2s ease";
    setTimeout(() => el.remove(), 220);
  }, 2800);
}

export function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#ff4d2a", "#1f47ff", "#c9f642", "#f5a524", "#161513"];
  const pieces = Array.from({ length: 90 }, () => ({
    x: canvas.width * (0.3 + Math.random() * 0.4),
    y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 12 - 4,
    size: 6 + Math.random() * 7,
    rot: Math.random() * Math.PI * 2,
    vrot: (Math.random() - 0.5) * 0.25,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1,
  }));

  let frame = 0;
  function step() {
    frame += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.36;
      p.rot += p.vrot;
      p.life -= 0.012;
      if (p.life > 0 && p.y < canvas.height + 40) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }
    }
    if (alive && frame < 140) {
      requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(step);
}

/**
 * Safely renders a live DOM X-Ray tree using DOM nodes (no innerHTML injection)
 */
export function renderDomXray(htmlString, container) {
  container.innerHTML = "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString || "", "text/html");

  const root = document.createElement("div");
  root.className = "dom-xray-tree";

  function buildNode(el, depth = 0) {
    if (depth > 8) return null;
    const wrap = document.createElement("div");
    if (depth > 0) wrap.className = "xray-node";

    const line = document.createElement("div");
    const tagSpan = document.createElement("span");
    tagSpan.className = SEMANTIC_TAGS.has(el.tagName) ? "xray-tag semantic" : "xray-tag";
    tagSpan.textContent = `<${el.tagName.toLowerCase()}>`;
    line.appendChild(tagSpan);

    for (const attr of Array.from(el.attributes).slice(0, 4)) {
      const aSpan = document.createElement("span");
      aSpan.className = "xray-attr";
      const shortVal = attr.value.length > 22 ? `${attr.value.slice(0, 22)}…` : attr.value;
      aSpan.textContent = `${attr.name}="${shortVal}"`;
      line.appendChild(aSpan);
    }

    const directText = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();

    if (directText) {
      const tSpan = document.createElement("span");
      tSpan.style.marginLeft = "6px";
      tSpan.style.opacity = "0.7";
      tSpan.textContent = `"${directText.length > 28 ? `${directText.slice(0, 28)}…` : directText}"`;
      line.appendChild(tSpan);
    }

    wrap.appendChild(line);

    for (const child of Array.from(el.children)) {
      const childEl = buildNode(child, depth + 1);
      if (childEl) wrap.appendChild(childEl);
    }
    return wrap;
  }

  const children = Array.from(doc.body.children);
  if (children.length === 0) {
    const empty = document.createElement("p");
    empty.style.opacity = "0.7";
    empty.textContent = "พิมพ์แท็ก HTML ใน Editor เพื่อดูโครงสร้าง DOM Tree แบบเรียลไทม์...";
    root.appendChild(empty);
  } else {
    for (const child of children) {
      const built = buildNode(child, 0);
      if (built) root.appendChild(built);
    }
  }
  container.appendChild(root);
}

/**
 * Wrap learner HTML inside a clean, sandboxed preview document
 */
export function buildPreviewSrcDoc(htmlCode) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<style>
  body {
    font-family: 'Plus Jakarta Sans', 'IBM Plex Sans Thai', system-ui, sans-serif;
    padding: 18px;
    margin: 0;
    color: #161513;
    background: #ffffff;
    line-height: 1.6;
  }
  img { max-width: 100%; border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th, td { border: 1.5px solid #161513; padding: 8px 10px; text-align: left; }
  th { background: #f6f2ea; }
  header, nav, main, article, section, aside, footer {
    border: 1px dashed rgba(31,71,255,0.28);
    padding: 8px 12px;
    margin: 6px 0;
    border-radius: 6px;
  }
  form { display: flex; flex-direction: column; gap: 8px; max-width: 420px; }
  input, textarea, select, button {
    font: inherit; padding: 8px 10px; border: 1.5px solid #161513; border-radius: 6px;
  }
  button { background: #ff4d2a; color: #fff; font-weight: 700; cursor: pointer; }
</style>
</head>
<body>${htmlCode || ""}</body>
</html>`;
}
