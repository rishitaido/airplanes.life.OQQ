// globe-tools.js — sticky itinerary + AI place lookup chat
console.log("🟢 globe-tools.js loaded");

function renderStickyItinerary() {
  const savedJSON = localStorage.getItem("itineraryJSON");
  const savedText = localStorage.getItem("itineraryText");
  const container = document.getElementById("sticky-itinerary");

  if (!container) return;

  container.innerHTML = "";

  if (savedJSON) {
    try {
      const itinerary = JSON.parse(savedJSON);
      if (Array.isArray(itinerary)) {
        renderStickyNotes(itinerary);
        return;
      }
    } catch (err) {
      console.warn("⚠️ Invalid itineraryJSON:", err);
    }
  }

  if (savedText) {
    try {
      const maybeArray = JSON.parse(savedText);
      if (Array.isArray(maybeArray)) {
        renderStickyNotes(maybeArray);
        return;
      }
    } catch {
      // Not JSON — plain text
    }

    const note = document.createElement("pre");
    note.className = "map-note";
    note.textContent = savedText;
    container.appendChild(note);
    console.log("✅ Sticky Itinerary Loaded (Text)");
  }
}

function renderStickyNotes(itinerary) {
  const container = document.getElementById("sticky-itinerary");
  if (!container) return;

  itinerary.forEach(day => {
    const note = document.createElement("div");
    note.className = "map-note";
    note.innerHTML = `
      <button class="map-note-close" aria-label="Close note">&times;</button>
      <strong>Day ${day.day}</strong><br>
      <em>Morning:</em> ${day.morning}<br>
      <em>Afternoon:</em> ${day.afternoon}<br>
      <em>Evening:</em> ${day.evening}
    `;
    note.querySelector(".map-note-close").addEventListener("click", () => {
      note.remove();
    });
    container.appendChild(note);
  });
  console.log(`✅ Sticky Itinerary Loaded (${itinerary.length} days)`);
}

document.getElementById("ai-map-chat")?.addEventListener("click", () => {
  document.getElementById("map-chat-box")?.classList.toggle("hidden");
});

document.getElementById("map-chat-send")?.addEventListener("click", async () => {
  const input = document.getElementById("map-chat-input").value.trim();
  if (!input) return;

  document.getElementById("map-chat-response").textContent = "Thinking...";

  const prompt = `You are an assistant that helps users find addresses or info about trip places. Answer: "${input}"`;

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      console.error("AI Map Chat error:", res.status, res.statusText);
      document.getElementById("map-chat-response").textContent = "AI error: " + res.status;
      return;
    }

    const data = await res.json();
    document.getElementById("map-chat-response").textContent = data.reply || "(no response)";
  } catch (err) {
    console.error("AI Map Chat fetch error:", err);
    document.getElementById("map-chat-response").textContent = "Error contacting AI.";
  }
});

// Enable Enter to send in AI chat (Shift+Enter = new line)
document.getElementById("map-chat-input")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    document.getElementById("map-chat-send").click();
  }
});

renderStickyItinerary();
