const aiButton = document.getElementById("ai-button");
const aiChatBox = document.getElementById("ai-chat-box");
const aiClose = document.getElementById("ai-close");

const aiInput = document.getElementById("ai-input");
const aiSend = document.getElementById("ai-send");

const aiMessages = document.getElementById("ai-messages");

// Open chat
aiButton.addEventListener("click", () => {
    aiChatBox.style.display = "flex";
    aiInput.focus();
});

// Close chat
aiClose.addEventListener("click", () => {
    aiChatBox.style.display = "none";
});

// Send message
async function sendAIMessage() {

    const message = aiInput.value.trim();

    if (!message) {
        return;
    }

    // Display user's message
    const userMessage = document.createElement("div");

    userMessage.classList.add("user-message");
    userMessage.textContent = message;

    aiMessages.appendChild(userMessage);

    // Clear input
    aiInput.value = "";

    // Scroll down
    aiMessages.scrollTop = aiMessages.scrollHeight;

    // Loading message
    const loadingMessage = document.createElement("div");

    loadingMessage.classList.add("ai-message");
    loadingMessage.textContent = "Thinking...";

    aiMessages.appendChild(loadingMessage);

    try {

        const response = await fetch("/ai/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });

        const data = await response.json();

        // Remove loading message
        loadingMessage.remove();

        // Display AI response
        const aiMessage = document.createElement("div");

        aiMessage.classList.add("ai-message");

        aiMessage.textContent =
            data.response || "Sorry, I couldn't generate a response.";

        aiMessages.appendChild(aiMessage);

        // Scroll down
        aiMessages.scrollTop = aiMessages.scrollHeight;

    } catch (error) {

        console.error("AI request error:", error);

        loadingMessage.textContent =
            "Sorry, I couldn't connect to the AI service.";
    }
}

// Send button
aiSend.addEventListener("click", sendAIMessage);

// Enter key
aiInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        sendAIMessage();
    }

});