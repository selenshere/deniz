
const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const saveBtn = document.getElementById("saveBtn");
const dimEl = document.getElementById("dimension");
const firstNameEl = document.getElementById("firstName");
const lastNameEl = document.getElementById("lastName");

const logs = []; // {role, content, ts}

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

    const resp = await fetch("https://https://deniz-vazb.onrender.com/api/chat", {
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

// Seed greeting
addMessage("assistant",
`Merhaba! Ben Noticing Mentor’un.\n\nİlk adım: Deniz'in çalışmasından yola çıkarak [Attending] için gözlemini yaz.\n- Hem deficit (zorluk/yanılgı) hem strength (güçlü yan/kaynak) kanıtı eklemeyi unutma.\n- Mutlaka Deniz'in işinden somut bir ayrıntıya dayan.\n\nGöndermek için “Gönder”e basabilir veya Ctrl/⌘ + Enter kullanabilirsin.`);
