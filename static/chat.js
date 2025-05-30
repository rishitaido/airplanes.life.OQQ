// chat.js  – handles greeting + chat

// ----- Greeting -----
fetch("/api/hello")
  .then(r => r.json())
  .then(d => document.getElementById("greeting").textContent = d.msg)
  .catch(() => document.getElementById("greeting").textContent = "Hello!");

// ----- DOM helpers -----
function addMessage(role, text) {
  const wrap = document.getElementById("chat-container");
  const div  = document.createElement("div");
  div.className = `message ${role}`;
  div.textContent = role === "ai" ? `AI: ${text}` : text;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return div;
}

// ----- Send prompt to backend -----
async function sendMessage() {
  const input  = document.getElementById("chat-input");
  const prompt = input.value.trim();
  if (!prompt) return;

  addMessage("user", prompt);
  input.value = "";
  const aiDiv = addMessage("ai", "");

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      aiDiv.textContent = `AI: Error ${res.status}`;
      return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      aiDiv.textContent += decoder.decode(value, { stream: true });
      document.getElementById("chat-container").scrollTop =
        document.getElementById("chat-container").scrollHeight;
    }
  } catch (err) {
    aiDiv.textContent = `AI: [ERROR] ${err.message}`;
  }
}

// ----- Wire up UI -----
document.getElementById("send-button")
        .addEventListener("click", sendMessage);

document.getElementById("chat-input")
        .addEventListener("keydown", e => {
          if (e.key === "Enter") sendMessage();
        });

document.getElementById("input-area")
        .addEventListener("submit", e => {
          e.preventDefault();   // ← new
          sendMessage();
        });

/* you can drop the old click listener on #send-button
   if you like, or leave it − both now call sendMessage() */

