// chat.js – AI chat + trip-planner integration
// ============================================
//
//  ▸ Shows greeting from /api/hello
//  ▸ Sends user prompts to /api/ask
//  ▸ Streams or reads JSON replies
//  ▸ Detects itinerary payloads → saves to localStorage → /itinerary
//  ▸ Minimal vanilla-JS, no external deps
// ------------------------------------------------------------------


// ─── Greeting ──────────────────────────────────────────────────────
fetch("/api/hello")
  .then(r => r.json())
  .then(d => {
    document.getElementById("greeting").textContent =
      d.msg ?? "Hello there!";
  })
  .catch(() => {
    document.getElementById("greeting").textContent = "Hello there!";
  });


// ─── DOM helpers ───────────────────────────────────────────────────
function addMessage(role, text = "") {
  const wrap = document.getElementById("chat-container");
  const div  = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = role === "ai" ? `AI: ${text}` : text;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return div;
}

function handleItinerary(payload) {
  // Save whole payload for viewer.js to consume
  localStorage.setItem("itineraryData", JSON.stringify(payload));
  const btn = document.getElementById("open-itinerary");
  if (!btn) return;

  btn.hidden = false;               // reveal button
  btn.onclick = () => {
    window.location.href = "/itinerary";
  };

}


// ─── Send prompt to backend ────────────────────────────────────────
async function sendMessage() {
  const inputEl = document.getElementById("chat-input");
  const prompt  = inputEl.value.trim();
  if (!prompt) return;

  // Show user message immediately
  addMessage("user", prompt);
  inputEl.value = "";

  // Placeholder div for the AI response (we’ll append to / edit it)
  const aiDiv = addMessage("ai", "");

  try {
    const res = await fetch("/api/ask", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt })
    });

    // If backend returns JSON all-at-once (no streaming) ────────────
    if (res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      aiDiv.textContent = `AI: ${data.reply ?? ""}`;

      if (data.itinerary) handleItinerary(data);
      return;
    }

    // Otherwise treat it as a streamed text response ────────────────
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      aiDiv.textContent = `AI: ${buffer}`;

      // keep chat scrolled to bottom
      document.getElementById("chat-container").scrollTop =
        document.getElementById("chat-container").scrollHeight;
    }

    // After stream finishes, see if the whole thing is valid JSON
    try {
      const data = JSON.parse(buffer);
      if (data.itinerary) handleItinerary(data);
    } catch (_) {
      /* plain-text answer – nothing special to do */
    }

  } catch (err) {
    aiDiv.textContent = `AI: [ERROR] ${err.message}`;
  }
}


// ─── UI wiring ────────────────────────────────────────────────────
document.getElementById("send-button")
        .addEventListener("click", sendMessage);

document.getElementById("chat-input")
        .addEventListener("keydown", e => {
          if (e.key === "Enter") {
            e.preventDefault();   // stop form submission / page refresh
            sendMessage();
          }
        });

// If #input-area is a <form>, stop its default submit reload
const area = document.getElementById("input-area");
if (area && area.tagName === "FORM") {
  area.addEventListener("submit", e => {
    e.preventDefault();
    sendMessage();
  });
}


// ─── Quick-demo button (optional) ─────────────────────────────────
const quickBtn = document.getElementById("quick-itinerary");
if (quickBtn) {
  quickBtn.addEventListener("click", () => {
    document.getElementById("chat-input").value =
      "Plan a 3-day trip to Tokyo focused on food and culture.";
    sendMessage();
  });
}
