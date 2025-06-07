// VSCode API for webview communication
const vscode = acquireVsCodeApi();

// VSCode API for webview communication
// Debug logging removed - issue resolved!

// DOM Elements
let storyContent;
let choicesContainer;
let errorContainer;
let restartBtn;
let debugContainer;

// Story state
let currentStory = null;
let storyHistory = [];

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("🎬 DOM Content Loaded - Webview initializing");

  initializeElements();
  setupEventListeners();

  // Signal that webview is ready
  vscode.postMessage({ command: "ready" });
});

function initializeElements() {
  storyContent = document.getElementById("story-content");
  choicesContainer = document.getElementById("choices-container");
  errorContainer = document.getElementById("error-container");
  restartBtn = document.getElementById("restart-btn");
  debugContainer = document.getElementById("debug-container");
}

function setupEventListeners() {
  // Restart button
  restartBtn.addEventListener("click", function (event) {
    vscode.postMessage({ command: "restart" });
    clearHistory();
  });

  // Listen for messages from the extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.command) {
      case "updateStory":
        updateStory(message);
        break;
      case "showError":
        showError(message.error);
        break;
      case "clearStory":
        clearStory();
        break;
    }
  });
}

function updateStory(data) {
  hideError();

  // Mark all current text as previous before adding new text
  markCurrentTextAsPrevious();

  // Store current state in history
  if (data.text) {
    storyHistory.push({
      text: data.text,
      choices: data.choices,
      timestamp: Date.now(),
    });
  }

  // Update story content
  if (data.text) {
    addStoryText(data.text, data.tags);
  }

  // Update choices
  updateChoices(data.choices, data.hasEnded);

  // Scroll to bottom smoothly
  setTimeout(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, 100);
}

function addStoryText(text, tags = []) {
  // Clear waiting message if it exists
  const waiting = storyContent.querySelector(".waiting");
  if (waiting) {
    waiting.remove();
  }

  // Split text into paragraphs and add them
  const paragraphs = text.split("\n").filter((p) => p.trim() !== "");

  paragraphs.forEach((paragraph) => {
    const paragraphElement = document.createElement("div");
    paragraphElement.className =
      "story-paragraph story-paragraph-current fade-in";

    // Add the text content
    let content = paragraph.trim();

    // Add tags inline at the end if present
    if (tags && tags.length > 0) {
      const tagString = tags
        .map((tag) => `<span class="tag">#${tag}</span>`)
        .join("");
      content += ` ${tagString}`;
    }

    paragraphElement.innerHTML = content;
    storyContent.appendChild(paragraphElement);
  });
}

function markCurrentTextAsPrevious() {
  // Find all current text paragraphs and mark them as previous
  const currentParagraphs = storyContent.querySelectorAll(
    ".story-paragraph-current"
  );
  currentParagraphs.forEach((paragraph) => {
    paragraph.classList.remove("story-paragraph-current");
    paragraph.classList.add("story-paragraph-previous");
  });
}

function updateChoices(choices, hasEnded) {
  // Clear existing choices
  choicesContainer.innerHTML = "";

  if (hasEnded) {
    showStoryEnded();
    return;
  }

  if (!choices || choices.length === 0) {
    return;
  }

  // Create choice buttons
  console.log("🎮 Creating", choices.length, "choice buttons");
  choices.forEach((choice, index) => {
    console.log(
      `🔵 Choice ${index}: text="${choice.text}" choiceIndex=${choice.index}`
    );

    const choiceButton = document.createElement("button");
    choiceButton.className = "choice fade-in";

    // Create choice content with inline tags
    let choiceContent = `<span class="choice-number">${index + 1}.</span>${
      choice.text
    }`;

    // Add tags inline if present
    if (choice.tags && choice.tags.length > 0) {
      const tagString = choice.tags
        .map((tag) => `<span class="tag">#${tag}</span>`)
        .join("");
      choiceContent += ` ${tagString}`;
    }

    choiceButton.innerHTML = choiceContent;

    choiceButton.addEventListener("click", function () {
      console.log(
        `🖱️ Choice button clicked - using choice.index: ${choice.index}`
      );
      makeChoice(choice.index);
    });

    // Add slight delay for animation effect
    setTimeout(() => {
      choicesContainer.appendChild(choiceButton);
    }, index * 50);
  });
}

function makeChoice(choiceIndex) {
  console.log("🎯 JavaScript makeChoice called with index:", choiceIndex);

  // Disable all choice buttons to prevent double-clicking
  const choiceButtons = choicesContainer.querySelectorAll(".choice");
  console.log("📊 Found", choiceButtons.length, "choice buttons to disable");

  choiceButtons.forEach((btn) => {
    btn.disabled = true;
    btn.style.opacity = "0.6";
  });

  // Send choice to extension
  console.log("📤 Sending choice message to extension");
  vscode.postMessage({
    command: "makeChoice",
    choiceIndex: choiceIndex,
  });
}

function showStoryEnded() {
  console.log("🎬 Showing story ended message");
  const endMessage = document.createElement("div");
  endMessage.className = "story-ended fade-in";
  endMessage.textContent = "Story Complete";
  choicesContainer.appendChild(endMessage);
  console.log("🎬 Story ended message added to DOM");
}

function showError(error) {
  errorContainer.innerHTML = `
        <div class="error-message">⚠️ Error</div>
        <div class="error-details">${escapeHtml(error)}</div>
    `;
  errorContainer.classList.remove("hidden");

  // Scroll to error
  errorContainer.scrollIntoView({ behavior: "smooth" });
}

function hideError() {
  errorContainer.classList.add("hidden");
}

function clearHistory() {
  storyHistory = [];
  storyContent.innerHTML = '<div class="waiting">Restarting story...</div>';
  choicesContainer.innerHTML = "";
  hideError();
}

function clearStory() {
  console.log("🧹 Clearing previous story content");
  storyHistory = [];
  storyContent.innerHTML = '<div class="waiting">Loading new story...</div>';
  choicesContainer.innerHTML = "";
  hideError();
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

// Future: External function handling
function handleExternalFunction(functionName, args) {
  // This will be expanded in the future to allow JavaScript stubs
  console.log(`External function called: ${functionName}(${args.join(", ")})`);

  // For now, return a default value
  switch (functionName) {
    case "get_player_name":
      return "Player";
    case "get_player_health":
      return 100;
    case "get_current_time":
      return new Date().toLocaleTimeString();
    default:
      return `[${functionName}]`;
  }
}

// Future: Debug panel functions
function showDebugPanel() {
  debugContainer.classList.remove("hidden");
}

function hideDebugPanel() {
  debugContainer.classList.add("hidden");
}

function updateDebugInfo(info) {
  // Future: Display external function calls, variables, etc.
  const debugContent = document.getElementById("function-calls");
  if (debugContent) {
    debugContent.innerHTML = JSON.stringify(info, null, 2);
  }
}

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  // R key to restart
  if (e.key === "r" || e.key === "R") {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      restartBtn.click();
    }
  }

  // Number keys for choices
  if (e.key >= "1" && e.key <= "9") {
    const choiceIndex = parseInt(e.key) - 1;
    const choiceButtons = choicesContainer.querySelectorAll(".choice");
    if (choiceButtons[choiceIndex] && !choiceButtons[choiceIndex].disabled) {
      choiceButtons[choiceIndex].click();
    }
  }

  // Escape to focus back to editor (future enhancement)
  if (e.key === "Escape") {
    vscode.postMessage({ command: "focusEditor" });
  }
});

// Auto-save scroll position (future enhancement)
let scrollPosition = 0;
window.addEventListener("scroll", function () {
  scrollPosition = window.scrollY;
});

// Restore scroll position when content updates
function restoreScrollPosition() {
  if (scrollPosition > 0) {
    window.scrollTo(0, scrollPosition);
  }
}

// Export for future external function system
window.inkPreview = {
  handleExternalFunction,
  showDebugPanel,
  hideDebugPanel,
  updateDebugInfo,
};
