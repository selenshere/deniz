
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

    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, messages })
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data?.error || "İstek başarısız.");
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

async function startFromPastes() {
  syncModalNameToHeader();
  const user = requireName();
  if (!user) return; // isim/soyisim yoksa modal kapanmasın

  sessionStarted = true;
  closeStartModal();
  setComposerEnabled(true);

  const a = (pasteAttEl?.value || "").trim();
  const i = (pasteIntEl?.value || "").trim();
  const r = (pasteResEl?.value || "").trim();

  if (!a && !i && !r) {
    // Boşsa: normal akış
    addMessage("assistant",
`Merhaba! Ben Noticing Mentor’un.\n\nİlk adım: Deniz'in çalışmasından yola çıkarak [Attending] için gözlemini yaz.\n- Hem deficit (zorluk/yanılgı) hem strength (güçlü yan/kaynak) kanıtı eklemeyi unutma.\n- Mutlaka Deniz'in işinden somut bir ayrıntıya dayan.\n\nGöndermek için “Gönder”e basabilir veya Ctrl/⌘ + Enter kullanabilirsin.`);
    return;
  }

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

    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, messages })
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error || "İstek başarısız.");

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

// İlk açılışta modal göster ve composer'ı kilitle
setComposerEnabled(false);
openStartModal();
