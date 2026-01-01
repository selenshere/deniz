const $ = (id) => document.getElementById(id);

const SYSTEM_PROMPT_TEXT = `SYSTEM PROMPT FOR AI NOTICING MENTOR
ROLE AND OBJECTIVE
You are an expert mentor in mathematics education designed to scaffold prospective teachers' Professional Noticing" skills. Your specific goal is to facilitate Frame Shifting, helping teachers move from Deficit-based orientations to Strength-based orientations. You will analyse the prospective teachers' written observations of student work using Noticing Coding Scheme. You act as both an Assessor (coding their response) and a Coach (nudging them toward deeper, strength-based noticing).
THEORETICAL KNOWLEDGE BASE (STRICTLY ADHERE TO THIS)
You must evaluate the prospective teachers' input across three dimensions: Attending, Interpreting, and Responding. For each dimension, categorize the statement into an Orientation (Deficit, Strength, or Uncommitted) and a specific Category, then assign an Evidence Level (0-2). 
1.ATTENDING (Identifying noteworthy aspects)
Focus: What does the teacher see in the student's work?
A. Deficit-Based Orientations:
-Error/Mistake: Focuses on incorrect answers, computational errors, or flawed procedures in student work (e.g., "The student incorrectly identifies...")
-Failure: Emphasises what the student was unable to accomplish or complete correctly in relation to the task (e.g., " The student does not justify why...").
-Lack/Gap: Identifies specific knowledge or skills that appear to be missing from students’ mathematical understanding (e.g., " The student work lacks an explicit explanation...").
-Misconception: References fundamental conceptual misunderstandings that appear to underlie the student’s approach (e.g., "This suggests a misconception").
B. Strength-Based Orientations:
-Ability: Recognises specific mathematical capabilities demonstrated by the student (e.g., " The student correctly does...").
-Strength: Emphasises particular mathematical strengths evidenced in student work (e.g., "The visual representation demonstrates an understanding of decomposition...").
C. Uncommitted Orientations:
-Student Doing: Provides descriptive observations of the student’s mathematical activity without evaluative judgment.
2. INTERPRETING (Making sense of student understanding)
Focus: How does the teacher interpret what they saw?
A. Deficit-Based Orientations:
-Evaluative-Negative: Makes judgmental assessments that emphasise shortcomings in the student’s understanding (e.g., " The student does not understand the relationship... hthe student had a limited understanding…").
-Expectation-Conflict: Focuses on contradictions or inconsistencies in student work with the assumption that students should recognise these discrepancies (e.g., "Interestingly, the student was not confused by the mismatch...").
-Normative: Compares student work directly to normative standards with primary focus on deviation from those standards (e.g., " The student’s approach does not align with the usual algorithm").
B. Strength-Based Orientations:
-Evaluative-Positive: Provides assessments that highlight achievements or progress in the student’s mathematical thinking (e.g., " The student is adept at partitioning...").
-Interpretive-Asset-Based: Makes sense of student thinking in terms of the mathematical resources and capabilities they bring to the task (e.g., " The student’s partitioning strategy provides a strong basis for...").
-Interpretive-In Their Own Right: Understands student thinking on its own terms, acknowledging the underlying rationale shaping their reasoning (e.g., " The student’s approach reflects a consistent internal logic, even if it deviates...").
C. Uncommitted Orientations:
-Assumption/Inference: Makes conjectures about student thinking without explicit judgment of correctness or quality (e.g., " The student might believe that...").
-Interpretive-Non-Evaluative: Makes sense of student work by interpreting their mathematical approach without evaluation (e.g., "The two approaches are independent for the student").
3. RESPONDING (Deciding how to respond/Instructional Move)
Focus: What does the teacher propose to do next?
A. Deficit-Based Orientations:
-Challenging Misconceptions: Directly addresses perceived conceptual misunderstandings by correcting or confronting them.
-Flagging/Correcting Errors: Points out or corrects mistakes or incorrect approaches without building on the student’s existing thinking.
-Preventing Obstacles: Intervenes to help students avoid potential obstacles in future work.
-Redirecting Understanding: Replaces the student’s approach with a more conventional or standard method.
B. Strength-Based Orientations:
-Accessing Understanding: Designs questions or tasks specifically intended to elicit more information about the student’s understanding.
-Extending/Building Upon: Builds on the student’s existing knowledge and approach to develop deeper understanding.
-Positive Reinforcement: Acknowledges and affirms productive aspects of student thinking, validating their mathematical efforts.
C. Uncommitted Orientations:
-Clarifying student work: Seeks additional information about student thinking before proceeding with instruction.
-Giving general Response: Offers generic instructional feedback or guidance that could apply to many students rather than addressing the particular student’s mathematical reasoning.
SCORING RUBRIC (EVIDENCE LEVELS)
For each component (Attending, Interpreting, Responding) identified in the user's text, assign a score:
-0 = No Evidence: The category is not present.
-1 = Limited Evidence: The category is present but only briefly mentioned or not elaborated (e.g., "The student made errors," or "I would correct the student").
-2 = Strong Evidence: The category is clearly articulated, elaborated, and explicitly grounded in the student's (e.g., the student’s) specific work, words, or drawings.
INTERACTION PROTOCOL
Step 1: Analyse. When the user inputs their observation. Classify their statements into Attending, Interpreting, and Responding. Then assign the appropriate Code (e.g., Deficit-Error or Strength-Ability). Then assign the Score (0, 1, or 2).
Step 2: Internal Monologue (Invisible to User). Check the response whether the user focused on Deficits? If yes, I must scaffold them toward Strengths. Then check the response whether the evidence was level 1? If yes, you must ask the user to ground it more in the specific student work (to reach level 2). Then check the response whether the user missed the "Responding" part? If yes, prompt for it.
Step 3: Respond to User. 1First, briefly summarize what they noticed using the framework's language (e.g., "You identified an Error in the students’ calculation [Attending: Deficit, Level 1]..."). Secondly, The Pivot (Frame Shifting): If they were Deficit-Based: "You noted what the student couldn't do. Let's shift frames. Looking at the student’s diagram, what logic or capability is he demonstrating, even if the final answer is non-standard? (Try to find an Ability or Interpretive-Asset-Based perspective)." If they were General (Level 1): "You mentioned he has a misconception. Can you be more specific? Point to the exact part of his drawing or dialogue that supports this." If they were Strength-Based: Validate strongly. Ask how they would respond to build on that strength (moving to Extending/Building Upon). Example Output format: "I notice you focused on the students’ calculation error (Attending: Deficit-Error, Level 1). While it is true the calculation is wrong, ask the student that his visual partitioning showed a Strength in understanding parts of a whole or how you could Build Upon that visual strength in your next step?"
TONE
You must NEVER:
-Provide the correct mathematical solution
-Explain mathematical concepts or algorithms
-Rewrite or model an ideal response for the user
-Say “you could write…” followed by a complete answer
-Replace student reasoning with normative or standard methods
-Teach the mathematics directly
If a proposed response involves direct explanation or correction of mathematics, it automatically disqualifies the response from Level 2.
`;

const els = {
  firstName: $("firstName"),
  lastName: $("lastName"),
  videoUrl: $("videoUrl"),
  loadVideoBtn: $("loadVideoBtn"),
  videoWrap: $("videoWrap"),
  instruction: $("instruction"),
  attention: $("attention"),
  interpretation: $("interpretation"),
  decision: $("decision"),
  startMentorBtn: $("startMentorBtn"),
  clearBtn: $("clearBtn"),
  status: $("status"),
  chat: $("chat"),
  chatInput: $("chatInput"),
  sendBtn: $("sendBtn"),
  mentorFeedback: $("mentorFeedback"),
  saveBtn: $("saveBtn")
};

let chatHistory = []; // {role:'user'|'mentor', content:'', ts:''}

const DEFAULT_INSTRUCTION = `Görev:
- Videodaki öğrencinin düşünmesini üç başlıkta analiz edin: (1) Dikkate Alma, (2) Yorumlama, (3) Karar Verme.
- Metinlerinizi ilgili alanlara kopyala-yapıştır yapın.
- “Mentor Sohbetini Başlat” ile ilk geri bildirimi alın.
- Ardından mentorla sohbet ederek ek açıklamalar isteyin / sorulara cevap verin.
- Sonunda “Kaydet ve İndir” ile raporu cihazınıza indirin.`;

function setStatus(msg, tone = "info") {
  const prefix =
    tone === "ok" ? "✅ " : tone === "warn" ? "⚠️ " : tone === "err" ? "⛔ " : "ℹ️ ";
  els.status.textContent = prefix + msg;
}

function saveToStorage() {
  localStorage.setItem("mentor_firstName", els.firstName.value.trim());
  localStorage.setItem("mentor_lastName", els.lastName.value.trim());
  localStorage.setItem("mentor_videoUrl", els.videoUrl.value.trim());
  localStorage.setItem("mentor_instruction", els.instruction.value);

  localStorage.setItem("mentor_attention", els.attention.value);
  localStorage.setItem("mentor_interpretation", els.interpretation.value);
  localStorage.setItem("mentor_decision", els.decision.value);

  localStorage.setItem("mentor_chatHistory", JSON.stringify(chatHistory));
  localStorage.setItem("mentor_lastMentorMsg", els.mentorFeedback.value);
}

function loadFromStorage() {
  els.firstName.value = localStorage.getItem("mentor_firstName") || "";
  els.lastName.value = localStorage.getItem("mentor_lastName") || "";
  els.videoUrl.value = localStorage.getItem("mentor_videoUrl") || "";
  els.instruction.value = localStorage.getItem("mentor_instruction") || DEFAULT_INSTRUCTION;

  els.attention.value = localStorage.getItem("mentor_attention") || "";
  els.interpretation.value = localStorage.getItem("mentor_interpretation") || "";
  els.decision.value = localStorage.getItem("mentor_decision") || "";

  try {
    chatHistory = JSON.parse(localStorage.getItem("mentor_chatHistory") || "[]");
  } catch (_) {
    chatHistory = [];
  }
  els.mentorFeedback.value = localStorage.getItem("mentor_lastMentorMsg") || "";
  renderChat();
}

function isValidName() {
  return els.firstName.value.trim().length > 0 && els.lastName.value.trim().length > 0;
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

function renderVideo(url) {
  const wrap = els.videoWrap;
  wrap.innerHTML = "";
  const yt = toYouTubeEmbed(url);

  if (yt) {
    const iframe = document.createElement("iframe");
    iframe.src = yt;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    wrap.appendChild(iframe);
    return;
  }

  if (url) {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.allowFullscreen = true;
    wrap.appendChild(iframe);
    return;
  }

  wrap.innerHTML = `<div class="videoPlaceholder">Video burada görünecek. Bağlantıyı yapıştırıp <b>Videoyu Yükle</b>’ye basın.</div>`;
}

function renderChat() {
  els.chat.innerHTML = "";
  for (const m of chatHistory) {
    const div = document.createElement("div");
    div.className = "msg " + (m.role === "user" ? "user" : "mentor");

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent =
      (m.role === "user" ? "Siz" : "Mentor") + " • " + new Date(m.ts).toLocaleString();

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
  saveToStorage();
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
  try {
    data = JSON.parse(text);
  } catch (_) {}
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
        return { endpoint: ep, feedback: fb, raw: r };
      }
      errors.push(`${ep} -> HTTP ${r.status}`);
    } catch (e) {
      errors.push(`${ep} -> ${String(e)}`);
    }
  }
  throw new Error("Hiçbir endpoint yanıt vermedi. Denenenler: " + errors.join(" | "));
}

function buildStarterMessage() {
  const attention = els.attention.value.trim();
  const interpretation = els.interpretation.value.trim();
  const decision = els.decision.value.trim();

  if (!attention && !interpretation && !decision) return null;

  return [
    "Aşağıdaki gözlemlerimi mentor olarak değerlendir.",
    "Lütfen NOTICING CODING SCHEME'e göre Attending/Interpreting/Responding boyutlarında kodla ve kanıt düzeyi ver.",
    "Deficit odak varsa Frame Shifting ile Strength odaklı sorularla beni yönlendir.",
    "Matematik öğretme / doğru çözüm verme.",
    "",
    "DİKKATE ALMA:",
    attention || "(boş)",
    "",
    "YORUMLAMA:",
    interpretation || "(boş)",
    "",
    "KARAR VERME:",
    decision || "(boş)"
  ].join("\n");
}

async function onStartMentor() {
  saveToStorage();

  if (!isValidName()) {
    setStatus("Lütfen isim ve soyisim alanlarını doldurun.", "warn");
    return;
  }

  if (chatHistory.length === 0) {
    const starter = buildStarterMessage();
    if (!starter) {
      setStatus("Sohbeti başlatmak için en az bir alana metin ekleyin.", "warn");
      return;
    }
    pushMsg("user", starter);
  }

  await requestMentorTurn();
}

async function requestMentorTurn() {
  els.startMentorBtn.disabled = true;
  els.sendBtn.disabled = true;
  setStatus("Mentor yanıtlıyor...", "info");

  const payload = {
    name: els.firstName.value.trim(),
    surname: els.lastName.value.trim(),
    instruction: els.instruction.value,
    observations: {
      dikkate_alma: els.attention.value.trim(),
      yorumlama: els.interpretation.value.trim(),
      karar_verme: els.decision.value.trim()
    },
    messages: chatHistory.map((m) => ({ role: m.role, content: m.content })),
    system_prompt: SYSTEM_PROMPT_TEXT, // ✅ BACKEND bunu kullanmalı
    language: "tr"
  };

  try {
    const result = await tryMentorFeedback(payload);
    const reply = (result.feedback || "").trim() || "(Boş yanıt)";
    pushMsg("mentor", reply);
    els.mentorFeedback.value = reply;
    saveToStorage();
    setStatus(`Yanıt alındı. (endpoint: ${result.endpoint})`, "ok");
  } catch (e) {
    setStatus(String(e.message || e), "err");
  } finally {
    els.startMentorBtn.disabled = false;
    els.sendBtn.disabled = false;
  }
}

async function onSendMessage() {
  saveToStorage();
  if (!isValidName()) {
    setStatus("Sohbet için isim ve soyisim zorunlu.", "warn");
    return;
  }
  const text = els.chatInput.value.trim();
  if (!text) {
    setStatus("Mesaj boş olamaz.", "warn");
    return;
  }
  pushMsg("user", text);
  els.chatInput.value = "";
  await requestMentorTurn();
}

function onClear() {
  els.attention.value = "";
  els.interpretation.value = "";
  els.decision.value = "";
  els.mentorFeedback.value = "";
  chatHistory = [];
  saveToStorage();
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
  saveToStorage();
  if (!isValidName()) {
    setStatus("Kaydetmek için isim ve soyisim zorunludur.", "warn");
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
    video: els.videoUrl.value.trim(),
    yonerge: els.instruction.value,
    girdiler: {
      dikkate_alma: els.attention.value,
      yorumlama: els.interpretation.value,
      karar_verme: els.decision.value
    },
    sohbet: chatHistory,
    son_mentor_mesaji: els.mentorFeedback.value
  };

  const txt = [
    "MENTOR GERİ BİLDİRİM RAPORU",
    "===========================",
    `İsim Soyisim: ${report.isim} ${report.soyisim}`,
    `Etiket: ${report.etiketi}`,
    `Zaman: ${report.zaman}`,
    report.video ? `Video: ${report.video}` : "Video: (boş)",
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
    ...report.sohbet.map((m) => `[${m.role}] ${m.content}`),
    "",
    "SON MENTOR MESAJI",
    "-----------------",
    report.son_mentor_mesaji || "",
    ""
  ].join("\n");

  const filenameTxt = `${fn}_${ln}_deniz_${stamp}.txt`;
  const filenameJson = `${fn}_${ln}_deniz_${stamp}.json`;

  downloadTextFile(filenameTxt, txt);
  downloadTextFile(filenameJson, JSON.stringify(report, null, 2));

  setStatus("Rapor indirildi (TXT + JSON).", "ok");
}

function wireEvents() {
  ["input", "change"].forEach((evt) => {
    els.firstName.addEventListener(evt, saveToStorage);
    els.lastName.addEventListener(evt, saveToStorage);
    els.videoUrl.addEventListener(evt, saveToStorage);
    els.instruction.addEventListener(evt, saveToStorage);
    els.attention.addEventListener(evt, saveToStorage);
    els.interpretation.addEventListener(evt, saveToStorage);
    els.decision.addEventListener(evt, saveToStorage);
  });

  els.loadVideoBtn.addEventListener("click", () => {
    const url = els.videoUrl.value.trim();
    renderVideo(url);
    saveToStorage();
    setStatus(url ? "Video yüklendi." : "Video bağlantısı boş.", url ? "ok" : "warn");
  });

  els.startMentorBtn.addEventListener("click", onStartMentor);
  els.sendBtn.addEventListener("click", onSendMessage);
  els.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSendMessage();
  });

  els.clearBtn.addEventListener("click", onClear);
  els.saveBtn.addEventListener("click", onSave);
}

function init() {
  loadFromStorage();
  renderVideo(els.videoUrl.value.trim());
  wireEvents();
  setStatus("Hazır. İsim+soyisim girin, gözlemleri yapıştırın, sohbeti başlatın.", "ok");
}

init();
