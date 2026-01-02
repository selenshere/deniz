/* global API_BASE_URL, ENDPOINT_CANDIDATES */

(() => {
  const $ = (id) => document.getElementById(id);

  const FIXED_VIDEO_URL = 'https://youtu.be/WFr9mYUiRy8';
  const FIXED_INSTRUCTION = 'Videodaki öğrencinin düşünmesini dikkate alma, yorumlama ve karar verme başlıklarında yazın. Mentor ile çok turlu sohbet ederek geri bildirim alın. Süreç bitince Kaydet ve İndir.';

  const els = {
    firstName: $("firstName"),
    lastName: $("lastName"),
    videoWrap: $("videoWrap"),
    attention: $("attention"),
    interpretation: $("interpretation"),
    decision: $("decision"),
    startMentorBtn: $("startMentorBtn"),
    clearBtn: $("clearBtn"),
    status: $("status"),
    chat: $("chat"),
    chatInput: $("chatInput"),
    sendBtn: $("sendBtn"),
    saveBtn: $("saveBtn")
  };

  // --- state ---
  let chatHistory = []; // {role:'user'|'mentor', content:'', ts:''}

  // --- helpers ---
  function setStatus(msg, tone = "info") {
    const prefix =
      tone === "ok" ? "✅ " : tone === "warn" ? "⚠️ " : tone === "err" ? "⛔ " : "ℹ️ ";
    if (els.status) els.status.textContent = prefix + msg;
  }

  function isValidName() {
    return (els.firstName?.value || "").trim().length > 0 && (els.lastName?.value || "").trim().length > 0;
  }

  function areObservationsComplete() {
    const a = (els.attention?.value || "").trim();
    const i = (els.interpretation?.value || "").trim();
    const d = (els.decision?.value || "").trim();
    return a.length > 0 && i.length > 0 && d.length > 0;
  }

  function sanitizeFilenamePart(s) {
    return (
      (s || "")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_\-çğıöşü]/gi, "")
        .slice(0, 40) || "kullanici"
    );
  }

  function toYouTubeEmbed(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) {
        const id = u.pathname.replace("/", "");
        return `https://www.youtube.com/embed/${id}`;
      }
      if (u.hostname.includes("youtube.com")) {
        const id = u.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
        if (u.pathname.startsWith("/embed/")) return url;
      }
    } catch (_) {}
    return null;
  }

  function renderVideo() {
    if (!els.videoWrap) return;
    els.videoWrap.innerHTML = "";
    const yt = toYouTubeEmbed(FIXED_VIDEO_URL);
    const src = yt || FIXED_VIDEO_URL;

    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    els.videoWrap.appendChild(iframe);
  }

  function renderChat() {
    if (!els.chat) return;
    els.chat.innerHTML = "";
    for (const m of chatHistory) {
      const div = document.createElement("div");
      div.className = "msg " + (m.role === "user" ? "user" : "mentor");

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = (m.role === "user" ? "Siz" : "Mentor") + " • " + new Date(m.ts).toLocaleString();

      const body = document.createElement("div");
      body.textContent = m.content;

      div.appendChild(meta);
      div.appendChild(body);
      els.chat.appendChild(div);
    }
    els.chat.scrollTop = els.chat.scrollHeight;
  }

  function pushMsg(role, content) {
    chatHistory.push({ role, content, ts: new Date().toISOString() });
    renderChat();
  }

  async function postJson(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}
    return { ok: res.ok, status: res.status, data, text };
  }

  async function tryMentorFeedback(payload) {
    const errors = [];
    for (const ep of ENDPOINT_CANDIDATES) {
      const full = API_BASE_URL.replace(/\/$/, "") + ep;
      try {
        const r = await postJson(full, payload);
        if (r.ok) {
          const fb =
            (r.data && (r.data.feedback || r.data.output || r.data.message || r.data.text)) ||
            (typeof r.data === "string" ? r.data : null) ||
            r.text;
          return { endpoint: ep, feedback: fb };
        }
        errors.push(`${ep} -> HTTP ${r.status}`);
      } catch (e) {
        errors.push(`${ep} -> ${String(e)}`);
      }
    }
    throw new Error("Hiçbir endpoint yanıt vermedi. Denenenler: " + errors.join(" | "));
  }

  function buildStarterMessage() {
    const attention = (els.attention?.value || "").trim();
    const interpretation = (els.interpretation?.value || "").trim();
    const decision = (els.decision?.value || "").trim();

    return [
      "DİKKATE ALMA:",
      attention,
      "",
      "YORUMLAMA:",
      interpretation,
      "",
      "KARAR VERME:",
      decision
    ].join("\n");
  }

  async function requestMentorTurn() {
    els.startMentorBtn.disabled = true;
    els.sendBtn.disabled = true;
    setStatus("Mentor yanıtlıyor...", "info");

    const payload = {
      name: (els.firstName?.value || "").trim(),
      surname: (els.lastName?.value || "").trim(),
      instruction: FIXED_INSTRUCTION,
      observations: {
        dikkate_alma: (els.attention?.value || "").trim(),
        yorumlama: (els.interpretation?.value || "").trim(),
        karar_verme: (els.decision?.value || "").trim()
      },
      messages: chatHistory.map(m => ({ role: m.role, content: m.content })),
      language: "tr"
    };

    try {
      const result = await tryMentorFeedback(payload);
      const reply = (result.feedback || "").trim() || "(Boş yanıt)";
      pushMsg("mentor", reply);
      setStatus(`Yanıt alındı. (endpoint: ${result.endpoint})`, "ok");
    } catch (e) {
      setStatus(String(e.message || e), "err");
    } finally {
      els.startMentorBtn.disabled = false;
      els.sendBtn.disabled = false;
    }
  }

  async function onStartMentor() {
    if (!isValidName()) {
      setStatus("Lütfen isim ve soyisim alanlarını doldurun.", "warn");
      return;
    }
    if (!areObservationsComplete()) {
      setStatus("Dikkate Alma, Yorumlama ve Karar Verme kutularının üçü de zorunludur.", "warn");
      return;
    }
    if (chatHistory.length === 0) {
    const rawInput = `
DİKKATE ALMA:
${els.attention.value}

YORUMLAMA:
${els.interpretation.value}

KARAR VERME:
${els.decision.value}
`.trim();

  pushMsg("user", rawInput);
}

    await requestMentorTurn();
  }

  async function onSendMessage() {
    if (!isValidName()) {
      setStatus("Sohbet için isim ve soyisim zorunlu.", "warn");
      return;
    }
    const text = (els.chatInput?.value || "").trim();
    if (!text) {
      setStatus("Mesaj boş olamaz.", "warn");
      return;
    }
    pushMsg("user", text);
    els.chatInput.value = "";
    await requestMentorTurn();
  }

  function onClear() {
    if (els.attention) els.attention.value = "";
    if (els.interpretation) els.interpretation.value = "";
    if (els.decision) els.decision.value = "";
    chatHistory = [];
    renderChat();
    setStatus("Alanlar ve sohbet temizlendi.", "ok");
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function onSave() {
    if (!isValidName()) {
      setStatus("Kaydetmek için isim ve soyisim zorunludur.", "warn");
      return;
    }
    if (!areObservationsComplete()) {
      setStatus("Kaydetmek için üç kutu da dolu olmalıdır.", "warn");
      return;
    }

    const now = new Date();
    const stamp = now.toISOString().replace(/[:]/g, "-").replace(/\..+/, "");
    const fn = sanitizeFilenamePart(els.firstName.value);
    const ln = sanitizeFilenamePart(els.lastName.value);

    const report = {
      isim: els.firstName.value.trim(),
      soyisim: els.lastName.value.trim(),
      etiketi: "deniz",
      zaman: now.toISOString(),
      video: FIXED_VIDEO_URL,
      yonerge: FIXED_INSTRUCTION,
      girdiler: {
        dikkate_alma: els.attention.value,
        yorumlama: els.interpretation.value,
        karar_verme: els.decision.value
      },
      sohbet: chatHistory
    };

    const txt = [
      "MENTOR GERİ BİLDİRİM RAPORU",
      "===========================",
      `İsim Soyisim: ${report.isim} ${report.soyisim}`,
      `Etiket: ${report.etiketi}`,
      `Zaman: ${report.zaman}`,
      `Video: ${report.video}`,
      "",
      "YÖNERGE",
      "-------",
      report.yonerge || "",
      "",
      "DİKKATE ALMA",
      "------------",
      report.girdiler.dikkate_alma || "",
      "",
      "YORUMLAMA",
      "---------",
      report.girdiler.yorumlama || "",
      "",
      "KARAR VERME",
      "-----------",
      report.girdiler.karar_verme || "",
      "",
      "SOHBET GEÇMİŞİ",
      "-------------",
      ...report.sohbet.map(m => `[${m.role}] ${m.content}`),
      ""
    ].join("\n");

    const filenameTxt = `${fn}_${ln}_deniz_${stamp}.txt`;
    const filenameJson = `${fn}_${ln}_deniz_${stamp}.json`;

    downloadTextFile(filenameTxt, txt);
    downloadTextFile(filenameJson, JSON.stringify(report, null, 2));
    setStatus("Rapor indirildi (TXT + JSON).", "ok");
  }

  function wireEvents() {
    // guard: in case ids change, fail gracefully
    if (els.firstName) {
      ["input","change"].forEach(evt => els.firstName.addEventListener(evt, () => {}));
    }
    if (els.lastName) {
      ["input","change"].forEach(evt => els.lastName.addEventListener(evt, () => {}));
    }

    els.startMentorBtn?.addEventListener("click", onStartMentor);
    els.sendBtn?.addEventListener("click", onSendMessage);
    els.chatInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onSendMessage();
    });

    els.clearBtn?.addEventListener("click", onClear);
    els.saveBtn?.addEventListener("click", onSave);
  }

  function init() {
    // Clean start on refresh:
    chatHistory = [];
    renderChat();
    renderVideo();
    wireEvents();
    setStatus("Hazır. İsim+soyisim girin, üç kutuyu doldurun, sohbeti başlatın.", "ok");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
