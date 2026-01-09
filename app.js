// =======================
// Firebase
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyBaIAaVP13aq0y4xb1GAvZz_aGPkxKxbNM",
  authDomain: "manoodmala-6a7f8.firebaseapp.com",
  databaseURL: "https://manoodmala-6a7f8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "manoodmala-6a7f8",
  storageBucket: "manoodmala-6a7f8.appspot.com",
  messagingSenderId: "43960616810",
  appId: "1:43960616810:web:ca7a0b952a5b3c4ec18713"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// =====================================================
// MESSAGE PAGE
// =====================================================
const sendBtn = document.getElementById("sendBtn");
if (sendBtn) {
  sendBtn.onclick = () => {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (!text) return;

    db.ref("queue").push({ text, time: Date.now() });
    input.value = "";
    document.getElementById("status").innerText = "ส่งแล้ว ❤️";
  };
}

// =====================================================
// PROJECTOR
// =====================================================
const wall = document.getElementById("wall");
let isTyping = false;

// ===== POSITION MANAGER =====
const usedPositions = [];
const GRID_X = 8;
const GRID_Y = 5;

function getSafePosition() {
  const SAFE_X = 10; // vw
  const SAFE_Y = 15; // vh

  for (let i = 0; i < 30; i++) {
    const x = Math.floor(Math.random() * GRID_X);
    const y = Math.floor(Math.random() * GRID_Y);
    const key = `${x}-${y}`;

    if (!usedPositions.includes(key)) {
      usedPositions.push(key);
      return {
        left: `calc(${x * (100 / GRID_X)}vw + ${SAFE_X}px)`,
        top: `calc(${y * (100 / GRID_Y)}vh + ${SAFE_Y}px)`,
        key
      };
    }
  }

  return {
    left: Math.random() * 60 + 10 + "vw",
    top: Math.random() * 60 + 10 + "vh",
    key: null
  };
}


function releasePosition(key) {
  if (!key) return;
  const i = usedPositions.indexOf(key);
  if (i !== -1) usedPositions.splice(i, 1);
}

// ===== LISTEN QUEUE =====
if (wall) {
  db.ref("queue").on("child_added", async (snap) => {
    if (isTyping) return;
    isTyping = true;

    const key = snap.key;
    const text = snap.val().text;

    // 1. TYPE CENTER
    const el = await typeCenter(text);

    // 2. HOLD
    await sleep(5000);

    // 3. FADE OUT CENTER
    el.style.opacity = "0";
    await sleep(2500);

    // 4. TELEPORT + FADE IN
    spawnStaticBackground(el);

    // 5. BACKGROUND LIFE
    loopBackground(el);

    db.ref("queue/" + key).remove();
    isTyping = false;
  });
}

// =====================================================
// TYPE CENTER
// =====================================================
async function typeCenter(text) {
  const el = document.createElement("div");
  el.className = "message center";
  el.innerText = "";

  el.style.left = "50%";
  el.style.top = "50%";
  el.style.transform = "translate(-50%, -50%) scale(1.1)";
  el.style.opacity = "1";

  wall.appendChild(el);

  const total = 2000;
  const delay = Math.max(20, total / text.length);

  for (let c of text) {
    el.innerText += c;
    await sleep(delay);
  }
  return el;
}

function spawnStaticBackground(el) {
  const pos = getSafePosition();

  // 🔒 ปิด transition ชั่วคราว
  el.style.transition = "none";

  // teleport ไปตำแหน่งปลายทาง (ตอนมองไม่เห็น)
  el.classList.remove("center");
  el.classList.add("background");

  el.style.left = pos.left;
  el.style.top = pos.top;
  el.style.opacity = "0";

  el.dataset.posKey = pos.key;

  // fade in อย่างเดียว
  requestAnimationFrame(() => {
    el.style.transition = "opacity 3s ease";
    el.style.opacity = "0.75";
  });

  // ✅ คืน animation ให้ CSS (สำคัญมาก)
  setTimeout(() => {
    el.style.transition = "";
  }, 3100);
}


// =====================================================
// BACKGROUND LIFE
// =====================================================
async function loopBackground(el) {
  const endTime = Date.now() + 120000;

  while (Date.now() < endTime) {
    await sleep(1000);
  }

  el.classList.add("fadeout");
  await sleep(20000);

  releasePosition(el.dataset.posKey);
  el.remove();
}

// =====================================================
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
