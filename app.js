const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const saveBtn = document.getElementById("saveBtn");
const firstNameEl = document.getElementById("firstName");
const lastNameEl = document.getElementById("lastName");

/* Modal elements */
const modalOverlay = document.getElementById("startModal");
const closeModalBtn = document.getElementById("closeModal");
const startBtn = document.getElementById("startBtn");
const startBtnEmpty = document.getElementById("startBtnEmpty");
const preAttEl = document.getElementById("preAtt");
const preIntEl = document.getElementById("preInt");
const preResEl = document.getElementById("preRes");

/**
 * Logs are stored client-side and exported on demand.
 * log item: { role: "user"|"assistant", content: string, ts: ISO }
 */
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

function nowISO() {
  return new Date().toISOString();
}

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
  return s
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
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

function showModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.add("show");
  modalOverlay.setAttribute("aria-hidden", "false");
}

function hideModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.remove("show");
  modalOverlay.setAttribute("aria-hidden", "true");
}

closeModalBtn?.addEventListener("click", hideModal);
modalOverlay?.addEventListener("click", (e) => {
  if (e.target === modalOverlay) hideModal();
});

startBtnEmpty?.addEventListener("click", () => {
  // Allow entering later; keep stage idle
  hideModal();
  addMessage("assistant",
    "Tamam. Başlangıç metinlerini daha sonra girebilirsin. " +
    "Yine de istersen şimdi **Dikkate Alma** için metnini göndererek başlayabilirsin."
  );
});

startBtn?.addEventListener("click", () => {
  const user = requireName();
  if (!user) return;

  const a = (preAttEl?.value || "").trim();
  const i = (preIntEl?.value || "").trim();
  const r = (preResEl?.value || "").trim();

  if (!a || !i || !r) {
    alert("Lütfen üç alanı da doldurun: Dikkate Alma, Yorumlama, Karar Verme.");
    return;
  }

  initialAnswers.DikkateAlma = a;
  initialAnswers.Yorumlama = i;
  initialAnswers.KararVerme = r;

  addMessage("user", `${tag(DIM.ATT, "Başlangıç")} ${a}`);
  addMessage("user", `${tag(DIM.INT, "Başlangıç")} ${i}`);
  addMessage("user", `${tag(DIM.RES, "Başlangıç")} ${r}`);

  stage = "coach_att";
  current = DIM.ATT;

  hideModal();

  addMessage("assistant",
`Teşekkürler! Şimdi sırayla ilerleyeceğiz.

İlk adım: **Dikkate Alma (Attending)** metnini geliştirelim.
Lütfen Dikkate Alma için **revize edilmiş yeni halini** gönder.
- Hem deficit (zorluk/yanılgı) hem strength (güçlü yan/kaynak) kanıtı ekle.
- Mutlaka Deniz’in çalışmasından somut bir ayrıntıya dayan.`);
});

async function send() {
  const user = requireName();
  if (!user) return;

  const raw = inputEl.value.trim();
  if (!raw) return;

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

    const resp = await fetch("https://deniz-vazb.onrender.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, messages })
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error || "İstek başarısız.");

    const assistantText = data.assistant || "";
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
3) Karar Verme – Final

Her birini ayrı mesaj olarak gönderebilirsin.`);
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

// Seed greeting + open modal at start
addMessage("assistant",
`Merhaba! Ben Noticing Mentor’un.

Başlamak için üstte isim/soyisim yaz. Sonra başlangıç metinlerini girmek için pop-up açılacak.`);

showModal();
