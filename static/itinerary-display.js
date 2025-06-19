// itinerary-display-v2.js
// ===================================================
// JSON-based trip display — simple, clean, fast!
// Supports:
// - Auto-loading JSON itinerary from localStorage
// - Rendering each day (collapsible)
// - Handles long trips (5, 7, 10+ days)
// ===================================================

export function renderJSONItinerary(itineraryArray, target = "#viewer-output") {
  const container =
    typeof target === "string" ? document.querySelector(target) : target;

  // SAFETY: skip invalid data
  if (!container || !Array.isArray(itineraryArray)) {
    // No console.warn spam — fail silently
    return;
  }

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

// ===================================================
// Auto-render any cached JSON itinerary
// ===================================================

window.addEventListener("DOMContentLoaded", () => {
  const savedJSON = localStorage.getItem("itineraryJSON");
  if (savedJSON) {
    try {
      const itinerary = JSON.parse(savedJSON);
      if (Array.isArray(itinerary)) {
        renderJSONItinerary(itinerary);
        console.log(`✅ Loaded cached itinerary — ${itinerary.length} days`);
      }
    } catch (err) {
      // silently skip bad data
    }
  }
});
