// Cloudflare Pages serves this route from functions/api/chat.js.
// For a separate Worker, replace this path with its full deployed URL.
const WORKER_URL = "/api/chat";

// Get the page elements we will use.
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");
const statusText = document.getElementById("statusText");
const promptButtons = document.querySelectorAll("[data-prompt]");

// Keep the last 10 question-and-answer turns so follow-up questions make sense.
const conversationHistory = [];

function addMessage(message, speaker) {
  const bubble = document.createElement("div");
  bubble.className = "message " + speaker;

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = speaker === "user" ? "You" : "Beauty Advisor";

  const body = document.createElement("span");
  body.className = "message-body";
  body.textContent = message; // Keep text safe and preserve short paragraphs.

  bubble.append(label, body);
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function setBusy(busy) {
  userInput.disabled = busy;
  sendBtn.disabled = busy;
  statusText.textContent = busy ? "Finding your answer…" : "Ready to help";
}

// Start with a friendly greeting.
addMessage("Hi! Tell me what you’re looking for, and we’ll find a L’Oréal routine or product that fits.", "assistant");

// A suggested question fills the input, leaving the user free to edit it.
promptButtons.forEach((button) => {
  button.addEventListener("click", () => {
    userInput.value = button.dataset.prompt;
    userInput.focus();
  });
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = userInput.value.trim();
  if (!question) return;

  addMessage(question, "user");
  latestQuestion.textContent = question;
  userInput.value = "";

  if (WORKER_URL === "/api/chat" &&
      (location.hostname === "localhost" || location.hostname.endsWith(".app.github.dev"))) {
    addMessage("Live replies aren’t connected in this preview yet. You can still explore the page and try the question ideas.", "assistant");
    return;
  }

  setBusy(true);
  try {
    // Send prior turns and this question to the Worker. The API key stays in Cloudflare.
    const messages = [...conversationHistory, { role: "user", content: question }];
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The service is unavailable.");

    const answer = data.choices?.[0]?.message?.content;
    if (!answer) throw new Error("The assistant returned an empty answer.");

    addMessage(answer, "assistant");
    conversationHistory.push({ role: "user", content: question });
    conversationHistory.push({ role: "assistant", content: answer });
    if (conversationHistory.length > 20) conversationHistory.splice(0, 2);
  } catch (error) {
    addMessage("Sorry, I couldn't get an answer. Please try again in a moment.", "assistant");
    console.error("Chat request failed:", error);
  } finally {
    setBusy(false);
    userInput.focus();
  }
});
