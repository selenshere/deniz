/* global API_BASE_URL, ENDPOINT_CANDIDATES, HEALTH_ENDPOINTS */

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
  getFeedbackBtn: $("getFeedbackBtn"),
  clearBtn: $("clearBtn"),
  mentorFeedback: $("mentorFeedback"),
  saveBtn: $("saveBtn"),
  status: $("status"),
  apiBase: $("apiBase"),
  testApiBtn: $("testApiBtn"),
  apiTestOutput: $("apiTestOutput")
};

const DEFAULT_INSTRUCTION = `Görev:
- Videodaki öğrencinin düşünmesini üç başlıkta analiz edin: (1) Dikkate Alma, (2) Yorumlama, (3) Karar Verme.
- Metinlerinizi ilgili alanlara kopyala-yapıştır yapın.
- “Mentor Geri Bildirimi Al” ile mentor tarzında; güçlü yönler + geliştirme önerileri + örnek soru/ifadeler içeren geri bildirim alın.
- Sonunda “Kaydet ve İndir” ile raporu cihazınıza indirin.`;

function setStatus(msg, tone="info"){
  const prefix = tone === "ok" ? "✅ " : tone === "warn" ? "⚠️ " : tone === "err" ? "⛔ " : "ℹ️ ";
  els.status.textContent = prefix + msg;
}

function loadFromStorage(){
  els.firstName.value = localStorage.getItem("mentor_firstName") || "";
  els.lastName.value = localStorage.getItem("mentor_lastName") || "";
  els.videoUrl.value = localStorage.getItem("mentor_videoUrl") || "";
  els.instruction.value = localStorage.getItem("mentor_instruction") || DEFAULT_INSTRUCTION;

  els.attention.value = localStorage.getItem("mentor_attention") || "";
  els.interpretation.value = localStorage.getItem("mentor_interpretation") || "";
  els.decision.value = localStorage.getItem("mentor_decision") || "";
  els.mentorFeedback.value = localStorage.getItem("mentor_feedback") || "";
}

function saveToStorage(){
  localStorage.setItem("mentor_firstName", els.firstName.value.trim());
  localStorage.setItem("mentor_lastName", els.lastName.value.trim());
  localStorage.setItem("mentor_videoUrl", els.videoUrl.value.trim());
  localStorage.setItem("mentor_instruction", els.instruction.value);

  localStorage.setItem("mentor_attention", els.attention.value);
  localStorage.setItem("mentor_interpretation", els.interpretation.value);
  localStorage.setItem("mentor_decision", els.decision.value);
  localStorage.setItem("mentor_feedback", els.mentorFeedback.value);
}

function isValidName(){
  const fn = els.firstName.value.trim();
  const ln = els.lastName.value.trim();
  return fn.length > 0 && ln.length > 0;
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
    // youtu.be/<id>
    if(u.hostname.includes("youtu.be")){
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    // youtube.com/watch?v=<id>
    if(u.hostname.includes("youtube.com")){
      const id = u.searchParams.get("v");
      if(id) return `https://www.youtube.com/embed/${id}`;
      // youtube.com/embed/<id>
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

  // generic iframe attempt
  if(url){
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.allowFullscreen = true;
    wrap.appendChild(iframe);
    return;
  }

  wrap.innerHTML = `<div class="videoPlaceholder">Video burada görünecek. Bağlantıyı yapıştırıp <b>Videoyu Yükle</b>’ye basın.</div>`;
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
        // Accept a few common response shapes
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

async function onGetFeedback(){
  saveToStorage();
  if(!isValidName()){
    setStatus("Lütfen isim ve soyisim alanlarını doldurun.", "warn");
    return;
  }

  const attention = els.attention.value.trim();
  const interpretation = els.interpretation.value.trim();
  const decision = els.decision.value.trim();

  if(!attention && !interpretation && !decision){
    setStatus("En az bir alana (Dikkate Alma / Yorumlama / Karar Verme) metin ekleyin.", "warn");
    return;
  }

  els.getFeedbackBtn.disabled = true;
  setStatus("Mentor geri bildirimi hazırlanıyor...", "info");

  const payload = {
    name: els.firstName.value.trim(),
    surname: els.lastName.value.trim(),
    instruction: els.instruction.value,
    observations: {
      dikkate_alma: attention,
      yorumlama: interpretation,
      karar_verme: decision
    },
    // backend tarafında prompt oluşturmayı kolaylaştırmak için ipucu:
    rubric: ["Dikkate Alma", "Yorumlama", "Karar Verme"],
    language: "tr"
  };

  try{
    const result = await tryMentorFeedback(payload);
    els.mentorFeedback.value = result.feedback?.trim() || "";
    saveToStorage();
    setStatus(`Geri bildirim alındı. (endpoint: ${result.endpoint})`, "ok");
  }catch(e){
    setStatus(String(e.message || e), "err");
  }finally{
    els.getFeedbackBtn.disabled = false;
  }
}

function onClear(){
  els.attention.value = "";
  els.interpretation.value = "";
  els.decision.value = "";
  els.mentorFeedback.value = "";
  saveToStorage();
  setStatus("Alanlar temizlendi.", "ok");
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
    mentor_geribildirim: els.mentorFeedback.value
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
    "MENTOR GERİ BİLDİRİMİ",
    "----------------------",
    report.mentor_geribildirim || "",
    ""
  ].join("\n");

  // Requirement: "kullanıcı adı soy adı ve deniz olarak tamamlanıp cihaza inecek"
  // => filename includes name_surname_deniz
  const filenameTxt = `${fn}_${ln}_deniz_${stamp}.txt`;
  const filenameJson = `${fn}_${ln}_deniz_${stamp}.json`;

  downloadTextFile(filenameTxt, txt);
  downloadTextFile(filenameJson, JSON.stringify(report, null, 2));

  setStatus("Rapor indirildi (TXT + JSON).", "ok");
}

async function onTestApi(){
  els.apiTestOutput.textContent = "";
  setStatus("API test ediliyor...", "info");
  const base = API_BASE_URL.replace(/\/$/, "");
  const lines = [];
  for(const ep of HEALTH_ENDPOINTS){
    const url = base + ep;
    try{
      const res = await fetch(url, { method: "GET" });
      lines.push(`${ep} -> HTTP ${res.status}`);
      if(res.ok){
        const ct = res.headers.get("content-type") || "";
        const text = await res.text();
        lines.push(ct.includes("text/html") ? "(HTML) OK" : text.slice(0, 500));
        setStatus(`API erişilebilir görünüyor. (${ep})`, "ok");
        els.apiTestOutput.textContent = lines.join("\n");
        return;
      }
    }catch(e){
      lines.push(`${ep} -> ${String(e)}`);
    }
  }
  setStatus("API testinde sorun var. Render uygulamanız uyuyor mu? (503/CORS olabilir)", "warn");
  els.apiTestOutput.textContent = lines.join("\n");
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
    setStatus(url ? "Video yüklendi (iframe)." : "Video bağlantısı boş.", url ? "ok" : "warn");
  });

  els.getFeedbackBtn.addEventListener("click", onGetFeedback);
  els.clearBtn.addEventListener("click", onClear);
  els.saveBtn.addEventListener("click", onSave);
  els.testApiBtn.addEventListener("click", onTestApi);
}

function init(){
  els.apiBase.textContent = API_BASE_URL;
  loadFromStorage();
  renderVideo(els.videoUrl.value.trim());
  wireEvents();
  setStatus("Hazır. İsim+soyisim girin, videoyu yükleyin, metinleri yapıştırın.", "ok");
}

init();
