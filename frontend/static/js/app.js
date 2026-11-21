import { api, getToken, setToken } from "./api.js";
import { QUESTS, SIMCODE_PRESETS } from "./curriculum.js";
import { buildPreviewSrcDoc, launchConfetti, renderDomXray, showToast } from "./fx.js";
import { sound } from "./sound.js";

const state = {
  user: null,
  guestMode: false,
  authMode: "login",
  activeView: "auth",
  activeQuest: QUESTS[0],
  lastBossPassedCount: 0,
  simViewport: "desktop",
};

const $ = (id) => document.getElementById(id);

function getRankTitle(exp) {
  if (exp >= 1500) return "Grandmaster of DOM";
  if (exp >= 900) return "Semantic Architect";
  if (exp >= 450) return "Markup Cartographer";
  if (exp >= 150) return "HTML Journeyman";
  return "Apprentice Typesetter";
}

function isQuestUnlocked(quest) {
  if (quest.index === 1) return true;
  const completed = state.user?.completed_quests || [];
  const prev = QUESTS.find((q) => q.index === quest.index - 1);
  return Boolean(prev && completed.includes(prev.id));
}

function getNextQuest() {
  const completed = state.user?.completed_quests || [];
  return QUESTS.find((q) => !completed.includes(q.id)) || QUESTS[QUESTS.length - 1];
}

/* ==================== THEME & SOUND ==================== */
function initPreferences() {
  const savedTheme = localStorage.getItem("dq_theme") || "paper";
  if (savedTheme === "blueprint") {
    document.documentElement.setAttribute("data-theme", "blueprint");
  }
  $("sound-toggle").textContent = sound.enabled ? "🔊" : "🔇";

  $("theme-toggle").addEventListener("click", () => {
    sound.click();
    const isBp = document.documentElement.getAttribute("data-theme") === "blueprint";
    if (isBp) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("dq_theme", "paper");
      showToast("สลับเป็นโหมด Paper Atelier");
    } else {
      document.documentElement.setAttribute("data-theme", "blueprint");
      localStorage.setItem("dq_theme", "blueprint");
      showToast("สลับเป็นโหมด Midnight Blueprint");
    }
  });

  $("sound-toggle").addEventListener("click", () => {
    const on = sound.toggle();
    $("sound-toggle").textContent = on ? "🔊" : "🔇";
    showToast(on ? "เปิดเสียง Tactile FX" : "ปิดเสียง FX");
  });
}

/* ==================== NAVIGATION ==================== */
function showView(viewName) {
  state.activeView = viewName;
  ["auth", "atlas", "studio", "simcode", "progress"].forEach((v) => {
    $(`view-${v}`).classList.toggle("hidden", v !== viewName);
  });

  const authed = Boolean(state.user);
  $("main-nav").classList.toggle("hidden", !authed);
  $("user-exp-pill").classList.toggle("hidden", !authed);
  $("logout-btn").classList.toggle("hidden", !authed);

  document.querySelectorAll(".nav-pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  if (viewName === "atlas") {
    renderAtlas();
    loadLeaderboard();
  } else if (viewName === "studio") {
    openQuest(state.activeQuest);
  } else if (viewName === "progress") {
    renderProgressAnalytics();
  }
}

function updateTopbarTelemetry() {
  if (!state.user) return;
  const exp = state.user.exp || 0;
  $("nav-username").textContent = state.user.username;
  $("nav-exp-val").textContent = `${exp} EXP`;
  const pct = Math.min(100, Math.round((exp / 1800) * 100));
  $("nav-exp-fill").style.width = `${pct}%`;
}

/* ==================== LANDING TOY & AUTH ==================== */
function initLandingToy() {
  const editor = $("toy-editor");
  const iframe = $("toy-iframe");
  const update = () => {
    iframe.srcdoc = buildPreviewSrcDoc(editor.value);
  };
  editor.addEventListener("input", update);
  update();
}

function initAuth() {
  const tabLogin = $("tab-login");
  const tabSignup = $("tab-signup");
  const submitBtn = $("auth-submit-btn");
  const errBox = $("auth-error");

  const setMode = (mode) => {
    sound.click();
    state.authMode = mode;
    tabLogin.classList.toggle("active", mode === "login");
    tabSignup.classList.toggle("active", mode === "signup");
    submitBtn.textContent = mode === "login" ? "เข้าสู่สตูดิโอ →" : "สร้างบัญชีและเริ่มผจญภัย →";
    errBox.classList.add("hidden");
  };

  tabLogin.addEventListener("click", () => setMode("login"));
  tabSignup.addEventListener("click", () => setMode("signup"));

  $("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.classList.add("hidden");
    const username = $("auth-username").value.trim();
    const password = $("auth-password").value;
    submitBtn.disabled = true;
    try {
      const res =
        state.authMode === "login"
          ? await api.login(username, password)
          : await api.signup(username, password);
      setToken(res.access_token);
      state.user = res.user;
      state.guestMode = false;
      sound.victory();
      updateTopbarTelemetry();
      showToast(`ยินดีต้อนรับ ${res.user.username}!`);
      showView("atlas");
    } catch (err) {
      errBox.textContent = err.message || "ไม่สามารถเข้าสู่ระบบได้";
      errBox.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
    }
  });

  $("guest-btn").addEventListener("click", () => {
    sound.click();
    state.guestMode = true;
    const saved = JSON.parse(localStorage.getItem("dq_guest_user") || "null");
    state.user = saved || {
      id: "guest",
      username: "Guest_Atelier",
      exp: 0,
      completed_quests: [],
      solo_history: {},
      streak_days: 1,
    };
    updateTopbarTelemetry();
    showToast("เข้าสู่โหมดทดลอง (Guest) — บันทึกความคืบหน้าไว้ในเบราว์เซอร์");
    showView("atlas");
  });

  $("logout-btn").addEventListener("click", async () => {
    sound.click();
    if (!state.guestMode && getToken()) {
      try {
        await api.logout();
      } catch {
        // Ignore network errors on logout
      }
    }
    setToken("");
    state.user = null;
    state.guestMode = false;
    showView("auth");
    showToast("ออกจากระบบและเพิกถอนเซสชันแล้ว");
  });
}

/* ==================== EXPEDITION ATLAS & INTERACTIVE SVG MAP ==================== */
function renderAtlas() {
  if (!state.user) return;
  updateTopbarTelemetry();
  const completed = state.user.completed_quests || [];
  const exp = state.user.exp || 0;

  $("atlas-rank").textContent = getRankTitle(exp);
  $("stat-exp").textContent = String(exp);
  $("stat-cleared").textContent = `${completed.length}/${QUESTS.length}`;
  $("stat-streak").textContent = `${state.user.streak_days || 1} 🔥`;

  const next = getNextQuest();
  $("next-quest-title").textContent = next.title;
  $("next-quest-sub").textContent = `${next.act} · +${next.exp} EXP`;
  $("continue-quest-btn").onclick = () => {
    sound.click();
    state.activeQuest = next;
    showView("studio");
  };

  renderSvgMap(completed, next.id);
  renderChapterCards(completed);
}

function renderSvgMap(completed, nextId) {
  const svg = $("quest-map-svg");
  const ns = "http://www.w3.org/2000/svg";
  svg.innerHTML = "";

  // Build smooth path connecting all 14 quest nodes
  let d = `M ${QUESTS[0].x} ${QUESTS[0].y}`;
  for (let i = 1; i < QUESTS.length; i++) {
    const prev = QUESTS[i - 1];
    const curr = QUESTS[i];
    const mx = (prev.x + curr.x) / 2;
    d += ` Q ${mx} ${prev.y}, ${curr.x} ${curr.y}`;
  }

  const trail = document.createElementNS(ns, "path");
  trail.setAttribute("d", d);
  trail.setAttribute("class", "map-trail");
  svg.appendChild(trail);

  // Draw completed segments in Vermilion ink
  for (let i = 1; i < QUESTS.length; i++) {
    const prev = QUESTS[i - 1];
    const curr = QUESTS[i];
    if (completed.includes(prev.id)) {
      const seg = document.createElementNS(ns, "path");
      const mx = (prev.x + curr.x) / 2;
      seg.setAttribute("d", `M ${prev.x} ${prev.y} Q ${mx} ${prev.y}, ${curr.x} ${curr.y}`);
      seg.setAttribute("class", "map-trail-done");
      svg.appendChild(seg);
    }
  }

  // Draw nodes
  QUESTS.forEach((q) => {
    const done = completed.includes(q.id);
    const unlocked = isQuestUnlocked(q);
    const isCurrent = q.id === nextId;

    const g = document.createElementNS(ns, "g");
    g.setAttribute("class", `map-node ${unlocked ? "" : "locked"}`);
    g.setAttribute("transform", `translate(${q.x}, ${q.y})`);

    if (isCurrent) {
      const pulse = document.createElementNS(ns, "circle");
      pulse.setAttribute("r", q.type === "boss" ? "26" : "20");
      pulse.setAttribute("class", "node-pulse");
      g.appendChild(pulse);
    }

    const r = q.type === "boss" ? 23 : 17;
    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("r", String(r));
    circle.setAttribute("class", "node-body");
    circle.setAttribute("stroke", "var(--border-ink)");
    circle.setAttribute("stroke-width", "2.5");
    circle.setAttribute(
      "fill",
      done
        ? "var(--accent-chartreuse)"
        : q.type === "boss"
        ? "var(--accent-vermilion)"
        : isCurrent
        ? "var(--accent-cobalt)"
        : "var(--bg-surface)"
    );
    g.appendChild(circle);

    const text = document.createElementNS(ns, "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.setAttribute("font-family", "JetBrains Mono, monospace");
    text.setAttribute("font-weight", "800");
    text.setAttribute("font-size", q.type === "boss" ? "13" : "11");
    text.setAttribute(
      "fill",
      done
        ? "#192600"
        : q.type === "boss" || isCurrent
        ? "#ffffff"
        : "var(--ink-primary)"
    );
    text.textContent = done ? "✓" : q.type === "boss" ? "⚔" : String(q.index);
    g.appendChild(text);

    const lbl = document.createElementNS(ns, "text");
    lbl.setAttribute("y", String(r + 14));
    lbl.setAttribute("text-anchor", "middle");
    lbl.setAttribute("font-family", "JetBrains Mono, monospace");
    lbl.setAttribute("font-size", "9.5");
    lbl.setAttribute("font-weight", "700");
    lbl.setAttribute("fill", "var(--ink-secondary)");
    lbl.textContent = q.type === "boss" ? q.id.toUpperCase() : `L${q.index}`;
    g.appendChild(lbl);

    const titleEl = document.createElementNS(ns, "title");
    titleEl.textContent = `${q.title} (+${q.exp} EXP)`;
    g.appendChild(titleEl);

    if (unlocked) {
      g.addEventListener("click", () => {
        sound.click();
        state.activeQuest = q;
        showView("studio");
      });
    }
    svg.appendChild(g);
  });
}

function renderChapterCards(completed) {
  const grid = $("chapter-grid");
  grid.innerHTML = "";
  QUESTS.forEach((q) => {
    const done = completed.includes(q.id);
    const unlocked = isQuestUnlocked(q);
    const card = document.createElement("div");
    card.className = `quest-card ${q.type === "boss" ? "boss" : ""} ${done ? "completed" : ""} ${unlocked ? "" : "locked"}`;

    const top = document.createElement("div");
    const act = document.createElement("div");
    act.className = "mono";
    act.style.fontSize = "0.7rem";
    act.style.color = "var(--ink-muted)";
    act.textContent = q.act;

    const title = document.createElement("h4");
    title.style.margin = "4px 0";
    title.style.fontSize = "1rem";
    title.textContent = q.title;

    const sub = document.createElement("div");
    sub.style.fontSize = "0.8rem";
    sub.style.color = "var(--ink-secondary)";
    sub.textContent = q.subtitle;

    top.append(act, title, sub);

    const foot = document.createElement("div");
    foot.style.display = "flex";
    foot.style.justifyContent = "space-between";
    foot.style.alignItems = "center";

    const expBadge = document.createElement("span");
    expBadge.className = "badge";
    expBadge.textContent = `+${q.exp} EXP`;

    const status = document.createElement("span");
    status.className = "mono";
    status.style.fontSize = "0.72rem";
    status.textContent = done ? "★ ผ่านแล้ว" : unlocked ? "▶ เข้าเรียน" : "🔒 ล็อก";

    foot.append(expBadge, status);
    card.append(top, foot);

    if (unlocked) {
      card.addEventListener("click", () => {
        sound.click();
        state.activeQuest = q;
        showView("studio");
      });
    }
    grid.appendChild(card);
  });
}

async function loadLeaderboard() {
  const box = $("leaderboard-list");
  box.textContent = "กำลังโหลดอันดับ...";
  try {
    const rows = await api.leaderboard();
    box.innerHTML = "";
    if (!rows.length) {
      box.textContent = "ยังไม่มีผู้เล่นในกระดานอันดับ — สมัครสมาชิกเพื่อเป็นคนแรก!";
      return;
    }
    rows.forEach((row, idx) => {
      const div = document.createElement("div");
      div.className = `lb-row ${state.user && row.username === state.user.username ? "me" : ""}`;

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.alignItems = "center";
      left.style.gap = "10px";

      const rank = document.createElement("span");
      rank.className = "lb-rank";
      rank.textContent = String(idx + 1);

      const name = document.createElement("strong");
      name.textContent = row.username;

      left.append(rank, name);

      const right = document.createElement("span");
      right.className = "mono";
      right.style.fontWeight = "800";
      right.style.fontSize = "0.84rem";
      right.textContent = `${row.exp} EXP`;

      div.append(left, right);
      box.appendChild(div);
    });
  } catch {
    box.textContent = "เชื่อมต่อ Backend ไม่สำเร็จ (ใช้งานแบบออฟไลน์ได้)";
  }
}

/* ==================== CODING STUDIO ==================== */
function updateLineNumbers(textarea, lineBox) {
  const count = Math.max(1, textarea.value.split("\n").length);
  lineBox.textContent = Array.from({ length: count }, (_, i) => i + 1).join("\n");
}

function openQuest(quest) {
  state.activeQuest = quest;
  state.lastBossPassedCount = 0;

  $("studio-act-badge").textContent = quest.act;
  $("studio-quest-title").textContent = quest.title;
  $("studio-exp-badge").textContent = `+${quest.exp} EXP`;
  $("studio-brief").textContent = quest.brief;

  const isBoss = quest.type === "boss";
  $("boss-hp-box").classList.toggle("hidden", !isBoss);

  const savedDraft = localStorage.getItem(`dq_code_${quest.id}`);
  const editor = $("studio-editor");
  editor.value = savedDraft !== null ? savedDraft : quest.starterCode;
  updateLineNumbers(editor, $("studio-lines"));

  // Quick snippet chips
  const snipBar = $("snippet-bar");
  snipBar.innerHTML = "";
  quest.snippets.forEach((snip) => {
    const btn = document.createElement("button");
    btn.className = "snippet-chip";
    btn.type = "button";
    btn.textContent = snip.split("\n")[0].slice(0, 22);
    btn.addEventListener("click", () => {
      sound.click();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = `${editor.value.slice(0, start)}${snip}\n${editor.value.slice(end)}`;
      editor.focus();
      onStudioCodeChange();
    });
    snipBar.appendChild(btn);
  });

  renderSoloLadder(quest);
  resetAiPanel();
  onStudioCodeChange();
}

function renderSoloLadder(quest) {
  const ladder = $("solo-ladder");
  ladder.innerHTML = "";
  quest.soloHints.forEach((item, idx) => {
    const step = document.createElement("div");
    step.className = "solo-step";

    const head = document.createElement("button");
    head.className = "solo-step-head";
    head.type = "button";
    head.textContent = `${item.labelTh} (${item.level})`;

    const body = document.createElement("div");
    body.className = `solo-step-body ${idx === 0 ? "" : "hidden"}`;

    const p = document.createElement("div");
    p.textContent = item.hint;
    body.appendChild(p);

    if (item.diagram) {
      const pre = document.createElement("div");
      pre.className = "solo-diagram";
      pre.textContent = item.diagram;
      body.appendChild(pre);
    }

    head.addEventListener("click", () => {
      sound.hint();
      body.classList.toggle("hidden");
    });

    step.append(head, body);
    ladder.appendChild(step);
  });
}

function resetAiPanel() {
  $("ai-solo-level").textContent = "พร้อมวิเคราะห์โค้ดของคุณ";
  $("ai-score").textContent = "—";
  $("ai-response-box").textContent =
    "กดปุ่มด้านล่างเพื่อให้ AI SOLO Coach ตรวจโครงสร้าง DOM, แท็กตกหล่น และให้คำแนะนำแบบไม่เฉลยตรง ๆ";
  $("ai-engine-tag").textContent = "";
}

function onStudioCodeChange() {
  const editor = $("studio-editor");
  const code = editor.value;
  localStorage.setItem(`dq_code_${state.activeQuest.id}`, code);
  updateLineNumbers(editor, $("studio-lines"));

  // Update sandboxed live preview & DOM X-Ray
  $("studio-preview").srcdoc = buildPreviewSrcDoc(code);
  renderDomXray(code, $("preview-xray-pane"));

  // Evaluate mission objectives
  const objList = $("studio-objectives");
  objList.innerHTML = "";
  let passed = 0;

  state.activeQuest.checks.forEach((chk) => {
    const ok = Boolean(chk.test(code));
    if (ok) passed += 1;

    const li = document.createElement("li");
    li.className = `objective-item ${ok ? "pass" : ""}`;

    const box = document.createElement("span");
    box.className = "obj-check";
    box.textContent = ok ? "✓" : "";

    const txt = document.createElement("span");
    txt.textContent = chk.label;

    li.append(box, txt);
    objList.appendChild(li);
  });

  // Update Boss HP bar
  if (state.activeQuest.type === "boss") {
    const total = state.activeQuest.checks.length;
    const hpPct = Math.max(0, Math.round(((total - passed) / total) * 100));
    $("boss-hp-fill").style.width = `${hpPct}%`;
    $("boss-hp-text").textContent = `${hpPct}%`;
    if (passed > state.lastBossPassedCount) {
      sound.bossHit();
      const box = $("boss-hp-box");
      box.classList.remove("shake-hit");
      void box.offsetWidth;
      box.classList.add("shake-hit");
    }
    state.lastBossPassedCount = passed;
  }
}

async function verifyActiveQuest() {
  const q = state.activeQuest;
  const code = $("studio-editor").value;
  const allPassed = q.checks.every((chk) => chk.test(code));

  if (!allPassed) {
    sound.bossHit();
    showToast("ยังมีภารกิจบางข้อไม่ครบ — ลองเปิด SOLO Hints หรือถาม AI Coach ดูนะ!");
    return;
  }

  let soloLevel = "Relational";
  try {
    const ai = await api.soloAnalyze({
      code,
      quest_title: q.title,
      quest_goal: q.brief,
      required_tags: q.requiredTags,
    });
    soloLevel = ai.solo_level;
  } catch {
    // Fallback gracefully
  }

  let awarded = 0;
  if (state.guestMode) {
    const completed = state.user.completed_quests || [];
    if (!completed.includes(q.id)) {
      completed.push(q.id);
      state.user.completed_quests = completed;
      state.user.exp = (state.user.exp || 0) + q.exp;
      awarded = q.exp;
    }
    state.user.solo_history = { ...(state.user.solo_history || {}), [q.id]: soloLevel };
    localStorage.setItem("dq_guest_user", JSON.stringify(state.user));
  } else {
    try {
      const res = await api.completeQuest(q.id, q.exp, soloLevel);
      state.user = res.user;
      awarded = res.awarded_exp;
    } catch (err) {
      showToast(`บันทึกคะแนนไม่สำเร็จ: ${err.message}`);
      return;
    }
  }

  updateTopbarTelemetry();
  sound.victory();
  launchConfetti();

  $("stamp-seal").textContent = q.type === "boss" ? "BOSS DEFEATED" : "QUEST CLEARED";
  $("stamp-title").textContent = `${q.title}`;
  $("stamp-desc").textContent =
    awarded > 0
      ? `คุณได้รับ +${awarded} EXP และผ่านในระดับ SOLO: ${soloLevel}!`
      : `ผ่านภารกิจซ้ำอย่างสวยงาม! ระดับ SOLO ล่าสุด: ${soloLevel}`;
  $("stamp-overlay").classList.remove("hidden");
}

async function runAiCoach(code, questTitle, questGoal, requiredTags, question = "") {
  const btn = $("ai-run-btn");
  btn.disabled = true;
  $("ai-response-box").textContent = "กำลังวิเคราะห์โครงสร้าง DOM และประเมินระดับ SOLO...";
  try {
    const res = await api.soloAnalyze({
      code,
      quest_title: questTitle,
      quest_goal: questGoal,
      required_tags: requiredTags,
      user_question: question || null,
    });
    sound.hint();
    $("ai-solo-level").textContent = `${res.solo_level} (${res.solo_label_th})`;
    $("ai-score").textContent = `${res.structure_score}/100`;
    const tips = res.suggestions.map((s) => `• ${s}`).join("\n");
    $("ai-response-box").textContent = `${res.mentor_message}\n\n🔍 จุดที่ตรวจพบ:\n${tips}`;
    $("ai-engine-tag").textContent = `Engine: ${res.engine} · Tags: ${res.tag_count} · Depth: ${res.nesting_depth}`;
  } catch (err) {
    $("ai-response-box").textContent = `เชื่อมต่อ AI Coach ไม่ได้: ${err.message}`;
  } finally {
    btn.disabled = false;
  }
}

/* ==================== SIMCODE PLAYGROUND ==================== */
function initSimCode() {
  const editor = $("sim-editor");
  const preview = $("sim-preview");
  const xray = $("sim-xray-pane");

  const update = () => {
    updateLineNumbers(editor, $("sim-lines"));
    preview.srcdoc = buildPreviewSrcDoc(editor.value);
    renderDomXray(editor.value, xray);
  };

  editor.value = SIMCODE_PRESETS.editorial.code;
  editor.addEventListener("input", update);
  update();

  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sound.click();
      const preset = SIMCODE_PRESETS[btn.dataset.preset];
      if (preset) {
        editor.value = preset.code;
        update();
        showToast(`โหลดเทมเพลต: ${preset.name}`);
      }
    });
  });

  document.querySelectorAll("[data-vp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sound.click();
      preview.classList.remove("vp-tablet", "vp-mobile");
      if (btn.dataset.vp === "tablet") preview.classList.add("vp-tablet");
      if (btn.dataset.vp === "mobile") preview.classList.add("vp-mobile");
    });
  });

  document.querySelectorAll("[data-sim-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sound.click();
      document.querySelectorAll("[data-sim-tab]").forEach((b) => b.classList.toggle("active", b === btn));
      $("sim-browser-pane").classList.toggle("hidden", btn.dataset.simTab !== "browser");
      $("sim-xray-pane").classList.toggle("hidden", btn.dataset.simTab !== "xray");
    });
  });

  $("sim-export-btn").addEventListener("click", () => {
    sound.click();
    const blob = new Blob([buildPreviewSrcDoc(editor.value)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devquest-atelier-creation.html";
    a.click();
    URL.revokeObjectURL(url);
    showToast("ส่งออกไฟล์ HTML เรียบร้อย!");
  });

  $("sim-ai-btn").addEventListener("click", async () => {
    sound.click();
    try {
      const res = await api.soloAnalyze({
        code: editor.value,
        quest_title: "SimCode Freeform Audit",
        quest_goal: "ตรวจความสะอาด Semantic HTML และ Accessibility",
        required_tags: ["main", "article", "h1"],
      });
      showToast(`SOLO: ${res.solo_level} · Structure Score ${res.structure_score}/100`);
    } catch {
      showToast("ไม่สามารถเชื่อมต่อ AI Audit ได้ในขณะนี้");
    }
  });
}

/* ==================== SOLO ANALYTICS ==================== */
function renderProgressAnalytics() {
  const history = state.user?.solo_history || {};
  const counts = {
    "Pre-structural": 0,
    "Uni-structural": 0,
    "Multi-structural": 0,
    Relational: 0,
    "Extended Abstract": 0,
  };
  Object.values(history).forEach((lvl) => {
    if (lvl in counts) counts[lvl] += 1;
  });

  const maxVal = Math.max(1, ...Object.values(counts));
  const chartBox = $("solo-chart-box");
  chartBox.innerHTML = "";

  Object.entries(counts).forEach(([lvl, val]) => {
    const row = document.createElement("div");
    row.style.marginBottom = "12px";

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.fontSize = "0.84rem";
    head.style.fontWeight = "700";
    head.style.marginBottom = "4px";
    head.innerHTML = "";
    const lSpan = document.createElement("span");
    lSpan.textContent = lvl;
    const vSpan = document.createElement("span");
    vSpan.className = "mono";
    vSpan.textContent = `${val} ด่าน`;
    head.append(lSpan, vSpan);

    const track = document.createElement("div");
    track.style.height = "14px";
    track.style.border = "1.5px solid var(--border-ink)";
    track.style.borderRadius = "6px";
    track.style.background = "var(--bg-well)";
    track.style.overflow = "hidden";

    const fill = document.createElement("div");
    fill.style.height = "100%";
    fill.style.width = `${Math.round((val / maxVal) * 100)}%`;
    fill.style.background = lvl === "Extended Abstract" ? "var(--accent-chartreuse)" : "var(--accent-cobalt)";
    fill.style.transition = "width 0.5s ease";

    track.appendChild(fill);
    row.append(head, track);
    chartBox.appendChild(row);
  });

  const stampsBox = $("stamps-box");
  stampsBox.innerHTML = "";
  const completed = state.user?.completed_quests || [];
  if (!completed.length) {
    stampsBox.textContent = "ยังไม่มีตราประทับ — ผ่านภารกิจแรกเพื่อสะสมตราประทับ!";
    return;
  }
  completed.forEach((qid) => {
    const q = QUESTS.find((item) => item.id === qid);
    if (!q) return;
    const badge = document.createElement("span");
    badge.className = q.type === "boss" ? "badge badge-vermilion" : "badge badge-chartreuse";
    badge.textContent = `${q.type === "boss" ? "⚔️" : "✓"} ${q.title}`;
    stampsBox.appendChild(badge);
  });
}

/* ==================== WIRE STUDIO EVENTS ==================== */
function initStudioEvents() {
  const editor = $("studio-editor");
  editor.addEventListener("input", onStudioCodeChange);
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value = `${editor.value.slice(0, s)}  ${editor.value.slice(editor.selectionEnd)}`;
      editor.selectionStart = editor.selectionEnd = s + 2;
      onStudioCodeChange();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      verifyActiveQuest();
    }
  });

  $("studio-verify-btn").addEventListener("click", verifyActiveQuest);
  $("studio-reset-btn").addEventListener("click", () => {
    sound.click();
    editor.value = state.activeQuest.starterCode;
    onStudioCodeChange();
    showToast("รีเซ็ตโค้ดเริ่มต้นแล้ว");
  });

  $("back-to-atlas-btn").addEventListener("click", () => {
    sound.click();
    showView("atlas");
  });

  const switchStudioTab = (tabName) => {
    sound.click();
    document.querySelectorAll("[data-studio-tab]").forEach((b) =>
      b.classList.toggle("active", b.dataset.studioTab === tabName)
    );
    ["mission", "solo", "ai"].forEach((t) => {
      $(`studio-tab-${t}`).classList.toggle("hidden", t !== tabName);
    });
  };

  document.querySelectorAll("[data-studio-tab]").forEach((btn) => {
    btn.addEventListener("click", () => switchStudioTab(btn.dataset.studioTab));
  });

  document.querySelectorAll("[data-preview-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sound.click();
      document.querySelectorAll("[data-preview-tab]").forEach((b) =>
        b.classList.toggle("active", b === btn)
      );
      $("preview-browser-pane").classList.toggle("hidden", btn.dataset.previewTab !== "browser");
      $("preview-xray-pane").classList.toggle("hidden", btn.dataset.previewTab !== "xray");
    });
  });

  $("studio-ai-quick-btn").addEventListener("click", () => {
    switchStudioTab("ai");
    runAiCoach(
      editor.value,
      state.activeQuest.title,
      state.activeQuest.brief,
      state.activeQuest.requiredTags,
      $("ai-question-input").value.trim()
    );
  });

  $("ai-run-btn").addEventListener("click", () => {
    runAiCoach(
      editor.value,
      state.activeQuest.title,
      state.activeQuest.brief,
      state.activeQuest.requiredTags,
      $("ai-question-input").value.trim()
    );
  });

  $("stamp-close-btn").addEventListener("click", () => {
    sound.click();
    $("stamp-overlay").classList.add("hidden");
  });

  $("stamp-next-btn").addEventListener("click", () => {
    sound.click();
    $("stamp-overlay").classList.add("hidden");
    const next = getNextQuest();
    state.activeQuest = next;
    openQuest(next);
  });

  $("refresh-lb-btn").addEventListener("click", () => {
    sound.click();
    loadLeaderboard();
  });

  document.querySelectorAll(".nav-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      sound.click();
      showView(btn.dataset.view);
    });
  });

  $("brand-home-btn").addEventListener("click", () => {
    sound.click();
    showView(state.user ? "atlas" : "auth");
  });
}

/* ==================== BOOTSTRAP ==================== */
async function boot() {
  initPreferences();
  initLandingToy();
  initAuth();
  initStudioEvents();
  initSimCode();

  if (getToken()) {
    try {
      state.user = await api.me();
      updateTopbarTelemetry();
      showView("atlas");
      return;
    } catch {
      setToken("");
    }
  }
  showView("auth");
}

boot();
