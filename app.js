const chatEl = document.getElementById('chat');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send');
const clearBtn = document.getElementById('clear');
const tpl = document.getElementById('bubble');

const STORAGE_KEY = 'pwa-chatgpt-history-v1';
let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

function now() { return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }

function addMessage(role, content, time = now()) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.toggle('user', role === 'user');
  node.querySelector('.content').textContent = content;
  node.querySelector('.balloon').insertAdjacentHTML('beforeend', `<span class="time">${time}</span>`);
  chatEl.appendChild(node);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function restore() {
  if (history.length === 0) { addMessage('assistant', 'Hi! I am DS AI. Ask me anything.'); return; }
  history.forEach(m => addMessage(m.role, m.content, m.time));
}

async function send() {
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = '';
  const msg = { role:'user', content:text, time: now() };
  history.push(msg);
  addMessage('user', text, msg.time);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  addMessage('assistant', 'Thinking…', now());
  const thinkingEl = chatEl.lastElementChild.querySelector('.content');
  thinkingEl.classList.add('thinking');

  try {
    const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type':'application/json' },
  body: JSON.stringify({
    messages: [
      { role:'system', content:'You are ChatGPT, a helpful and concise assistant.'},
      ...history.map(({role, content}) => ({role, content}))
    ]
  })
});
const data = await res.json();
const reply = data.reply;
if (data.error) {
  thinkingEl.classList.remove('thinking');
  thinkingEl.textContent = 'Error: ' + data.error;
} else {
  thinkingEl.classList.remove('thinking');
  thinkingEl.textContent = reply || 'No reply.';
  history.push({ role:'assistant', content: reply || 'No reply.', time: now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
  } catch (err) {
    thinkingEl.classList.remove('thinking');
    thinkingEl.textContent = 'Error: ' + (err?.message || 'Failed to reach /api/chat');
  }
}

sendBtn.addEventListener('click', send);
inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
clearBtn.addEventListener('click', () => { history = []; localStorage.removeItem(STORAGE_KEY); chatEl.innerHTML = ''; restore(); });
restore();

// 1) Re-use the same announcer used for seed loads
function announce(msg) {
  const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  addMessage('assistant', msg, time);
  history.push({ role:'assistant', content: msg, time });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// 2) After setting GAME, also autosave (optional but nice)
function setGame(obj) {
  GAME = obj || {};
  renderPreview();
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(GAME)); // autosave current state
  } catch {}
}

// 3) Seed loader → already announces after load
async function loadSeed() {
  const res = await fetch(SEED_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Seed JSON not found: ' + SEED_URL);
  const data = await res.json();
  setGame(data);
  announce('✅ Seed loaded successfully! The grid is ready — time to play.');
}

// 4) Import handler → announce + filename
elImport?.addEventListener('change', async (ev) => {
  const file = ev.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    setGame(obj);
    announce(`✅ Save loaded: ${file.name}. Parc fermé complete — resume chaos.`);

    // 🎙️ Extra sprinkle: random rumour after import (5% chance)
    if (Math.random() < 0.05) {
      const rumours = [
        "🔮 Rumour: FIA might drop a surprise TD before next race.",
        "📉 Whisper: one team is over budget… penalties incoming?",
        "👀 Paddock says a TP is about to be sacked.",
        "🍕 Engineers spotted ordering pineapple pizza — morale crisis?",
        "🕵️ Sources claim a driver’s secretly testing for another team."
      ];
      const pick = rumours[Math.floor(Math.random() * rumours.length)];
      announce(pick);
    }

  } catch (e) {
    console.error(e);
    announce('❌ That file is not valid JSON. Bring it back to the garage.');
  } finally {
    ev.target.value = '';
  }
});

});
