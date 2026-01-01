/* global API_BASE_URL, ENDPOINT_CANDIDATES */

const $ = (id) => document.getElementById(id);

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

function setStatus(msg, tone="info"){
  const prefix = tone === "ok" ? "✅ " : tone === "warn" ? "⚠️ " : tone === "err" ? "⛔ " : "ℹ️ ";
  els.status.textContent = prefix + msg;
}

function saveToStorage(){
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

function loadFromStorage(){
  els.firstName.value = localStorage.getItem("mentor_firstName") || "";
  els.lastName.value = localStorage.getItem("mentor_lastName") || "";
  els.videoUrl.value = localStorage.getItem("mentor_videoUrl") || "";
  els.instruction.value = localStorage.getItem("mentor_instruction") || DEFAULT_INSTRUCTION;

  els.attention.value = localStorage.getItem("mentor_attention") || "";
  els.interpretation.value = localStorage.getItem("mentor_interpretation") || "";
  els.decision.value = localStorage.getItem("mentor_decision") || "";

  try{
    chatHistory = JSON.parse(localStorage.getItem("mentor_chatHistory") || "[]");
  }catch(_){
    chatHistory = [];
  }
  els.mentorFeedback.value = localStorage.getItem("mentor_lastMentorMsg") || "";
  renderChat();
}

function isValidName(){
  return els.firstName.value.trim().length > 0 && els.lastName.value.trim().length > 0;
}

function sanitizeFilenamePart(s){
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-çğıöşü]/gi, "")
    .slice(0, 40) || "kullanici";
}

function toYouTubeEmbed(url){
  try{
    const u = new URL(url);
    if(u.hostname.includes("youtu.be")){
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    if(u.hostname.includes("youtube.com")){
      const id = u.searchParams.get("v");
      if(id) return `https://www.youtube.com/embed/${id}`;
      if(u.pathname.startsWith("/embed/")) return url;
    }
  }catch(_){}
  return null;
}

function renderVideo(url){
  const wrap = els.videoWrap;
  wrap.innerHTML = "";
  const yt = toYouTubeEmbed(url);

  if(yt){
    const iframe = document.createElement("iframe");
    iframe.src = yt;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    wrap.appendChild(iframe);
    return;
  }

  if(url){
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.allowFullscreen = true;
    wrap.appendChild(iframe);
    return;
  }

  wrap.innerHTML = `<div class="videoPlaceholder">Video burada görünecek. Bağlantıyı yapıştırıp <b>Videoyu Yükle</b>’ye basın.</div>`;
}

function renderChat(){
  els.chat.innerHTML = "";
  for(const m of chatHistory){
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

function pushMsg(role, content){
  chatHistory.push({ role, content, ts: new Date().toISOString() });
  saveToStorage();
  renderChat();
}

async function postJson(url, body){
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data = null;
  try{ data = JSON.parse(text); } catch(_){}
  return { ok: res.ok, status: res.status, data, text };
}

async function tryMentorFeedback(payload){
  const errors = [];
  for(const ep of ENDPOINT_CANDIDATES){
    const full = API_BASE_URL.replace(/\/$/, "") + ep;
    try{
      const r = await postJson(full, payload);
      if(r.ok){
        const fb =
          (r.data && (r.data.feedback || r.data.output || r.data.message || r.data.text)) ||
          (typeof r.data === "string" ? r.data : null) ||
          r.text;
        return { endpoint: ep, feedback: fb, raw: r };
      }
      errors.push(`${ep} -> HTTP ${r.status}`);
    }catch(e){
      errors.push(`${ep} -> ${String(e)}`);
    }
  }
  throw new Error("Hiçbir endpoint yanıt vermedi. Denenenler: " + errors.join(" | "));
}

function buildStarterMessage(){
  const attention = els.attention.value.trim();
  const interpretation = els.interpretation.value.trim();
  const decision = els.decision.value.trim();

  if(!attention && !interpretation && !decision){
    return null;
  }

  return [
    "Aşağıdaki gözlemlerimi mentor olarak değerlendir.",
    "Lütfen:",
    "1) Güçlü yönleri belirt,",
    "2) Geliştirme alanlarını somut önerilerle yaz,",
    "3) Her başlık için (Dikkate Alma / Yorumlama / Karar Verme) örnek mentor soruları ver,",
    "4) Bir sonraki adım için 2-3 hedef öner.",
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

async function onStartMentor(){
  saveToStorage();

  if(!isValidName()){
    setStatus("Lütfen isim ve soyisim alanlarını doldurun.", "warn");
    return;
  }

  if(chatHistory.length === 0){
    const starter = buildStarterMessage();
    if(!starter){
      setStatus("Sohbeti başlatmak için en az bir alana metin ekleyin.", "warn");
      return;
    }
    pushMsg("user", starter);
  }

  await requestMentorTurn();
}

async function requestMentorTurn(){
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
    messages: chatHistory.map(m => ({ role: m.role, content: m.content })),
    language: "tr"
  };

  try{
    const result = await tryMentorFeedback(payload);
    const reply = (result.feedback || "").trim() || "(Boş yanıt)";
    pushMsg("mentor", reply);
    els.mentorFeedback.value = reply;
    saveToStorage();
    setStatus(`Yanıt alındı. (endpoint: ${result.endpoint})`, "ok");
  }catch(e){
    setStatus(String(e.message || e), "err");
  }finally{
    els.startMentorBtn.disabled = false;
    els.sendBtn.disabled = false;
  }
}

async function onSendMessage(){
  saveToStorage();
  if(!isValidName()){
    setStatus("Sohbet için isim ve soyisim zorunlu.", "warn");
    return;
  }
  const text = els.chatInput.value.trim();
  if(!text){
    setStatus("Mesaj boş olamaz.", "warn");
    return;
  }
  pushMsg("user", text);
  els.chatInput.value = "";
  await requestMentorTurn();
}

function onClear(){
  els.attention.value = "";
  els.interpretation.value = "";
  els.decision.value = "";
  els.mentorFeedback.value = "";
  chatHistory = [];
  saveToStorage();
  renderChat();
  setStatus("Alanlar ve sohbet temizlendi.", "ok");
}

function downloadTextFile(filename, content){
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

function onSave(){
  saveToStorage();
  if(!isValidName()){
    setStatus("Kaydetmek için isim ve soyisim zorunludur.", "warn");
    return;
  }

  const now = new Date();
  const stamp = now.toISOString().replace(/[:]/g,"-").replace(/\..+/, "");
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
    ...report.sohbet.map(m => `[${m.role}] ${m.content}`),
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

function wireEvents(){
  ["input","change"].forEach(evt=>{
    els.firstName.addEventListener(evt, saveToStorage);
    els.lastName.addEventListener(evt, saveToStorage);
    els.videoUrl.addEventListener(evt, saveToStorage);
    els.instruction.addEventListener(evt, saveToStorage);
    els.attention.addEventListener(evt, saveToStorage);
    els.interpretation.addEventListener(evt, saveToStorage);
    els.decision.addEventListener(evt, saveToStorage);
  });

  els.loadVideoBtn.addEventListener("click", ()=>{
    const url = els.videoUrl.value.trim();
    renderVideo(url);
    saveToStorage();
    setStatus(url ? "Video yüklendi." : "Video bağlantısı boş.", url ? "ok" : "warn");
  });

  els.startMentorBtn.addEventListener("click", onStartMentor);
  els.sendBtn.addEventListener("click", onSendMessage);
  els.chatInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter") onSendMessage(); });

  els.clearBtn.addEventListener("click", onClear);
  els.saveBtn.addEventListener("click", onSave);
}

function init(){
  loadFromStorage();
  renderVideo(els.videoUrl.value.trim());
  wireEvents();
  setStatus("Hazır. İsim+soyisim girin, gözlemleri yapıştırın, sohbeti başlatın.", "ok");
}

init();
