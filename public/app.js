const chat = document.querySelector("#chat");
const form = document.querySelector("#composer");
const input = document.querySelector("#message");
const status = document.querySelector("#status");
const listen = document.querySelector("#listen");

function addMessage(text, kind) { const item = document.createElement("article"); item.className = `message ${kind}`; item.textContent = text; chat.append(item); chat.scrollTop = chat.scrollHeight; return item; }
function speak(text) { if ("speechSynthesis" in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } }

form.addEventListener("submit", async (event) => {
  event.preventDefault(); const message = input.value.trim(); if (!message) return;
  addMessage(message, "user"); input.value = ""; status.textContent = "Mande-IA bɛ hakili kɛ...";
  try { const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); addMessage(data.reply, "assistant"); speak(data.reply); status.textContent = ""; }
  catch (error) { status.textContent = error.message || "A tɛ se ka jaabi di sisan."; }
});

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!Recognition) { listen.hidden = true; status.textContent = "I browser tɛ fɔli minɛ dɛmɛ; i bɛ se ka sɛbɛn."; }
else { const recognition = new Recognition(); recognition.lang = "fr-FR"; recognition.interimResults = false; recognition.onstart = () => { listen.setAttribute("aria-pressed", "true"); status.textContent = "Fɔ sisan..."; }; recognition.onend = () => listen.setAttribute("aria-pressed", "false"); recognition.onerror = () => status.textContent = "Fɔli minɛ tɛ se sisan. I bɛ se ka sɛbɛn."; recognition.onresult = (event) => { input.value = event.results[0][0].transcript; status.textContent = "I ka kuma bɛ kɔrɔ."; input.focus(); }; listen.addEventListener("click", () => recognition.start()); }
