// chat.js — AI chat + itinerary hand-off
// ======================================
//  ▸ Sends prompts to /api/ask
//  ▸ Renders replies (stream or JSON)
//  ▸ Detects itinerary payloads → localStorage → /itinerary

//--------------------------------------------------------------
// Config
//--------------------------------------------------------------
const API_CHAT     = "/api/ask";
const API_GREETING = null;               // set to "/api/greeting" if you add one

import { renderFormattedItinerary } from "./itinerary-display.js";
//--------------------------------------------------------------
// Greeting banner
//--------------------------------------------------------------
const greetEl = document.getElementById("greeting");
if (greetEl) {
  const DEFAULT_MSG =
    "Hello there! I’m your AI travel concierge — ask me anything ✈️";

  if (API_GREETING) {
    fetch(API_GREETING)
      .then(r => (r.ok ? r.json() : null))
      .then(d => (greetEl.textContent = d?.msg ?? DEFAULT_MSG))
      .catch(() => (greetEl.textContent = DEFAULT_MSG));
  } else {
    greetEl.textContent = DEFAULT_MSG;
  }
}

//--------------------------------------------------------------
// DOM helpers
//--------------------------------------------------------------
const chatWrap = document.getElementById("chat-container");
const inputEl  = document.getElementById("chat-input");
const sendBtn  = document.getElementById("send-button");

const addMsg = (role, text = "") => {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = role === "ai" ? `AI: ${text}` : text;
  chatWrap.appendChild(div);
  chatWrap.scrollTop = chatWrap.scrollHeight;
  return div;
};

const saveItinerary = (replyText) => {
  localStorage.setItem("itineraryText", replyText);
  const btn = document.getElementById("open-itinerary");
  if (btn) {
    btn.hidden = false;
    btn.onclick = () => (window.location.href = "/itinerary");
  }
};

//--------------------------------------------------------------
// Main send logic
//--------------------------------------------------------------
const sendMessage = async () => {
  const dayInput = document.querySelector("input[name='days']");
  const selectedDays = dayInput ? parseInt(dayInput.value, 10) : null;
  const prompt = `You are a travel planning assistant. Create a full ${selectedDays}-day itinerary based on the following request.

  The itinerary must include exactly ${selectedDays} clearly labeled sections such as:

  Day 1:  
  Day 2:  
  Day 3:  
  ...  

  Do not summarize or skip days. Make sure each day has at least a morning, afternoon, and evening activity.

  User request: ${inputEl.value.trim()}`;
  
  if (!prompt.trim()) return;

  // UI: push user bubble + clear input
  addMsg("user", prompt);
  inputEl.value = "";
  inputEl.focus();

  // UI: placeholder AI bubble
  const aiDiv = addMsg("ai", "…");
  sendBtn.disabled = true;

  try {
    const res = await fetch(API_CHAT, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ prompt })
    });

    const isJSON = res.headers
      .get("content-type")
      ?.includes("application/json");

    //----------------------------------------------------------
    // 1) Standard JSON response (most common, fastest)
    //----------------------------------------------------------
    if (isJSON) {
      const data = await res.json();
      renderFormattedItinerary(data.reply, aiDiv);

      const expectedDays = selectedDays || null;

      // Count how many "Day X" entries were returned by the AI
      const dayMatches = data.reply.match(/Day \d+[:\s]/g) || [];
      const numReturnedDays = dayMatches.length;

      // Save if there is at least 1 day
      if (numReturnedDays > 0) {
        saveItinerary(data.reply);
      }

      // Alert if expected days were not fully returned
      if (expectedDays && numReturnedDays < expectedDays) {
        alert(`⚠️ Only ${numReturnedDays} day(s) were generated out of the ${expectedDays} requested. Try rewording your prompt for clarity.`);
      }

      return;
    }

    //----------------------------------------------------------
    // 2) Streaming / text response fallback
    //----------------------------------------------------------
    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      aiDiv.textContent = `AI: ${buffer}`;
      chatWrap.scrollTop = chatWrap.scrollHeight;
    }

    // Try to parse the finished stream as JSON
    try {
      const data = JSON.parse(buffer);
      if (data.reply?.includes("Day 1")) {
        saveItinerary(data.reply);
        if (data.reply?.includes("Day 1") && !data.reply.includes("Day 2")) {
          alert("⚠️ Only one day was generated. Try asking for a 3-day itinerary explicitly.");
        }
      }
    } catch {
      /* plain-text answer — nothing else to do */
    }
  } catch (err) {
    console.error(err);
    aiDiv.textContent = `AI: [ERROR] ${err.message}`;
  } finally {
    sendBtn.disabled = false;
  }
};

//--------------------------------------------------------------
// UI wiring
//--------------------------------------------------------------
sendBtn?.addEventListener("click", sendMessage);

inputEl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// If #input-area is a <form>, stop its natural submit
const inputArea = document.getElementById("input-area");
if (inputArea?.tagName === "FORM") {
  inputArea.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
  });
}

//--------------------------------------------------------------
// Quick-demo helper (optional)
//--------------------------------------------------------------
document
  .getElementById("quick-itinerary")
  ?.addEventListener("click", () => {
    inputEl.value =
      "Create a detailed 3-day Tokyo itinerary with headings like 'Day 1:', 'Day 2:', and 'Day 3:'. Include food and cultural activities.";
    sendMessage();
  });
