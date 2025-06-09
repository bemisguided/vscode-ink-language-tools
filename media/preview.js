// Constants =========================================================================================================

// VSCode API for webview communication
const vscode = acquireVsCodeApi();

// Event Types
const eventType = {
  text: "text",
  function: "function",
};

// Message Constants =================================================================================================

/**
 * Messages sent from Webview to MVC
 */
const outboundMessages = {
  /** Sent when Webview is ready to receive messages */
  ready: "ready",

  /** Sent when player selects a choice */
  selectChoice: "selectChoice",

  /** Sent when player requests story restart */
  restartStory: "restartStory",

  /** Sent for debug logging */
  log: "log",

  /** Sent to focus the editor */
  focusEditor: "focusEditor",
};

/**
 * Messages sent from MVC to Webview
 */
const inboundMessages = {
  /** Sent to start/restart the story */
  startStory: "startStory",

  /** Sent with story updates (events, choices) */
  updateStory: "updateStory",

  /** Sent when story reaches an end */
  endStory: "endStory",

  /** Sent to display error messages */
  showError: "showError",
};

// Utility Functions =================================================================================================

/**
 * Creates a DOM element with the specified properties.
 * @param {string} tag - The HTML tag name
 * @param {string} className - The CSS class name
 * @param {Object} attributes - Additional attributes to set
 * @returns {HTMLElement} The created element
 */
function createElement(tag, className, attributes = {}) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

/**
 * Creates a container for tags.
 * @param {string[]} tags - Array of tags to render
 * @returns {HTMLElement} The tags container
 */
function createTagsContainer(tags) {
  if (!tags?.length) {
    return null;
  }

  const tagsContainer = createElement("div", "story-tags");
  tags.forEach((tag) => {
    const tagElement = createElement("span", "story-tag");
    tagElement.textContent = `#${tag}`;
    tagsContainer.appendChild(tagElement);
  });
  return tagsContainer;
}

/**
 * Utility function to post a message to the VSCode Extension.
 * @param {string} command - The command to send.
 * @param {Object} payload - The payload to send.
 */
function postMessage(command, payload) {
  console.debug(`[preview.js] 📤 Sending message: ${command}`, payload);
  vscode.postMessage({ command, payload });
}

/**
 * Utility function to log a message to the VSCode Extension.
 * @param {string} message - The message to log.
 */
function log(message, isRemote = true) {
  console.log(`[preview.js] ${message}`);
  if (isRemote) {
    postMessage(inboundMessages.log, { message });
  }
}

function logRemote(message) {
  log(message, true);
}

function logLocal(message) {
  log(message, false);
}

// Message Handler ===================================================================================================

const messageHandler = {
  handlers: new Map(),

  register(command, callback) {
    if (!this.handlers.has(command)) {
      this.handlers.set(command, new Set());
    }
    this.handlers.get(command).add(callback);
    return callback; // Return callback for cleanup
  },

  unregister(command, callback) {
    const callbacks = this.handlers.get(command);
    if (callbacks) {
      callbacks.delete(callback);
    }
  },

  handle(event) {
    const message = event.data;
    logLocal("[preview.js] 📥 Received message:", message);

    if (!message || !message.command) {
      logLocal("[preview.js] ❌ Invalid message format:", message);
      return;
    }

    const callbacks = this.handlers.get(message.command);
    if (callbacks) {
      callbacks.forEach((callback) => callback(message.payload));
    }
  },

  initialize() {
    logLocal("[preview.js] 📝 Setting up message listener");

    // Remove any existing listeners
    window.removeEventListener("message", this.handleMessage);

    // Add new listener with a bound function
    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener("message", this.handleMessage);

    // Send ready message
    vscode.postMessage({ command: "ready", payload: {} });
  },

  handleMessage(event) {
    console.log("[preview.js] 🔍 Message received:", event);
    logLocal("[preview.js] 📥 Raw message event:", event);

    if (!event.data) {
      console.log("[preview.js] ❌ No data in message");
      return;
    }
    this.handle(event);
  },

  cleanup() {
    if (this.handleMessage) {
      window.removeEventListener("message", this.handleMessage);
    }
  },
};

// Story View ========================================================================================================

const storyView = {
  // DOM Elements ===================================================================================================
  elements: {
    storyContent: null,
    choicesContainer: null,
    errorContainer: null,
    restartButton: null,
    debugContainer: null,
  },

  // State ==========================================================================================================
  currentGroup: null,
  history: [],

  // Event Handlers =================================================================================================
  keyboardHandler: null,

  // Initialization =================================================================================================
  initialize() {
    this.initializeElements();
    this.reset();
    this.setupEventListeners();
  },

  initializeElements() {
    this.elements.restartButton = document.getElementById("button-restart");
    this.elements.storyContent = document.getElementById("story-content");
    this.elements.choicesContainer =
      document.getElementById("choices-container");
    this.elements.errorContainer = document.getElementById("error-container");
    this.elements.debugContainer = document.getElementById("debug-container");
  },

  setupEventListeners() {
    this.setupRestartButton();
    this.setupKeyboardShortcuts();
  },

  setupRestartButton() {
    this.elements.restartButton.addEventListener("click", () => {
      storyController.actionRestartStory();
    });
  },

  setupKeyboardShortcuts() {
    this.keyboardHandler = (e) => {
      // Restart story: Ctrl/Cmd + R
      if ((e.key === "r" || e.key === "R") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        storyController.actionRestartStory();
      }

      // Select choice: Number keys 1-9
      if (e.key >= "1" && e.key <= "9") {
        const choiceIndex = parseInt(e.key) - 1;
        const choiceButtons =
          this.elements.choicesContainer.querySelectorAll(".story-choice");
        if (
          choiceButtons[choiceIndex] &&
          !choiceButtons[choiceIndex].disabled
        ) {
          storyController.actionSelectChoice(choiceIndex);
        }
      }

      // Focus editor: Escape
      if (e.key === "Escape") {
        storyController.actionFocusEditor();
      }
    };

    document.addEventListener("keydown", this.keyboardHandler);
  },

  // State Management ===============================================================================================
  reset() {
    // Reset state
    this.currentGroup = null;
    this.history = [];

    // Reset UI
    this.elements.storyContent.innerHTML = "";
    this.elements.choicesContainer.innerHTML = "";
    this.hideError();
  },

  updateStory(group) {
    // Add to history if there's a current group
    if (this.currentGroup) {
      this.history.push(this.currentGroup);
    }

    // Update current group
    this.currentGroup = group;

    // Render the story group
    this.renderStoryGroup(group);
  },

  // Rendering ======================================================================================================
  renderStoryGroup(group) {
    this.hideError();
    this.markCurrentContentAsHistorical();

    // Only create a group container if there are events
    if (group.events?.length > 0) {
      const groupContainer = createElement(
        "div",
        "story-group story-group-current fade-in",
        {
          "data-group-id": group.id,
        }
      );

      const eventsContainer = createElement("div", "story-events");

      // Render events in exact order they arrived
      group.events.forEach((event) => {
        switch (event.type) {
          case eventType.text:
            this.renderTextEvent(event, eventsContainer);
            break;
          case eventType.function:
            this.renderFunctionEvent(event, eventsContainer);
            break;
          default:
            log(`Received unknown event type: ${event.type}`);
            break;
        }
      });

      groupContainer.appendChild(eventsContainer);
      this.elements.storyContent.appendChild(groupContainer);
    }

    // Render choices after all events
    this.renderChoices(group.choices, group.hasEnded);
    this.scrollToBottom();
  },

  renderTextEvent(event, container) {
    const paragraphElement = createElement(
      "div",
      "story-event story-event-text"
    );

    // Create text content
    const textContent = createElement("div", "story-text");
    textContent.textContent = event.text.trim();
    paragraphElement.appendChild(textContent);

    // Add tags if present
    const tagsContainer = createTagsContainer(event.tags);
    if (tagsContainer) {
      paragraphElement.appendChild(tagsContainer);
    }

    container.appendChild(paragraphElement);
  },

  renderFunctionEvent(event, container) {
    const functionElement = createElement(
      "div",
      "story-event story-event-function"
    );

    // Format arguments
    const argsString =
      event.args?.length > 0
        ? event.args
            .map((arg) => (typeof arg === "string" ? `"${arg}"` : String(arg)))
            .join(", ")
        : "";

    // Format result
    let resultHtml = "";
    if (event.result !== null && event.result !== undefined) {
      const resultString =
        typeof event.result === "string"
          ? `"${event.result}"`
          : String(event.result);
      resultHtml = ` → <span class="function-result">${resultString}</span>`;
    }

    functionElement.innerHTML = `
      <span class="function-name">${event.functionName}</span>(<span class="function-args">${argsString}</span>)${resultHtml}
    `;

    container.appendChild(functionElement);
  },

  renderChoices(choices, hasEnded) {
    this.elements.choicesContainer.innerHTML = "";

    if (hasEnded) {
      this.renderStoryEnded();
      return;
    }

    if (!choices?.length) {
      return;
    }

    choices.forEach((choice, index) => {
      const choiceButton = createElement("button", "story-choice fade-in", {
        "data-choice-number": (index + 1).toString(),
      });

      // Create choice content container
      const choiceContent = createElement("div", "choice-content");

      // Create choice text
      const choiceText = createElement("div", "choice-text");
      choiceText.textContent = choice.text;
      choiceContent.appendChild(choiceText);

      // Add tags if present
      const tagsContainer = createTagsContainer(choice.tags);
      if (tagsContainer) {
        choiceContent.appendChild(tagsContainer);
      }

      choiceButton.appendChild(choiceContent);

      choiceButton.addEventListener("click", () => {
        this.disableChoices();
        storyController.actionSelectChoice(choice.index);
      });

      setTimeout(() => {
        this.elements.choicesContainer.appendChild(choiceButton);
        if (index === choices.length - 1) {
          setTimeout(() => this.scrollToBottom(), 100);
        }
      }, index * 50);
    });
  },

  renderStoryEnded() {
    const endMessage = createElement("div", "story-ended fade-in");
    endMessage.textContent = "Story Complete";
    this.elements.choicesContainer.appendChild(endMessage);
    setTimeout(() => this.scrollToBottom(), 100);
  },

  // UI Helpers =====================================================================================================
  markCurrentContentAsHistorical() {
    const currentGroups = this.elements.storyContent.querySelectorAll(
      ".story-group-current"
    );
    currentGroups.forEach((group) => {
      group.classList.remove("story-group-current");
      group.classList.add("story-group-previous");
    });
  },

  disableChoices() {
    const choiceButtons =
      this.elements.choicesContainer.querySelectorAll(".story-choice");
    choiceButtons.forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = "0.6";
    });
  },

  scrollToBottom() {
    const attemptScroll = () => {
      const container = document.getElementById("story-container");
      const maxScrollTop = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        container?.scrollHeight ?? 0
      );

      window.scrollTo({
        top: maxScrollTop,
        behavior: "smooth",
      });

      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };

    attemptScroll();
    setTimeout(attemptScroll, 50);
    setTimeout(attemptScroll, 150);
    setTimeout(attemptScroll, 300);
  },

  // Error Handling =================================================================================================
  renderError(error) {
    this.elements.errorContainer.innerHTML = `
      <div class="error-message">⚠️ Error</div>
      <div class="error-details">${this.escapeHtml(error)}</div>
    `;
    this.elements.errorContainer.classList.remove("hidden");
    this.elements.errorContainer.scrollIntoView({ behavior: "smooth" });
  },

  hideError() {
    this.elements.errorContainer.classList.add("hidden");
  },

  // Utilities ======================================================================================================
  escapeHtml(text) {
    const htmlEntities = {
      ampersand: "&amp;",
      lessThan: "&lt;",
      greaterThan: "&gt;",
      doubleQuote: "&quot;",
      singleQuote: "&#039;",
    };
    return text.replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&":
          return htmlEntities.ampersand;
        case "<":
          return htmlEntities.lessThan;
        case ">":
          return htmlEntities.greaterThan;
        case '"':
          return htmlEntities.doubleQuote;
        case "'":
          return htmlEntities.singleQuote;
        default:
          return char;
      }
    });
  },

  // Cleanup ========================================================================================================
  cleanup() {
    if (this.keyboardHandler) {
      document.removeEventListener("keydown", this.keyboardHandler);
      this.keyboardHandler = null;
    }
  },
};

// Story Controller ==================================================================================================

const storyController = {
  // State ==========================================================================================================
  messageHandlers: [],
  isInitialized: false,

  // Initialization =================================================================================================
  initialize() {
    if (this.isInitialized) {
      return;
    }
    this.setupEventListeners();
    postMessage(outboundMessages.ready, {});
    this.isInitialized = true;
  },

  setupEventListeners() {
    // Message handlers
    this.messageHandlers = [
      messageHandler.register(
        inboundMessages.startStory,
        this.handleStartStory.bind(this)
      ),
      messageHandler.register(
        inboundMessages.updateStory,
        this.handleStoryUpdate.bind(this)
      ),
      messageHandler.register(
        inboundMessages.endStory,
        this.handleEndStory.bind(this)
      ),
      messageHandler.register(
        inboundMessages.showError,
        this.handleShowError.bind(this)
      ),
    ];
  },

  // Action Handlers ================================================================================================
  actionSelectChoice(choiceIndex) {
    logLocal(`Action: Selecting choice ${choiceIndex}`);
    postMessage(outboundMessages.selectChoice, { choiceIndex });
  },

  actionRestartStory() {
    logLocal("Action: Requesting story restart");
    postMessage(outboundMessages.restartStory, {});
  },

  actionFocusEditor() {
    logLocal("Action: Focusing editor");
    postMessage(outboundMessages.focusEditor, {});
  },

  // Message Handlers ===============================================================================================
  handleStartStory() {
    logLocal("Message: Starting story");
    storyView.reset();
  },

  handleStoryUpdate(message) {
    logLocal("Message: Updating story");
    storyView.updateStory(message.payload);
  },

  handleEndStory() {
    logLocal("Message: Story ended");
    storyView.renderStoryEnded();
  },

  handleShowError(error) {
    logLocal("Message: Showing error");
    storyView.renderError(error);
  },

  // Cleanup ========================================================================================================
  cleanup() {
    this.messageHandlers.forEach((handler) => {
      messageHandler.unregister(inboundMessages.startStory, handler);
      messageHandler.unregister(inboundMessages.updateStory, handler);
      messageHandler.unregister(inboundMessages.endStory, handler);
      messageHandler.unregister(inboundMessages.showError, handler);
    });
    this.messageHandlers = [];
  },
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  messageHandler.initialize();
  storyView.initialize();
  storyController.initialize();
});

// Cleanup ==========================================================================================================

window.addEventListener("unload", () => {
  storyController.cleanup();
  storyView.cleanup();
  messageHandler.cleanup();
});
