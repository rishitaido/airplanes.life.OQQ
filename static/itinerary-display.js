// itinerary-display.js — single source of truth for pretty trip cards
// ---------------------------------------------------------------

export function renderFormattedItinerary(rawText, target = "#viewer-output") {
  const container =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!container || !rawText) return;

  container.innerHTML = "";                     // clear previous output
  const parts = rawText.split(/Day\s+(\d+)\s*[:\n]/i).slice(1); // ["1", " ...", "2", " ...", …]

  for (let i = 0; i < parts.length; i += 2) {
    const num  = parts[i];
    const body = parts[i + 1];
    if (!body) continue;

    const html = body
      .trim()
      .split(/\n+/)
      .map(l =>
        `<p>${l.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
               .replace(/^\*\s*/, "")}</p>`
      )
      .join("");

    const d = document.createElement("details");
    d.className = "message ai";
    d.innerHTML = `
      <summary><strong>Day ${num}</strong></summary>
      <div style="margin-top:.5rem">${html}</div>
    `;
    container.appendChild(d);
  }
}

// Auto-render any cached itinerary when a page containing #viewer-output loads
window.addEventListener("DOMContentLoaded", () => {
  const cached = localStorage.getItem("itineraryText");
  if (cached) renderFormattedItinerary(cached);
});


export function renderItineraryAsDropdowns(itineraryText) {
  const container = document.getElementById("viewer-output");
  if (!container) return;

  container.innerHTML = ""; // Clear previous output

  const daySections = itineraryText.split(/Day (\d+):/).slice(1);

  for (let i = 0; i < daySections.length; i += 2) {
    const dayNum = daySections[i];
    const dayContentRaw = daySections[i + 1];

    if (!dayContentRaw) continue;

    const dayTitle = `Day ${dayNum}`;
    const htmlContent = dayContentRaw
      .trim()
      .split(/\n+/)
      .map(line => `<p>${line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/^\* /, "")}</p>`)
      .join("");

    const block = document.createElement("details");
    block.classList.add("message", "ai");
    block.innerHTML = `
      <summary><strong>${dayTitle}</strong></summary>
      <div style="margin-top: 0.5rem;">${htmlContent}</div>
    `;

    container.appendChild(block);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("itineraryText");
  if (saved) {
    renderItineraryAsDropdowns(saved);
  }
});