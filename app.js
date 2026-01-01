const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const saveBtn = document.getElementById("saveBtn");
const firstNameEl = document.getElementById("firstName");
const lastNameEl = document.getElementById("lastName");

const logs = [];

const DIM = {
  ATT: { key: "Attending", tr: "Dikkate Alma" },
  INT: { key: "Interpreting", tr: "Yorumlama" },
  RES: { key: "Responding", tr: "Karar Verme" }
};

let stage = "idle"; // idle | coach_att | coach_int | coach_res | final_collect
let current = DIM.ATT;

const initialAnswers = { DikkateAlma: "", Yorumlama: "", KararVerme: "" };
const finalAnswers = { DikkateAlma: "", Yorumlama: "", KararVerme: "" };

function nowISO() { return new Date().toISOString(); }

function requireName() {
  const fn = firstNameEl.value.trim();
  const ln = lastNameEl.value.trim();
  if (!fn || !ln) {
    alert("Lütfen isim ve soyisim alanlarını doldurun (zorunlu).");
    return null;
  }
  return { firstName: fn, lastName: ln };
}

function sanitizeFilePart(s) {
  return s.trim().replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_-]/gu, "");
}

function addMessage(role, content) {
  logs.push({ role, content, ts: nowISO() });

  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  const meta = document.createElement("div");
  meta.className = "meta";
  if (role === "user") {
    const fn = firstNameEl.value.trim();
    const ln = lastNameEl.value.trim();
    meta.textContent = fn && ln ? `${fn} ${ln}` : "Kullanıcı";
  } else {
    meta.textContent = "Mentor";
  }

  const col = document.createElement("div");
  col.appendChild(bubble);
  col.appendChild(meta);

  wrap.appendChild(col);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function isStrongEvidence(assistantText) {
  const t = (assistantText || "").toLowerCase();
  return (
    t.includes("evidence level: 2") ||
    t.includes("evidence level 2") ||
    t.includes("kanıt düzeyi: 2") ||
    t.includes("kanıt düzeyi 2") ||
    t.includes("kanıt seviyesi: 2") ||
    t.includes("kanıt seviyesi 2") ||
    t.includes("seviye: 2") ||
    t.includes("seviye 2") ||
    t.includes("düzey: 2") ||
    t.includes("düzey 2") ||
    t.includes("2 (strong") ||
    t.includes("2 (güçlü")
  );
}

function tag(dimObj, kind) {
  return `[${dimObj.tr}${kind ? " - " + kind : ""}]`;
}

/**
 * Parse a single user message that contains:
 * Dikkate Alma: ...
 * Yorumlama: ...
 * Karar Verme: ...
 * Accepts common variations (case-insensitive).
 */
function parseInitialBlock(text) {
  const t = (text || "").replace(/\r/g, "");
  const norm = t.toLowerCase();

  const markers = [
    { key: "DikkateAlma", names: ["dikkate alma", "attending"] },
    { key: "Yorumlama", names: ["yorumlama", "interpreting"] },
    { key: "KararVerme", names: ["karar verme", "responding"] }
  ];

  // Find start indices for each marker
  const found = [];
  for (const m of markers) {
    let idx = -1;
    for (const name of m.names) {
      const re = new RegExp(`(^|\\n)\\s*${name}\\s*:\\s*`, "i");
      const match = re.exec(t);
      if (match) { idx = match.index + match[0].length; break; }
    }
    if (idx !== -1) found.push({ key: m.key, idx });
  }

  if (found.length < 3) return null;

  // Sort by idx and slice segments
  found.sort((a,b)=>a.idx-b.idx);
  const out = {};
  for (let i=0;i<found.length;i++){
    const start = found[i].idx;
    const end = (i<found.length-1) ? (found[i+1].idx - 1) : t.length;
    out[found[i].key] = t.slice(start, end).trim();
  }

  if (!out.DikkateAlma || !out.Yorumlama || !out.KararVerme) return null;
  return out;
}

async function callBackend(user, messages) {
  const resp = await fetch("https://deniz-vazb.onrender.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...user, messages })
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error || "İstek başarısız.");
  return data.assistant || "";
}

async function send() {
  const user = requireName();
  if (!user) return;

  const raw = inputEl.value.trim();
  if (!raw) return;

  // In idle stage, first message must include the 3 initial answers block.
  if (stage === "idle") {
    const parsed = parseInitialBlock(raw);
    if (!parsed) {
      addMessage("assistant",
`Başlamak için tek mesajda üç cevabı şu formatla yapıştır:
Dikkate Alma:
<metin>

Yorumlama:
<metin>

Karar Verme:
<metin>

(İstersen başlıkları Attending/Interpreting/Responding olarak da yazabilirsin.)`);
      return;
    }

    // Log user message as-is, then split into three initial logs
    addMessage("user", raw);

    initialAnswers.DikkateAlma = parsed.DikkateAlma;
    initialAnswers.Yorumlama = parsed.Yorumlama;
    initialAnswers.KararVerme = parsed.KararVerme;

    addMessage("user", `${tag(DIM.ATT, "Başlangıç")} ${parsed.DikkateAlma}`);
    addMessage("user", `${tag(DIM.INT, "Başlangıç")} ${parsed.Yorumlama}`);
    addMessage("user", `${tag(DIM.RES, "Başlangıç")} ${parsed.KararVerme}`);

    stage = "coach_att";
    current = DIM.ATT;

    addMessage("assistant",
`Teşekkürler! Şimdi sırayla ilerleyeceğiz.

İlk adım: **Dikkate Alma** metnini geliştirelim.
Lütfen Dikkate Alma için **revize edilmiş yeni halini** gönder.
- Hem deficit hem strength kanıtı ekle.
- Deniz’in çalışmasından somut bir ayrıntıya dayan.`);

    inputEl.value = "";
    return;
  }

  const content = `${tag(current, stage === "final_collect" ? "Final" : "Revize")} ${raw}`;
  addMessage("user", content);
  inputEl.value = "";

  sendBtn.disabled = true;
  sendBtn.textContent = "Gönderiliyor...";

  try {
    const messages = logs.map(l => ({
      role: l.role === "assistant" ? "assistant" : "user",
      content: l.content
    }));

    const assistantText = await callBackend(user, messages);
    addMessage("assistant", assistantText);

    if (stage.startsWith("coach_") && isStrongEvidence(assistantText)) {
      if (stage === "coach_att") {
        stage = "coach_int";
        current = DIM.INT;
        addMessage("assistant", "✅ Dikkate Alma tamam. Şimdi **Yorumlama** için revize edilmiş yeni halini gönder.");
      } else if (stage === "coach_int") {
        stage = "coach_res";
        current = DIM.RES;
        addMessage("assistant", "✅ Yorumlama tamam. Şimdi **Karar Verme** için revize edilmiş yeni halini gönder.");
      } else if (stage === "coach_res") {
        stage = "final_collect";
        current = DIM.ATT;
        addMessage("assistant",
`✅ Karar Verme de tamam.

Şimdi lütfen **SON HALİNİ** her boyut için ayrı ayrı gönder:
1) Dikkate Alma – Final
2) Yorumlama – Final
3) Karar Verme – Final`);
      }
    }

    if (stage === "final_collect") {
      if (current === DIM.ATT) {
        finalAnswers.DikkateAlma = raw;
        current = DIM.INT;
        addMessage("assistant", "Teşekkürler. Şimdi **Yorumlama – Final** mesajını gönder.");
      } else if (current === DIM.INT) {
        finalAnswers.Yorumlama = raw;
        current = DIM.RES;
        addMessage("assistant", "Harika. Şimdi **Karar Verme – Final** mesajını gönder.");
      } else if (current === DIM.RES) {
        finalAnswers.KararVerme = raw;
        addMessage("assistant", "✅ Tüm final yanıtlar alındı. İstersen şimdi **Kaydet (JSON)** ile indirebilirsin.");
      }
    }

  } catch (e) {
    console.error(e);
    addMessage("assistant", `Üzgünüm, bir hata oldu: ${e.message}`);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Gönder";
  }
}

sendBtn.addEventListener("click", send);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
});

saveBtn.addEventListener("click", () => {
  const user = requireName();
  if (!user) return;

  const payload = {
    user,
    student: "Deniz",
    exportedAt: nowISO(),
    initialAnswers,
    finalAnswers,
    logs
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const fn = sanitizeFilePart(user.firstName);
  const ln = sanitizeFilePart(user.lastName);
  a.download = `${fn}_${ln}_deniz.json`;
  a.href = URL.createObjectURL(blob);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
});

addMessage("assistant",
`Merhaba! Ben Noticing Mentor’un.

Başlamak için chat’e tek mesajda şu formatla üç cevabını yapıştır:
Dikkate Alma:
<metin>

Yorumlama:
<metin>

Karar Verme:
<metin>

Sonra birlikte sırayla 2 (Güçlü Kanıt) seviyesine çıkaracağız.`);
