const aiButton = document.getElementById("ai-button");
const aiChatBox = document.getElementById("ai-chat-box");
const aiClose = document.getElementById("ai-close");
const aiInput = document.getElementById("ai-input");
const aiSend = document.getElementById("ai-send");
const aiMessages = document.getElementById("ai-messages");

aiButton.addEventListener("click", () => {
    aiChatBox.style.display = "flex";
    aiInput.focus();
});

aiClose.addEventListener("click", () => {
    aiChatBox.style.display = "none";
});

async function sendAIMessage() {

    const message = aiInput.value.trim();

    if (!message) return;

    const userMessage = document.createElement("div");
    userMessage.classList.add("user-message");
    userMessage.textContent = message;

    aiMessages.appendChild(userMessage);

    aiInput.value = "";

    aiMessages.scrollTop = aiMessages.scrollHeight;


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


        if (!response.ok) {

            loadingMessage.remove();

            const errorText = await response.text();

            const aiMessage = document.createElement("div");
            aiMessage.classList.add("ai-message");

            aiMessage.textContent =
                errorText || "Something went wrong with the AI service.";

            aiMessages.appendChild(aiMessage);

            return;
        }


        loadingMessage.remove();


        const aiMessage = document.createElement("div");
        aiMessage.classList.add("ai-message");

        aiMessages.appendChild(aiMessage);


        const reader = response.body.getReader();

        const decoder = new TextDecoder();


        while (true) {

            const { value, done } = await reader.read();

            if (done) break;


            const chunk = decoder.decode(value, {
                stream: true
            });


            
            aiMessage.textContent += chunk;

            aiMessages.scrollTop = aiMessages.scrollHeight;
        }

    } catch (error) {

        console.error("AI request error:", error);

        loadingMessage.textContent =
            "Sorry, I couldn't connect to the AI service.";
    }
}


aiSend.addEventListener("click", sendAIMessage);


aiInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        sendAIMessage();
    }

});