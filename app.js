
const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const saveBtn = document.getElementById("saveBtn");
const dimEl = document.getElementById("dimension");
const firstNameEl = document.getElementById("firstName");
const lastNameEl = document.getElementById("lastName");

// Start modal elements
const startModalEl = document.getElementById("startModal");
const startBtnEl = document.getElementById("startBtn");
const modalFirstNameEl = document.getElementById("modalFirstName");
const modalLastNameEl = document.getElementById("modalLastName");
const pasteAttEl = document.getElementById("pasteAttending");
const pasteIntEl = document.getElementById("pasteInterpreting");
const pasteResEl = document.getElementById("pasteResponding");

const logs = []; // {role, content, ts}
let sessionStarted = false;

// API base (same-origin by default). If you host the frontend separately,
// set <meta name="api-base" content="https://your-backend.example.com"> in index.html.
const API_BASE = (document.querySelector('meta[name="api-base"]')?.getAttribute("content") || "").trim();
const API_CHAT_URL = API_BASE ? `${API_BASE.replace(/\/$/, "")}/api/chat` : "/api/chat";

async function readJsonSafely(resp) {
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await resp.json();
    } catch {
      // fall through
    }
  }
  const text = await resp.text().catch(() => "");
  return { _text: text };
}

function nowISO() {
  return new Date().toISOString();
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
  meta.textContent = role === "user" ? "Siz" : "Mentor";

  const col = document.createElement("div");
  col.appendChild(bubble);
  col.appendChild(meta);

  wrap.appendChild(col);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
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

async function send() {
  if (!sessionStarted) {
    // Kullanıcı modalı kapatmadan serbest yazmasın
    openStartModal();
    return;
  }
  const user = requireName();
  if (!user) return;

  const raw = inputEl.value.trim();
  if (!raw) return;

  const dimension = dimEl.value;
  const content = `[${dimension}] ${raw}`;

  addMessage("user", content);
  inputEl.value = "";
  sendBtn.disabled = true;
  sendBtn.textContent = "Gönderiliyor...";

  try {
    // Send only user/assistant logs (system stays on server)
    const messages = logs.map(l => ({
      role: l.role === "assistant" ? "assistant" : "user",
      content: l.content
    }));

    const resp = await fetch(API_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, messages })
    });

    const data = await readJsonSafely(resp);
    if (!resp.ok) {
      const fallback = data?._text
        ? `Sunucudan JSON gelmedi (${resp.status}). API adresini kontrol edin.`
        : "İstek başarısız.";
      throw new Error(data?.error || fallback);
    }

    addMessage("assistant", data.assistant || "");
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

function setComposerEnabled(enabled) {
  dimEl.disabled = !enabled;
  inputEl.disabled = !enabled;
  sendBtn.disabled = !enabled;
  if (!enabled) {
    sendBtn.textContent = "Gönder";
  }
}

function openStartModal() {
  // Modal açılırken isim alanlarını header ile senkronla
  if (modalFirstNameEl && firstNameEl && !modalFirstNameEl.value) {
    modalFirstNameEl.value = firstNameEl.value;
  }
  if (modalLastNameEl && lastNameEl && !modalLastNameEl.value) {
    modalLastNameEl.value = lastNameEl.value;
  }
  startModalEl.classList.add("show");
  startModalEl.setAttribute("aria-hidden", "false");
  updateStartBtnState();
}

function closeStartModal() {
  startModalEl.classList.remove("show");
  startModalEl.setAttribute("aria-hidden", "true");
}

function syncModalNameToHeader() {
  // Modal açıkken header alanları kapalı kalabileceği için isim/soyisim'i buradan senkronla
  if (modalFirstNameEl && modalFirstNameEl.value.trim()) firstNameEl.value = modalFirstNameEl.value.trim();
  if (modalLastNameEl && modalLastNameEl.value.trim()) lastNameEl.value = modalLastNameEl.value.trim();
}

function validateStartModal() {
  const missing = [];
  if (!(modalFirstNameEl?.value || "").trim()) missing.push("İsim");
  if (!(modalLastNameEl?.value || "").trim()) missing.push("Soyisim");
  if (!(pasteAttEl?.value || "").trim()) missing.push("Attending");
  if (!(pasteIntEl?.value || "").trim()) missing.push("Interpreting");
  if (!(pasteResEl?.value || "").trim()) missing.push("Responding");
  return missing;
}

function updateStartBtnState() {
  const missing = validateStartModal();
  if (startBtnEl) startBtnEl.disabled = missing.length > 0;
}

async function startFromPastes() {
  const missing = validateStartModal();
  if (missing.length) {
    alert(`Lütfen pop-up içindeki zorunlu alanları doldurun: ${missing.join(", ")}`);
    updateStartBtnState();
    return;
  }

  syncModalNameToHeader();
  const user = requireName();
  if (!user) return; // isim/soyisim yoksa modal kapanmasın

  sessionStarted = true;
  closeStartModal();
  setComposerEnabled(true);

  const a = (pasteAttEl?.value || "").trim();
  const i = (pasteIntEl?.value || "").trim();
  const r = (pasteResEl?.value || "").trim();

  if (a) addMessage("user", `[Attending] ${a}`);
  if (i) addMessage("user", `[Interpreting] ${i}`);
  if (r) addMessage("user", `[Responding] ${r}`);

  // Mentor'dan üç boyut için birden dönüt iste
  addMessage(
    "user",
    "Yukarıda Attending/Interpreting/Responding için daha önce yazdığım cevapları yapıştırdım. Lütfen her boyut için ayrı ayrı mentor dönütü ver (Evidence Level + gerekçe + geliştirmek için gerekenler + yönlendirici sorular + revizyon isteği)."
  );

  // Otomatik ilk dönüt
  setComposerEnabled(false);
  try {
    const messages = logs.map(l => ({
      role: l.role === "assistant" ? "assistant" : "user",
      content: l.content
    }));

    const resp = await fetch(API_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, messages })
    });

    // Some hosting setups may return HTML error pages; guard JSON parsing
    const data = await readJsonSafely(resp);
    if (!resp.ok) {
      const msg = data?.error || (data?._text ? `Sunucudan JSON gelmedi (${resp.status}). API adresini kontrol edin.` : "İstek başarısız.");
      throw new Error(msg);
    }

    addMessage("assistant", data.assistant || "");
  } catch (e) {
    console.error(e);
    addMessage("assistant", `Üzgünüm, bir hata oldu: ${e.message}`);
  } finally {
    setComposerEnabled(true);
  }
}

// Modal wiring
startBtnEl.addEventListener("click", () => startFromPastes());

// Modal isim alanları değişince header'a yansıt
modalFirstNameEl?.addEventListener("input", syncModalNameToHeader);
modalLastNameEl?.addEventListener("input", syncModalNameToHeader);

// Modal zorunlu alanlar doldukça butonu aç/kapat
[modalFirstNameEl, modalLastNameEl, pasteAttEl, pasteIntEl, pasteResEl].forEach(el => {
  el?.addEventListener("input", updateStartBtnState);
});

// İlk açılışta modal göster ve composer'ı kilitle
setComposerEnabled(false);
openStartModal();
