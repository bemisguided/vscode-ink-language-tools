/**
 * MIT License
 *
 * Copyright (c) 2025 Martin Crawford
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Constants =========================================================================================================

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
 * Utility function to log a message to the VSCode Extension.
 * @param {string} message - The message to log.
 */
function log(message, isRemote = true) {
  console.debug(`[preview.js] ${message}`);
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
  vscode: acquireVsCodeApi(),

  handlers: new Map(),

  listener: null,

  /**
   * Sends a message to the VSCode extension.
   * @param {string} command - The command to send
   * @param {Object} payload - The payload to send with the command
   */
  postMessage(command, payload) {
    logLocal(`[preview.js] 📤 Sending message: ${command}`, payload);
    this.vscode.postMessage({ command, payload });
  },

  /**
   * Registers a callback function for a specific command.
   * @param {string} command - The command to register the handler for
   * @param {Function} callback - The function to call when the command is received
   * @returns {Function} The callback function for cleanup
   */
  register(command, callback) {
    if (!this.handlers.has(command)) {
      this.handlers.set(command, new Set());
    }
    this.handlers.get(command).add(callback);
    return callback; // Return callback for cleanup
  },

  /**
   * Unregisters a callback function for a specific command.
   * @param {string} command - The command to unregister the handler from
   * @param {Function} callback - The function to unregister
   */
  unregister(command, callback) {
    const callbacks = this.handlers.get(command);
    if (callbacks) {
      callbacks.delete(callback);
    }
  },

  /**
   * Handles incoming messages from the VSCode extension.
   * @param {MessageEvent} event - The message event containing the command and payload
   */
  handle(event) {
    const message = event.data;
    logLocal("[preview.js] 📥 Received message:" + JSON.stringify(message));
    if (!message || !message.command) {
      logLocal("[preview.js] ❌ Invalid message format:", message);
      return;
    }

    const callbacks = this.handlers.get(message.command);
    if (callbacks) {
      callbacks.forEach((callback) => callback(message.payload));
    }
  },

  /**
   * Initializes the message handler by setting up the message event listener.
   * This should be called when the webview is loaded.
   */
  initialize() {
    logLocal("[preview.js] 📝 MessageHandler: Initializing");

    // Add new listener with a bound function
    this.handle = this.handle.bind(this);
    this.listener = window.addEventListener("message", this.handle);
  },

  /**
   * Cleans up the message handler by removing the event listener.
   * This should be called when the webview is disposed.
   */
  cleanup() {
    if (this.listener) {
      window.removeEventListener("message", this.listener);
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

  /**
   * Initializes the story view by setting up DOM elements and event listeners.
   * This should be called when the webview is loaded.
   */
  initialize() {
    logLocal("[preview.js] 📝 View: Initializing");
    this.initializeElements();
    this.reset();
    this.setupEventListeners();
  },

  /**
   * Initializes references to DOM elements used by the view.
   */
  initializeElements() {
    this.elements.restartButton = document.getElementById("button-restart");
    this.elements.storyContent = document.getElementById("story-content");
    this.elements.choicesContainer =
      document.getElementById("choices-container");
    this.elements.errorContainer = document.getElementById("error-container");
    this.elements.debugContainer = document.getElementById("debug-container");
  },

  /**
   * Sets up event listeners for user interactions.
   */
  setupEventListeners() {
    this.setupRestartButton();
    this.setupKeyboardShortcuts();
  },

  /**
   * Sets up the restart button click handler.
   */
  setupRestartButton() {
    this.elements.restartButton.addEventListener("click", () => {
      storyController.actionRestartStory();
    });
  },

  /**
   * Sets up keyboard shortcuts for story navigation.
   */
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

  /**
   * Resets the story view to its initial state.
   */
  reset() {
    // Reset state
    this.currentGroup = null;
    this.history = [];

    // Reset UI
    this.elements.storyContent.innerHTML = "";
    this.elements.choicesContainer.innerHTML = "";
    this.hideError();
  },

  /**
   * Updates the story view with new content.
   * @param {Object} group - The story group containing events and choices
   */
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

  /**
   * Renders a story group with its events and choices.
   * @param {Object} group - The story group to render
   */
  renderStoryGroup(group) {
    this.hideError();
    this.markCurrentContentAsHistorical();

    // Only create a group container if there are events
    if (group.events?.length > 0) {
      const groupContainer = createElement(
        "div",
        "story-group story-group-current fade-in",
        {
          dataGroupId: group.id,
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
    this.renderChoices(group.choices);
    this.scrollToBottom();
  },

  /**
   * Renders a text event in the story.
   * @param {Object} event - The text event to render
   * @param {HTMLElement} container - The container to render the event in
   */
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

  /**
   * Renders a function event in the story.
   * @param {Object} event - The function event to render
   * @param {HTMLElement} container - The container to render the event in
   */
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

  /**
   * Renders the choices for the current story state.
   * @param {Array} choices - The array of choices to render
   */
  renderChoices(choices) {
    this.elements.choicesContainer.innerHTML = "";

    if (!choices?.length) {
      return;
    }

    choices.forEach((choice, index) => {
      const choiceButton = createElement("button", "story-choice fade-in", {
        dataChoiceNumber: (index + 1).toString(),
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

      this.elements.choicesContainer.appendChild(choiceButton);
    });
  },

  /**
   * Renders the story ended message.
   */
  renderStoryEnded() {
    this.elements.choicesContainer.innerHTML = "";
    const endMessage = createElement("div", "story-ended fade-in");
    endMessage.textContent = "Story Complete";
    this.elements.choicesContainer.appendChild(endMessage);
    setTimeout(() => this.scrollToBottom(), 100);
  },

  /**
   * Marks the current content as historical by updating its CSS classes.
   */
  markCurrentContentAsHistorical() {
    const currentGroups = this.elements.storyContent.querySelectorAll(
      ".story-group-current"
    );
    currentGroups.forEach((group) => {
      group.classList.remove("story-group-current");
      group.classList.add("story-group-previous");
    });
  },

  /**
   * Disables all choice buttons.
   */
  disableChoices() {
    const choiceButtons =
      this.elements.choicesContainer.querySelectorAll(".story-choice");
    choiceButtons.forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = "0.6";
    });
  },

  /**
   * Scrolls the story container to the bottom.
   */
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

  /**
   * Renders an error message in the error container.
   * @param {string} error - The error message to display
   */
  renderError(error) {
    this.elements.errorContainer.innerHTML = `
      <div class="error-message">⚠️ Error</div>
      <div class="error-details">${this.escapeHtml(error)}</div>
    `;
    this.elements.errorContainer.classList.remove("hidden");
    this.elements.errorContainer.scrollIntoView({ behavior: "smooth" });
  },

  /**
   * Hides the error container.
   */
  hideError() {
    this.elements.errorContainer.classList.add("hidden");
  },

  /**
   * Escapes HTML special characters in a string.
   * @param {string} text - The text to escape
   * @returns {string} The escaped text
   */
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

  /**
   * Cleans up the story view by removing event listeners.
   */
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
  isInitialized: false,

  /**
   * Initializes the story controller by setting up event listeners.
   * This should be called when the webview is loaded.
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }
    logLocal("[preview.js] 📝 Controller: Initializing");
    this.setupEventListeners();
    messageHandler.postMessage(outboundMessages.ready, {});
    this.isInitialized = true;
  },

  /**
   * Sets up event listeners for story messages.
   */
  setupEventListeners() {
    // Message handler
    messageHandler.register(
      inboundMessages.startStory,
      this.handleStartStory.bind(this)
    );
    messageHandler.register(
      inboundMessages.updateStory,
      this.handleStoryUpdate.bind(this)
    );
    messageHandler.register(
      inboundMessages.endStory,
      this.handleEndStory.bind(this)
    );
    messageHandler.register(
      inboundMessages.showError,
      this.handleShowError.bind(this)
    );
  },

  /**
   * Handles the selection of a choice by the player.
   * @param {number} choiceIndex - The index of the selected choice
   */
  actionSelectChoice(choiceIndex) {
    logLocal(`Action: Selecting choice ${choiceIndex}`);
    messageHandler.postMessage(outboundMessages.selectChoice, { choiceIndex });
  },

  /**
   * Handles the player's request to restart the story.
   */
  actionRestartStory() {
    logLocal("Action: Requesting story restart");
    messageHandler.postMessage(outboundMessages.restartStory, {});
  },

  /**
   * Handles the player's request to focus the editor.
   */
  actionFocusEditor() {
    logLocal("Action: Focusing editor");
    messageHandler.postMessage(outboundMessages.focusEditor, {});
  },

  /**
   * Handles the start story message from the extension.
   */
  handleStartStory() {
    logLocal("Message: Starting story");
    storyView.reset();
  },

  /**
   * Handles a story update message from the extension.
   * @param {Object} payload - The story update payload
   */
  handleStoryUpdate(payload) {
    logLocal("Message: Updating story", payload);
    storyView.updateStory(payload);
  },

  /**
   * Handles the end story message from the extension.
   */
  handleEndStory() {
    logLocal("Message: Story ended");
    // Mark all current content as historical before showing end message
    storyView.renderStoryEnded();
  },

  /**
   * Handles an error message from the extension.
   * @param {string} error - The error message to display
   */
  handleShowError(error) {
    logLocal("Message: Showing error");
    storyView.renderError(error);
  },

  /**
   * Cleans up the story controller.
   */
  cleanup() {},
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
