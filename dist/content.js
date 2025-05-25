/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!*************************!*\
  !*** ./src/content.tsx ***!
  \*************************/

// Content script that runs in the context of web pages
let isInitialized = false;
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 3;
function handleConnectionError() {
    if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
        reconnectionAttempts++;
        console.log(`[Contex.ly Content] Attempting to reconnect (attempt ${reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})...`);
        // Reset initialization flag to allow reinitialization
        isInitialized = false;
        // Attempt to reinitialize after a short delay
        setTimeout(() => {
            initializeContentScript();
        }, 1000 * reconnectionAttempts); // Exponential backoff
    }
    else {
        console.log("[Contex.ly Content] Max reconnection attempts reached. Please refresh the page.");
    }
}
function initializeContentScript() {
    if (isInitialized) {
        console.log("Content script already initialized, skipping...");
        return;
    }
    isInitialized = true;
    try {
        console.log("=== Contex.ly Content Script Started ===");
        console.log("Document readyState:", document.readyState);
        function logContent(message) {
            console.log(`[Contex.ly Content] ${message}`);
        }
        // Log initial state
        logContent("Initializing content script...");
        // Add connection error listener
        chrome.runtime.onConnect.addListener((port) => {
            port.onDisconnect.addListener(() => {
                if (chrome.runtime.lastError) {
                    logContent("Connection lost: " + chrome.runtime.lastError.message);
                    handleConnectionError();
                }
            });
        });
        // Check extension context periodically
        function checkExtensionContext() {
            try {
                // This will throw if context is invalidated
                chrome.runtime.getURL("");
            }
            catch (error) {
                logContent("Extension context invalid, attempting to recover...");
                handleConnectionError();
                return false;
            }
            return true;
        }
        // Periodic context check
        const contextCheckInterval = setInterval(() => {
            if (!checkExtensionContext()) {
                clearInterval(contextCheckInterval);
            }
        }, 5000);
        const metaphorStyles = {
            relationship: "Explain using relationship dynamics, dating scenarios, and common couple experiences. Use examples of how partners interact, communicate, and grow together.",
            "highschool-drama": "Explain using typical high school scenarios, cliques, social dynamics, and teen drama. Think Mean Girls, popular kids vs outcasts, cafeteria politics, and after-school drama.",
            "kid-friendly": "Explain as if talking to a 10-year-old child. Use simple words, fun examples, and relatable situations from a kid's perspective, like school, toys, or playground scenarios.",
            "pop-culture": "Explain using references to movies, TV shows, celebrities, and current trends. Use well-known pop culture moments and characters that most people would recognize.",
            "gossip-girl": 'Explain in the style of Gossip Girl - dramatic, scandalous, and full of Upper East Side drama. Use fashion, luxury, and social status references. Start with "Hey Upper East Siders..." and end with "XOXO, Gossip Girl"',
            "gen-z": "Explain using Gen Z slang, TikTok references, and modern internet culture. Include emojis, current memes, and trending phrases. Keep it very casual and slightly chaotic.",
            "harry-potter": "Explain using references to the Harry Potter universe, including magical concepts, Hogwarts houses, spells, and characters.",
            marvel: "Explain using references to the Marvel Cinematic Universe, including superheroes, villains, infinity stones, and iconic MCU moments.",
        };
        // Inject styles
        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
      .contex-ly-container {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .contex-ly-modal {
        max-width: 28rem;
        width: 100%;
        max-height: 90vh;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        padding: 1.5rem;
        position: relative;
        margin: 1rem;
        animation: contex-ly-fade-in 0.15s ease-out;
        overflow-y: auto;
      }

      .contex-ly-header {
        text-align: center;
        margin-bottom: 1.5rem;
        padding-right: 1.5rem;
      }

      .contex-ly-title {
        font-size: 1.25rem;
        line-height: 1.75rem;
        font-weight: 600;
        color: rgb(120 53 15);
        margin: 0 0 0.5rem 0;
      }

      .contex-ly-close {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        color: rgb(148 163 184);
        font-size: 1.25rem;
        font-weight: 700;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        line-height: 1;
      }

      .contex-ly-close:hover {
        color: rgb(71 85 105);
      }

      .contex-ly-label {
        display: block;
        margin-bottom: 0.25rem;
        color: rgb(100 116 139);
        font-size: 0.75rem;
        line-height: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .contex-ly-text-container {
        background-color: rgb(241 245 249);
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: rgb(51 65 85);
        margin-bottom: 1.5rem;
        max-height: 8rem;
        overflow-y: auto;
      }

      .contex-ly-metaphor {
        background-color: rgb(254 249 195);
        border-left: 4px solid rgb(250 204 21);
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        margin: 1rem 0;
      }

      .contex-ly-metaphor-title {
        font-size: 1rem;
        font-weight: 600;
        color: rgb(120 53 15);
        margin-bottom: 0.5rem;
        line-height: 1.5;
      }

      .contex-ly-metaphor-body {
        font-size: 0.875rem;
        line-height: 1.5;
        color: rgb(51 65 85);
      }

      .contex-ly-select-wrapper {
        margin-bottom: 1.5rem;
      }

      .contex-ly-select {
        width: 100%;
        background-color: rgb(249 250 251);
        border: 1px solid rgb(229 231 235);
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: rgb(51 65 85);
        appearance: none;
        background-image: url('data:image/svg+xml;charset=US-ASCII,<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L6 6L11 1" stroke="%2364748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
        background-repeat: no-repeat;
        background-position: right 1rem center;
        padding-right: 2.5rem;
      }

      .contex-ly-button-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: space-between;
        align-items: center;
        margin-top: 1.5rem;
      }

      .contex-ly-button {
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 500;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        border: none;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .contex-ly-button-primary {
        background-color: rgb(250 204 21);
        color: rgb(120 53 15);
      }

      .contex-ly-button-primary:hover {
        background-color: rgb(234 179 8);
      }

      .contex-ly-button-secondary {
        background-color: white;
        color: rgb(75 85 99);
        border: 1px solid rgb(209 213 219);
      }

      .contex-ly-button-secondary:hover {
        background-color: rgb(249 250 251);
      }

      .contex-ly-button-ghost {
        background-color: transparent;
        color: rgb(75 85 99);
      }

      .contex-ly-button-ghost:hover {
        background-color: rgb(249 250 251);
      }

      .contex-ly-float-button {
        position: absolute;
        background-color: rgb(250 204 21);
        color: rgb(120 53 15);
        padding: 0.625rem 1.25rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        border: none;
        display: none;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.15s ease;
      }

      .contex-ly-float-button:hover {
        background-color: rgb(234 179 8);
        transform: translateY(-1px);
      }

      @keyframes contex-ly-fade-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }

      .contex-ly-initial-buttons {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }

      .contex-ly-button-initial {
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 500;
        padding: 0.625rem 1.25rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .contex-ly-button-maybe {
        background-color: white;
        color: rgb(75 85 99);
        border: 1px solid rgb(209 213 219);
      }

      .contex-ly-button-maybe:hover {
        background-color: rgb(249 250 251);
      }

      .contex-ly-button-reframe {
        background-color: rgb(16 185 129);
        color: white;
      }

      .contex-ly-button-reframe:hover {
        background-color: rgb(5 150 105);
      }
    `;
        document.head.appendChild(styleSheet);
        logContent("Styles injected");
        // Create and inject the result container
        const container = document.createElement("div");
        container.id = "contex-ly-result";
        container.className = "contex-ly-container";
        container.style.display = "none";
        document.body.appendChild(container);
        logContent("Result container ready");
        // Create floating button
        const floatButton = document.createElement("button");
        floatButton.className = "contex-ly-float-button";
        floatButton.textContent = "Reframe this?";
        floatButton.style.display = "none";
        document.body.appendChild(floatButton);
        logContent("Float button created");
        function createStyleSelector(currentText) {
            const options = Object.entries(metaphorStyles)
                .map(([value, description]) => {
                const displayName = {
                    relationship: "💕 Relationship",
                    "highschool-drama": "🏫 High School Drama",
                    "kid-friendly": "🎈 Kid-Friendly",
                    "pop-culture": "🎬 Pop Culture",
                    "gossip-girl": "👗 Gossip Girl",
                    "gen-z": "📱 Gen Z",
                    "harry-potter": "⚡ Harry Potter",
                    marvel: "🦸‍♂️ Marvel",
                }[value] || value;
                return `<option value="${value}" title="${description}">${displayName}</option>`;
            })
                .join("");
            return `<select id="metaphor-style" class="contex-ly-select">${options}</select>`;
        }
        function closeContainer() {
            const container = document.getElementById("contex-ly-result");
            if (container) {
                // Remove the container from interaction
                container.style.display = "none";
                // Clean up event listeners
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("keydown", handleEscape);
                // Clear the container content
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }
        }
        // Define event handlers at module scope
        const handleClickOutside = (e) => {
            const container = document.getElementById("contex-ly-result");
            if (container &&
                container.style.display === "flex" &&
                !container.contains(e.target)) {
                closeContainer();
            }
        };
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                closeContainer();
            }
        };
        function showResult(result, currentText = "", showStyleSelector = true) {
            try {
                // Clear existing content and state
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
                container.className = "contex-ly-container";
                // Create modal container
                const modalDiv = document.createElement("div");
                modalDiv.className = "contex-ly-modal";
                // Create header
                const headerDiv = document.createElement("div");
                headerDiv.className = "contex-ly-header";
                const title = document.createElement("h3");
                title.className = "contex-ly-title";
                title.textContent = "Let's break it down 🧠";
                const closeButton = document.createElement("button");
                closeButton.className = "contex-ly-close";
                closeButton.setAttribute("aria-label", "Close");
                closeButton.setAttribute("type", "button");
                closeButton.textContent = "✕";
                closeButton.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeContainer();
                });
                headerDiv.appendChild(title);
                modalDiv.appendChild(closeButton);
                modalDiv.appendChild(headerDiv);
                // Add selected text if present
                if (currentText) {
                    const selectedTextLabel = document.createElement("label");
                    selectedTextLabel.className = "contex-ly-label";
                    selectedTextLabel.textContent = "Original:";
                    modalDiv.appendChild(selectedTextLabel);
                    const selectedTextDiv = document.createElement("div");
                    selectedTextDiv.className = "contex-ly-text-container";
                    selectedTextDiv.textContent = currentText;
                    modalDiv.appendChild(selectedTextDiv);
                }
                // Add explanation area with new metaphor styling
                if (!showStyleSelector || result.includes("Explanation:")) {
                    const metaphorDiv = document.createElement("div");
                    metaphorDiv.className = "contex-ly-metaphor";
                    const metaphorTitle = document.createElement("div");
                    metaphorTitle.className = "contex-ly-metaphor-title";
                    metaphorTitle.textContent = "Here's how to think about it...";
                    const metaphorBody = document.createElement("div");
                    metaphorBody.className = "contex-ly-metaphor-body";
                    metaphorBody.innerHTML = result.replace("Explanation:", "").trim();
                    metaphorDiv.appendChild(metaphorTitle);
                    metaphorDiv.appendChild(metaphorBody);
                    modalDiv.appendChild(metaphorDiv);
                    // Add action buttons for metaphor result view
                    const buttonContainer = document.createElement("div");
                    buttonContainer.className = "contex-ly-button-container";
                    const gotItButton = document.createElement("button");
                    gotItButton.className = "contex-ly-button contex-ly-button-ghost";
                    gotItButton.innerHTML = "😎 Got it";
                    gotItButton.addEventListener("click", closeContainer);
                    const discussButton = document.createElement("button");
                    discussButton.className =
                        "contex-ly-button contex-ly-button-secondary";
                    discussButton.innerHTML = "🎤 Let's discuss";
                    const reframeButton = document.createElement("button");
                    reframeButton.className = "contex-ly-button contex-ly-button-primary";
                    reframeButton.innerHTML = "🔄 Transform it again";
                    buttonContainer.appendChild(gotItButton);
                    buttonContainer.appendChild(discussButton);
                    buttonContainer.appendChild(reframeButton);
                    modalDiv.appendChild(buttonContainer);
                }
                // Create controls section if style selector is needed
                if (showStyleSelector) {
                    const selectLabel = document.createElement("label");
                    selectLabel.className = "contex-ly-label";
                    selectLabel.textContent = "Explain to me in terms of:";
                    modalDiv.appendChild(selectLabel);
                    const selectWrapper = document.createElement("div");
                    selectWrapper.className = "contex-ly-select-wrapper";
                    selectWrapper.innerHTML = createStyleSelector(currentText);
                    modalDiv.appendChild(selectWrapper);
                    // Add initial action buttons
                    const buttonContainer = document.createElement("div");
                    buttonContainer.className = "contex-ly-initial-buttons";
                    const cancelButton = document.createElement("button");
                    cancelButton.className =
                        "contex-ly-button-initial contex-ly-button-maybe";
                    cancelButton.textContent = "Maybe later";
                    cancelButton.addEventListener("click", closeContainer);
                    const reframeButton = document.createElement("button");
                    reframeButton.className =
                        "contex-ly-button-initial contex-ly-button-reframe";
                    reframeButton.id = "regenerate";
                    reframeButton.innerHTML = "Reframe it 💡";
                    buttonContainer.appendChild(cancelButton);
                    buttonContainer.appendChild(reframeButton);
                    modalDiv.appendChild(buttonContainer);
                    // Add event listener for reframe button
                    reframeButton.addEventListener("click", async () => {
                        const styleSelect = selectWrapper.querySelector("#metaphor-style");
                        if (styleSelect) {
                            const selectedStyle = styleSelect.value;
                            // Show loading state
                            const loadingDiv = document.createElement("div");
                            loadingDiv.className = "contex-ly-metaphor";
                            loadingDiv.innerHTML = `
                <div class="contex-ly-metaphor-title">
                  Cooking up a take...
                </div>
                <div class="contex-ly-metaphor-body">
                  Just a moment while we spice things up in ${selectedStyle} style
                </div>
              `;
                            // Replace any existing metaphor div
                            const existingMetaphor = modalDiv.querySelector(".contex-ly-metaphor");
                            if (existingMetaphor) {
                                modalDiv.replaceChild(loadingDiv, existingMetaphor);
                            }
                            else {
                                modalDiv.insertBefore(loadingDiv, buttonContainer);
                            }
                            try {
                                const explanation = await generateExplanation(currentText, selectedStyle);
                                const isError = explanation.startsWith("Error");
                                const metaphorDiv = document.createElement("div");
                                metaphorDiv.className = "contex-ly-metaphor";
                                if (isError) {
                                    metaphorDiv.innerHTML = `
                    <div class="contex-ly-metaphor-title" style="color: rgb(239 68 68);">
                      Oops! Something went wrong
                    </div>
                    <div class="contex-ly-metaphor-body">
                      ${explanation}
                    </div>
                  `;
                                }
                                else {
                                    metaphorDiv.innerHTML = `
                    <div class="contex-ly-metaphor-title">
                      Here's how to think about it...
                    </div>
                    <div class="contex-ly-metaphor-body">
                      ${explanation}
                    </div>
                  `;
                                }
                                modalDiv.replaceChild(metaphorDiv, loadingDiv);
                                // Update buttons for metaphor result view
                                const newButtonContainer = document.createElement("div");
                                newButtonContainer.className = "contex-ly-button-container";
                                const gotItButton = document.createElement("button");
                                gotItButton.className =
                                    "contex-ly-button contex-ly-button-ghost";
                                gotItButton.innerHTML = "😎 Got it";
                                gotItButton.addEventListener("click", closeContainer);
                                const discussButton = document.createElement("button");
                                discussButton.className =
                                    "contex-ly-button contex-ly-button-secondary";
                                discussButton.innerHTML = "🎤 Let's discuss";
                                const reframeAgainButton = document.createElement("button");
                                reframeAgainButton.className =
                                    "contex-ly-button contex-ly-button-primary";
                                reframeAgainButton.innerHTML = "🔄 Transform it again";
                                newButtonContainer.appendChild(gotItButton);
                                newButtonContainer.appendChild(discussButton);
                                newButtonContainer.appendChild(reframeAgainButton);
                                // Replace the old button container
                                buttonContainer.replaceWith(newButtonContainer);
                            }
                            catch (error) {
                                const e = error;
                                const errorDiv = document.createElement("div");
                                errorDiv.className = "contex-ly-metaphor";
                                errorDiv.innerHTML = `
                  <div class="contex-ly-metaphor-title" style="color: rgb(239 68 68);">
                    Oops! Something went wrong
                  </div>
                  <div class="contex-ly-metaphor-body">
                    Failed to generate explanation: ${e.message}
                  </div>
                `;
                                modalDiv.replaceChild(errorDiv, loadingDiv);
                            }
                        }
                    });
                }
                container.appendChild(modalDiv);
                container.style.display = "flex";
                // Add global event listeners
                document.addEventListener("mousedown", handleClickOutside);
                document.addEventListener("keydown", handleEscape);
            }
            catch (error) {
                const e = error;
                console.error("Error in showResult:", e);
            }
        }
        // Update message listener with error handling
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!checkExtensionContext()) {
                return false;
            }
            logContent(`Received message: ${JSON.stringify(request)}`);
            if (request.type === "EXPLAIN_TEXT" && request.text) {
                logContent(`Processing explanation request for text: ${request.text}`);
                // Show initial style selection UI
                const initialContent = `
          <div>
            <strong>Selected Text:</strong>
            <div class="contex-ly-text-container">
              "${request.text}"
            </div>
            <div style="margin-top: 16px;">
              <strong>How would you like this explained?</strong>
            </div>
          </div>
        `;
                try {
                    showResult(initialContent, request.text, true);
                    sendResponse({ status: "success" });
                }
                catch (error) {
                    const e = error;
                    logContent(`Error showing result: ${e.message}`);
                    sendResponse({ status: "error", message: e.message });
                }
            }
            return true;
        });
        // Update the document-level event listeners
        document.addEventListener("mousedown", (e) => {
            const container = document.getElementById("contex-ly-result");
            if (container &&
                container.style.display === "flex" &&
                !container.contains(e.target)) {
                closeContainer();
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                const container = document.getElementById("contex-ly-result");
                if (container && container.style.display === "flex") {
                    closeContainer();
                }
            }
        });
        // Handle text selection
        let selectedText = "";
        document.addEventListener("mouseup", (e) => {
            const selection = window.getSelection();
            const text = selection === null || selection === void 0 ? void 0 : selection.toString().trim();
            if (text && text !== selectedText) {
                selectedText = text;
                const range = selection === null || selection === void 0 ? void 0 : selection.getRangeAt(0);
                const rect = range === null || range === void 0 ? void 0 : range.getBoundingClientRect();
                if (rect) {
                    // Position the button below and to the right of the selection
                    const scrollX = window.scrollX || window.pageXOffset;
                    const scrollY = window.scrollY || window.pageYOffset;
                    floatButton.style.display = "block";
                    floatButton.style.left = `${scrollX + rect.left + rect.width / 2 - 50}px`;
                    floatButton.style.top = `${scrollY + rect.bottom + 10}px`;
                }
            }
            else if (!text) {
                // Hide button if no text is selected
                selectedText = "";
                floatButton.style.display = "none";
            }
        });
        // Handle button click
        floatButton.addEventListener("click", () => {
            if (selectedText) {
                // Hide the float button
                floatButton.style.display = "none";
                // Show initial style selection UI
                const initialContent = `
          <div>
            <strong>Selected Text:</strong>
            <div class="contex-ly-text-container">
              "${selectedText}"
            </div>
            <div style="margin-top: 16px;">
              <strong>How would you like this explained?</strong>
            </div>
          </div>
        `;
                showResult(initialContent, selectedText, true);
                // Find and modify the regenerate button for first use
                const regenerateButton = document.querySelector("#regenerate");
                if (regenerateButton) {
                    regenerateButton.textContent = "Transform with Selected Style";
                }
                // Add event listener for the regenerate/generate button
                const styleSelect = document.querySelector("#metaphor-style");
                if (regenerateButton && styleSelect) {
                    regenerateButton.addEventListener("click", async () => {
                        const selectedStyle = styleSelect.value;
                        const explanationDiv = document.querySelector(".contex-ly-explanation");
                        if (explanationDiv) {
                            // Show loading state
                            explanationDiv.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                  <div style="margin-bottom: 12px; color: #666;">
                    Cooking up a take...
                  </div>
                  <div style="color: #666; font-size: 14px;">
                    Just a moment while we spice things up in ${selectedStyle} style
                  </div>
                </div>
              `;
                            try {
                                const explanation = await generateExplanation(selectedText, selectedStyle);
                                const isError = explanation.startsWith("Error");
                                explanationDiv.innerHTML = isError
                                    ? `
                  <div style="color: #f44336;">
                    <strong>Error:</strong><br>
                    ${explanation}
                  </div>
                `
                                    : `
                  <div>
                    <strong>Explanation:</strong>
                    <div style="margin-top: 8px; line-height: 1.6;">
                      ${explanation}
                    </div>
                  </div>
                `;
                                // Change button text after first generation
                                regenerateButton.textContent =
                                    "Transform Again with Selected Style";
                            }
                            catch (error) {
                                const e = error;
                                logContent(`Error generating explanation: ${e.message}`);
                                explanationDiv.innerHTML = `
                  <div style="color: #f44336;">
                    <strong>Error:</strong><br>
                    Failed to generate explanation: ${e.message}
                  </div>
                `;
                            }
                        }
                    });
                }
            }
        });
        // Hide float button when clicking outside
        document.addEventListener("mousedown", (e) => {
            if (e.target !== floatButton) {
                floatButton.style.display = "none";
            }
        });
        // Also hide float button when pressing Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                floatButton.style.display = "none";
            }
        });
        async function generateExplanation(text, style) {
            var _a, _b, _c, _d;
            try {
                logContent("Fetching API key from storage...");
                const data = await chrome.storage.sync.get("openaiApiKey");
                logContent("Storage access successful");
                if (!data.openaiApiKey) {
                    throw new Error("No API key found. Please add your OpenAI API key in the extension settings.");
                }
                const stylePrompt = metaphorStyles[style];
                logContent(`Using metaphor style: ${style} (${stylePrompt})`);
                let systemPrompt = "You are a creative assistant that explains concepts using metaphors and analogies. ";
                let userPrompt = "";
                switch (style) {
                    case "relationship":
                        systemPrompt +=
                            "You specialize in explaining things through relationship dynamics and dating experiences.";
                        userPrompt = `Explain this using relationship and dating metaphors: "${text}"`;
                        break;
                    case "highschool-drama":
                        systemPrompt +=
                            "You are explaining this through the lens of high school drama and teen social dynamics.";
                        userPrompt = `Explain this as if it were a high school drama situation: "${text}"`;
                        break;
                    case "kid-friendly":
                        systemPrompt +=
                            "You are talking to a 10-year-old child. Use simple words and fun examples that kids can relate to.";
                        userPrompt = `Explain this to a 10-year-old using things they understand like toys, school, or games: "${text}"`;
                        break;
                    case "pop-culture":
                        systemPrompt +=
                            "You specialize in using current pop culture references. Make sure to reference specific movies, shows, or celebrities that are widely known.";
                        userPrompt = `Explain this using popular movies, TV shows, or celebrity references: "${text}"`;
                        break;
                    case "gossip-girl":
                        systemPrompt +=
                            "You are Gossip Girl. Be dramatic, scandalous, and use Upper East Side references.";
                        userPrompt = `Hey Upper East Siders, let me tell you about this juicy situation: "${text}" XOXO`;
                        break;
                    case "gen-z":
                        systemPrompt +=
                            "You are a Gen Z social media expert. Use current slang, emojis, and internet culture references.";
                        userPrompt = `bestie, explain this using gen z vibes and current internet trends fr fr: "${text}"`;
                        break;
                    case "harry-potter":
                        systemPrompt +=
                            "You are a Hogwarts professor explaining concepts using magical references.";
                        userPrompt = `Explain this using Harry Potter references and magical concepts: "${text}"`;
                        break;
                    case "marvel":
                        systemPrompt +=
                            "You are a Marvel superfan who explains everything through MCU references.";
                        userPrompt = `Explain this using Marvel Cinematic Universe references and characters: "${text}"`;
                        break;
                    default:
                        systemPrompt += stylePrompt;
                        userPrompt = `Explain this text: "${text}"`;
                }
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${data.openaiApiKey}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [
                            {
                                role: "system",
                                content: systemPrompt,
                            },
                            {
                                role: "user",
                                content: userPrompt,
                            },
                        ],
                        temperature: 0.8,
                        max_tokens: 250,
                    }),
                });
                logContent(`API response status: ${response.status}`);
                if (!response.ok) {
                    const error = (await response.json());
                    throw new Error(((_a = error.error) === null || _a === void 0 ? void 0 : _a.message) ||
                        `API Error (${response.status}): ${error.message || "Unknown error"}`);
                }
                const result = (await response.json());
                if (!((_d = (_c = (_b = result.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content)) {
                    throw new Error("Invalid response format from OpenAI");
                }
                logContent("Successfully generated explanation");
                return result.choices[0].message.content;
            }
            catch (error) {
                const e = error;
                const errorMessage = `Error generating explanation: ${e.message}`;
                logContent(errorMessage);
                return errorMessage;
            }
        }
        logContent("Content script initialization complete");
    }
    catch (error) {
        const e = error;
        console.error("[Contex.ly Content] Fatal error:", e.message);
        console.error("[Contex.ly Content] Stack trace:", e.stack);
        handleConnectionError();
    }
}
// Ensure the script runs after the DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeContentScript);
}
else {
    initializeContentScript();
}
// Handle extension updates/reloads
chrome.runtime.onConnect.addListener((port) => {
    port.onDisconnect.addListener(() => {
        isInitialized = false;
        initializeContentScript();
    });
});

/******/ })()
;