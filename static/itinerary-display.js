// itinerary-display.js
// ===================================================
// JSON-based trip display — clean and smart
// Auto-detects JSON vs Text from localStorage
// ===================================================

export function renderJSONItinerary(itineraryArray, target = "#viewer-output") {
  const container =
    typeof target === "string" ? document.querySelector(target) : target;

  if (!container || !Array.isArray(itineraryArray)) return;

  container.innerHTML = ""; // Clear previous

  itineraryArray.forEach(day => {
    const html = `
      <p><strong>Morning:</strong> ${day.morning}</p>
      <p><strong>Afternoon:</strong> ${day.afternoon}</p>
      <p><strong>Evening:</strong> ${day.evening}</p>
    `;

    const block = document.createElement("details");
    block.className = "message ai";
    block.innerHTML = `
      <summary><strong>Day ${day.day}</strong></summary>
      <div style="margin-top: .5rem;">${html}</div>
    `;

    container.appendChild(block);
  });
}

export function renderTextItinerary(itineraryText, target = "#viewer-output") {
  const container =
    typeof target === "string" ? document.querySelector(target) : target;

  if (!container || !itineraryText) return;

  container.innerHTML = ""; // Clear previous

  const block = document.createElement("pre");
  block.className = "message ai";
  block.style.whiteSpace = "pre-wrap";
  block.style.padding = "1rem";
  block.textContent = itineraryText;

  container.appendChild(block);
}

// ===================================================
// Auto-render cached itinerary on page load
// ===================================================

window.addEventListener("DOMContentLoaded", () => {
  const savedJSON = localStorage.getItem("itineraryJSON");
  const savedText = localStorage.getItem("itineraryText");
  const timestamp = localStorage.getItem("itineraryTimestamp");

  // Expire cache after 10 min
  if (timestamp && Date.now() - parseInt(timestamp) > 10 * 60 * 1000) {
    console.warn("⚠️ Cached itinerary expired — clearing.");
    localStorage.removeItem("itineraryJSON");
    localStorage.removeItem("itineraryText");
    localStorage.removeItem("itineraryTimestamp");
  }


  if (savedJSON) {
    try {
      const itinerary = JSON.parse(savedJSON);
      if (Array.isArray(itinerary)) {
        renderJSONItinerary(itinerary);
        console.log(`✅ Loaded itineraryJSON — ${itinerary.length} days`);
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
        renderJSONItinerary(maybeArray);
        console.log(`✅ Loaded itineraryText (parsed JSON) — ${maybeArray.length} days`);
        return;
      }
    } catch {
      // Not JSON — treat as plain text
    }

    renderTextItinerary(savedText);
    console.log("✅ Loaded itineraryText (plain text)");
    return;
  }

  console.warn("⚠️ No cached itinerary found.");
});
