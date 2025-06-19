// travel-tools.js — mini-app tools for index.html
// =======================================================
// 1. Quick Tokyo trip demo → sends to /api/ask
// 2. “View Airport Map” button → /airports
// 3. (future) Visualize flight path
// =======================================================

document.getElementById("quick-itinerary")?.addEventListener("click", async () => {
  const demoPrompt = `
    You are a travel planner.
    Create a detailed 3-day Tokyo itinerary focused on food and culture.
    Return the itinerary in JSON format:
    [
      { "day": 1, "morning": "...", "afternoon": "...", "evening": "..." },
      { "day": 2, "morning": "...", "afternoon": "...", "evening": "..." },
      { "day": 3, "morning": "...", "afternoon": "...", "evening": "..." }
    ]
    Return ONLY the JSON array. No extra text.
  `.trim();

  try {
    const res = await fetch("/api/ask", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ prompt: demoPrompt })
    });

    const data = await res.json();

    try {
      const parsed = JSON.parse(data.reply);
      console.log("✅ Demo itinerary:", parsed);

      // Save to localStorage for /itinerary
      localStorage.setItem("itineraryJSON", JSON.stringify(parsed));

      // Optional: show quick notification:
      alert(`Tokyo itinerary saved — ${parsed.length} days! Go to /itinerary to view.`);
    } catch (err) {
      console.error("AI reply is not JSON:", err);
      alert("Error: AI did not return a valid itinerary.");
    }
  } catch (err) {
    console.error(err);
    alert(`Couldn’t fetch demo itinerary — ${err.message}`);
  }
});

// ----------- “View Airport Map” button → /airports -----------------
document
  .getElementById("show-airport")
  ?.addEventListener("click", () => {
    window.location.href = "/airports";
  });

// ----------- “Visualize Flight Path” button — future -----------------
document
  .getElementById("show-flight")
  ?.addEventListener("click", () => {
    alert("Coming soon: Flight path visualization!");
  });
