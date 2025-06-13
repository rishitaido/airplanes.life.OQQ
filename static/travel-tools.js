// travel-tools.js — mini-app that talks to /api/itinerary
// =======================================================
// 1. Collects city / days / theme from the form
// 2. Sends the prompt to Flask
// 3. Renders a pretty accordion itinerary using renderFormattedItinerary
// -------------------------------------------------------

import { renderFormattedItinerary } from "./itinerary-display.js";

// ---------- DOM ELEMENTS -----------------------------------------
const form   = document.getElementById("itinerary-form");   // <form>
const output = document.getElementById("viewer-output");    // results pane
const btn    = document.getElementById("build-btn");        // submit button
const spin   = document.getElementById("build-spinner");    // tiny ⏳ icon
const save   = document.getElementById("save-btn");         // optional save

// ---------- MAIN EVENT -------------------------------------------
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // UX state
  btn.disabled = true;
  spin.hidden  = false;
  output.hidden = true;
  output.innerHTML = "";

  // -------- grab user inputs -------------------------------------
  const fd    = new FormData(form);
  const city  = (fd.get("city")  || "").trim();   // e.g. "New York City"
  const days  = fd.get("days")   || "3";          // "3"
  const theme = fd.get("theme")  || "Food & Culture";

  // -------- craft the prompt -------------------------------------
  const prompt = `
    You are a travel planner.
    Create a detailed ${days}-day itinerary for ${city} focused on ${theme}.
    Each day should have a clear header like "Day 1", "Day 2", etc.,
    followed by 4-6 bullet points of specific activities with times and locations.
    Be concise but complete. Do not skip any day.
  `.trim();

  try {
    // -------- call the backend -----------------------------------
    const res = await fetch("/api/itinerary", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);

    const { reply } = await res.json();        // backend ⇒ { reply: string }
    console.log("🟢 AI reply", reply);

    if (!reply) {
      showEmpty();
      return;
    }

    // -------- cache + pretty-render ------------------------------
    localStorage.setItem("itineraryText", reply);   // for /itinerary viewer
    renderFormattedItinerary(reply, output);

  } catch (err) {
    console.error(err);
    alert(`Couldn’t generate an itinerary – ${err.message}`);
  } finally {
    btn.disabled  = false;
    spin.hidden   = true;
    output.hidden = false;
    output.scrollIntoView({ behavior: "smooth" });
  }
});

// ---------- helpers ----------------------------------------------
function showEmpty() {
  output.innerHTML = "<p>Sorry, no itinerary was returned.</p>";
  output.hidden    = false;
}

// manual “Save” button (kept for legacy workflow)
save?.addEventListener("click", () => {
  const txt = localStorage.getItem("itineraryText");
  if (txt) {
    localStorage.setItem("itineraryData", txt);   // legacy key
    alert("Itinerary saved!");
  }
});
