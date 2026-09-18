// ============================================================
// BIODIVERSITY INTELLIGENCE AI
// Chat Frontend
// ============================================================

const API_URL = "http://127.0.0.1:8000";

const chat = document.getElementById("chat");
const questionInput = document.getElementById("question");
const sendButton = document.getElementById("sendButton");


// ============================================================
// USE SUGGESTION
// ============================================================

function useSuggestion(button) {
    questionInput.value = button.textContent.trim();
    sendMessage();
}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    const question = questionInput.value.trim();

    if (!question || sendButton.disabled) {
        return;
    }

    // Remove welcome screen after first question
    removeWelcome();

    // Display user's message
    addUserMessage(question);

    // Clear input
    questionInput.value = "";
    resizeTextarea();

    // Disable button while processing
    sendButton.disabled = true;

    // Show scientific evidence loading animation
    const thinkingMessage = addThinkingMessage();

    scrollToBottom();

    try {

        // ----------------------------------------------------
        // CALL FASTAPI BACKEND
        // ----------------------------------------------------

        const response = await fetch(`${API_URL}/ask`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                question: question
            })
        });


        // ----------------------------------------------------
        // HANDLE API ERROR
        // ----------------------------------------------------

        if (!response.ok) {

            let errorMessage =
                "Unable to generate a recommendation.";

            try {

                const data = await response.json();

                if (data.detail) {
                    errorMessage = data.detail;
                }

            } catch (_) {
                // Keep default error message
            }

            throw new Error(errorMessage);
        }


        // ----------------------------------------------------
        // READ RESPONSE
        // ----------------------------------------------------

        const data = await response.json();

        if (!data.answer) {
            throw new Error(
                "The server returned an empty answer."
            );
        }


        // Remove loading animation
        thinkingMessage.remove();

        // Display AI answer
        addAssistantMessage(data.answer);

    }

    catch (error) {

        thinkingMessage.remove();

        addErrorMessage(
            error.message ||
            "Unable to connect to the Biodiversity Intelligence AI server."
        );
    }

    finally {

        sendButton.disabled = false;

        questionInput.focus();

        scrollToBottom();
    }
}


// ============================================================
// ADD USER MESSAGE
// ============================================================

function addUserMessage(text) {

    const message = document.createElement("div");

    message.className = "message user";

    const content = document.createElement("div");

    content.className = "message-content";
    content.textContent = text;

    message.appendChild(content);

    chat.appendChild(message);
}


// ============================================================
// ADD ASSISTANT MESSAGE
// ============================================================

function addAssistantMessage(answer) {

    const message = document.createElement("div");

    message.className = "message assistant";


    // Assistant avatar
    const avatar = document.createElement("div");

    avatar.className = "avatar";
    avatar.textContent = "🌱";


    // Answer container
    const content = document.createElement("div");

    content.className = "message-content";

    formatAnswer(answer, content);


    message.appendChild(avatar);
    message.appendChild(content);

    chat.appendChild(message);

    scrollToBottom();
}


// ============================================================
// FORMAT RAG ANSWER
// ============================================================

function formatAnswer(answer, container) {

    const pattern =
        /(Assessment|Recommendation|Why|Evidence|Limitations):/g;

    const parts = answer.split(pattern);


    // --------------------------------------------------------
    // MODEL FOLLOWED EXPECTED FORMAT
    // --------------------------------------------------------

    if (parts.length > 1) {

        for (let i = 1; i < parts.length; i += 2) {

            const heading = parts[i];

            const text =
                (parts[i + 1] || "").trim();

            if (!text) {
                continue;
            }


            const section =
                document.createElement("div");

            section.className = "answer-section";


            // Special styling for evidence
            if (heading === "Evidence") {
                section.classList.add(
                    "evidence-section"
                );
            }


            const title =
                document.createElement("h3");

            title.textContent = heading;


            const paragraph =
                document.createElement("p");

            paragraph.textContent = text;


            section.appendChild(title);
            section.appendChild(paragraph);

            container.appendChild(section);
        }

    }


    // --------------------------------------------------------
    // FALLBACK
    // --------------------------------------------------------

    if (!container.children.length) {

        const paragraph =
            document.createElement("p");

        paragraph.textContent = answer;

        container.appendChild(paragraph);
    }
}


// ============================================================
// SCIENTIFIC EVIDENCE LOADING ANIMATION
// ============================================================

function addThinkingMessage() {

    const message = document.createElement("div");
    message.className = "message assistant loading-message";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🌱";

    const content = document.createElement("div");
    content.className = "message-content";

    content.innerHTML = `
        <div class="rag-loader">

            <div class="pixel-scene">

                <div class="pixel-sun"></div>

                <div class="pixel-crop">

                    <div class="crop-head"></div>

                    <div class="crop-leaf crop-leaf-left"></div>
                    <div class="crop-leaf crop-leaf-right"></div>

                    <div class="crop-stem"></div>

                </div>

                <div class="pixel-soil">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

            </div>

            <div class="loader-details">

                <div class="loader-title">
                    Growing an evidence-based answer...
                </div>

                <div class="loader-status">
                    Searching scientific evidence
                    <span class="loading-dot">.</span>
                    <span class="loading-dot">.</span>
                    <span class="loading-dot">.</span>
                </div>

            </div>

        </div>
    `;

    message.appendChild(avatar);
    message.appendChild(content);

    chat.appendChild(message);

    return message;
}

// ============================================================
// ERROR MESSAGE
// ============================================================

function addErrorMessage(text) {

    const message =
        document.createElement("div");

    message.className =
        "message assistant";


    const avatar =
        document.createElement("div");

    avatar.className = "avatar";
    avatar.textContent = "🌱";


    const content =
        document.createElement("div");

    content.className =
        "message-content error-message";

    content.textContent = text;


    message.appendChild(avatar);
    message.appendChild(content);

    chat.appendChild(message);
}


// ============================================================
// REMOVE WELCOME SCREEN
// ============================================================

function removeWelcome() {

    const welcome =
        document.querySelector(".welcome");

    if (welcome) {
        welcome.remove();
    }
}


// ============================================================
// AUTO SCROLL
// ============================================================

function scrollToBottom() {

    requestAnimationFrame(() => {

        chat.scrollTo({
            top: chat.scrollHeight,
            behavior: "smooth"
        });

    });
}


// ============================================================
// AUTO RESIZE TEXTAREA
// ============================================================

function resizeTextarea() {

    questionInput.style.height = "auto";

    questionInput.style.height =
        Math.min(
            questionInput.scrollHeight,
            130
        ) + "px";
}


// ============================================================
// INPUT LISTENER
// ============================================================

questionInput.addEventListener(
    "input",
    resizeTextarea
);


// ============================================================
// ENTER TO SEND
// SHIFT + ENTER FOR NEW LINE
// ============================================================

questionInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


// ============================================================
// INITIAL FOCUS
// ============================================================

window.addEventListener(
    "load",
    function () {

        questionInput.focus();
    }
);