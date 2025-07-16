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

  /** Sent when player requests story rewind to last choice */
  rewindStory: "rewindStory",

  /** Sent for debug logging */
  log: "log",
};

/**
 * Messages sent from MVC to Webview
 */
const inboundMessages = {
  /** Sent to update complete state (Full State Replacement Pattern) */
  updateState: "updateState",
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
    restartButton: null,
    debugContainer: null,
    // Error elements
    errorIndicators: null,
    errorButtonError: null,
    errorButtonWarning: null,
    errorButtonInfo: null,
    errorCountError: null,
    errorCountWarning: null,
    errorCountInfo: null,
    errorModal: null,
    errorList: null,
    closeErrorModal: null,
  },

  // Error State ====================================================================================================
  errors: [],
  isErrorModalVisible: false,

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
    // Ensure modal is hidden on initialization
    this.hideErrorModal();
  },

  /**
   * Initializes references to DOM elements used by the view.
   */
  initializeElements() {
    this.elements.restartButton = document.getElementById("button-restart");
    this.elements.rewindButton = document.getElementById("button-rewind");
    this.elements.storyContent = document.getElementById("story-content");
    this.elements.choicesContainer =
      document.getElementById("choices-container");
    this.elements.debugContainer = document.getElementById("debug-container");

    // Initialize error elements
    this.elements.errorIndicators = document.getElementById("error-indicators");
    this.elements.errorButtonError = document.getElementById(
      "button-errors-error"
    );
    this.elements.errorButtonWarning = document.getElementById(
      "button-errors-warning"
    );
    this.elements.errorButtonInfo =
      document.getElementById("button-errors-info");
    this.elements.errorCountError =
      document.getElementById("error-count-error");
    this.elements.errorCountWarning = document.getElementById(
      "error-count-warning"
    );
    this.elements.errorCountInfo = document.getElementById("error-count-info");
    this.elements.errorModal = document.getElementById("error-modal");
    this.elements.errorList = document.getElementById("error-list");
    this.elements.closeErrorModal =
      document.getElementById("close-error-modal");
  },

  /**
   * Sets up event listeners for user interactions.
   */
  setupEventListeners() {
    this.setupRestartButton();
    this.setupRewindButton();
    this.setupKeyboardShortcuts();
    this.setupErrorHandlers();
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
   * Sets up the rewind button click handler.
   */
  setupRewindButton() {
    this.elements.rewindButton.addEventListener("click", () => {
      storyController.actionRewindStory();
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

      // Rewind story: Ctrl/Cmd + Z
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        storyController.actionRewindStory();
      }

      // Close error modal with Escape
      if (e.key === "Escape" && this.isErrorModalVisible) {
        e.preventDefault();
        this.hideErrorModal();
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
    };

    document.addEventListener("keydown", this.keyboardHandler);
  },

  /**
   * Sets up error-related event handlers.
   */
  setupErrorHandlers() {
    // Show modal when any error indicator is clicked
    this.elements.errorButtonError.addEventListener("click", () => {
      this.showErrorModal();
    });

    this.elements.errorButtonWarning.addEventListener("click", () => {
      this.showErrorModal();
    });

    this.elements.errorButtonInfo.addEventListener("click", () => {
      this.showErrorModal();
    });

    // Close modal when close button is clicked
    this.elements.closeErrorModal.addEventListener("click", () => {
      this.hideErrorModal();
    });

    // Close modal when clicking on overlay
    const overlay = this.elements.errorModal.querySelector(
      ".error-modal-overlay"
    );
    if (overlay) {
      overlay.addEventListener("click", () => {
        this.hideErrorModal();
      });
    } else {
      logLocal("[preview.js] ⚠️ Error modal overlay not found");
    }
  },

  /**
   * Resets the story view to its initial state.
   */
  reset() {
    // Reset state
    // (No client-side state tracking needed with Full State Replacement Pattern)

    // Clear errors
    this.errors = [];
    this.updateErrorButton();
    this.hideErrorModal();

    // Reset UI
    this.elements.storyContent.innerHTML = "";
    this.elements.choicesContainer.innerHTML = "";

    // Reset rewind button to disabled state
    this.updateRewindButton(false);
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

    // Use DocumentFragment to batch DOM operations for better performance
    const fragment = document.createDocumentFragment();

    choices.forEach((choice, index) => {
      const choiceButton = createElement(
        "button",
        "btn btn-list story-choice fade-in",
        {
          dataChoiceNumber: (index + 1).toString(),
        }
      );

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

      // Add to fragment instead of directly to DOM
      fragment.appendChild(choiceButton);
    });

    // Single DOM operation to append all choices at once
    this.elements.choicesContainer.appendChild(fragment);
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

  // Error Management Methods ==========================================================================================

  /**
   * Adds an error to the error collection and updates the UI.
   * @param {string} message - The error message
   * @param {string} severity - The error severity ('error', 'warning', 'info')
   */
  addError(message, severity = "error") {
    const error = {
      message,
      severity,
      timestamp: Date.now(),
    };
    this.errors.push(error);
    this.updateErrorButton();
    logLocal(`[preview.js] 📝 Error added: ${severity} - ${message}`);
  },

  /**
   * Gets the count of errors by severity.
   * @returns {Object} Object with error counts by severity
   */
  getErrorCountsBySeverity() {
    const counts = {
      error: 0,
      warning: 0,
      info: 0,
    };

    this.errors.forEach((error) => {
      counts[error.severity]++;
    });

    return counts;
  },

  /**
   * Updates the error indicators visibility and counts.
   */
  updateErrorButton() {
    const counts = this.getErrorCountsBySeverity();

    // Update error indicator
    if (counts.error > 0) {
      this.elements.errorButtonError.style.display = "flex";
      this.elements.errorCountError.textContent = counts.error.toString();
    } else {
      this.elements.errorButtonError.style.display = "none";
    }

    // Update warning indicator
    if (counts.warning > 0) {
      this.elements.errorButtonWarning.style.display = "flex";
      this.elements.errorCountWarning.textContent = counts.warning.toString();
    } else {
      this.elements.errorButtonWarning.style.display = "none";
    }

    // Update info indicator
    if (counts.info > 0) {
      this.elements.errorButtonInfo.style.display = "flex";
      this.elements.errorCountInfo.textContent = counts.info.toString();
    } else {
      this.elements.errorButtonInfo.style.display = "none";
    }

    // Update tooltip text for visible indicators
    this.updateErrorTooltips(counts);
  },

  /**
   * Updates the tooltip text for error indicators.
   * @param {Object} counts - Object with error counts by severity
   */
  updateErrorTooltips(counts) {
    const tooltipText = "Show issues";

    // Set the same tooltip for all visible error indicators
    if (counts.error > 0) {
      this.elements.errorButtonError.title = tooltipText;
    }

    if (counts.warning > 0) {
      this.elements.errorButtonWarning.title = tooltipText;
    }

    if (counts.info > 0) {
      this.elements.errorButtonInfo.title = tooltipText;
    }
  },

  /**
   * Shows the error modal with the list of errors.
   */
  showErrorModal() {
    logLocal("[preview.js] 🔍 Showing error modal");
    this.renderErrorList();
    this.elements.errorModal.classList.remove("hidden");
    this.isErrorModalVisible = true;
  },

  /**
   * Hides the error modal.
   */
  hideErrorModal() {
    logLocal("[preview.js] 🔍 Hiding error modal");
    this.elements.errorModal.classList.add("hidden");
    this.isErrorModalVisible = false;
  },

  /**
   * Renders the error list in the modal.
   */
  renderErrorList() {
    this.elements.errorList.innerHTML = "";

    if (this.errors.length === 0) {
      this.elements.errorList.innerHTML = "<p>No errors to display.</p>";
      return;
    }

    // Use DocumentFragment to batch DOM operations for better performance
    const fragment = document.createDocumentFragment();

    this.errors.forEach((error) => {
      const errorItem = createElement(
        "div",
        `error-item error-item-${error.severity}`
      );

      const errorIcon = createElement("div", "error-icon");
      const iconSpan = createElement(
        "span",
        `error-indicator-icon ${this.getErrorIconClass(error.severity)}`
      );
      errorIcon.appendChild(iconSpan);

      const errorContent = createElement("div", "error-content");

      const errorMessage = createElement("div", "error-message");
      errorMessage.textContent = error.message;

      const errorMeta = createElement("div", "error-meta");
      errorMeta.textContent = error.severity.toUpperCase();

      errorContent.appendChild(errorMessage);
      errorContent.appendChild(errorMeta);

      errorItem.appendChild(errorIcon);
      errorItem.appendChild(errorContent);

      // Add to fragment instead of directly to DOM
      fragment.appendChild(errorItem);
    });

    // Single DOM operation to append all error items at once
    this.elements.errorList.appendChild(fragment);
  },

  /**
   * Gets the appropriate icon CSS class for an error severity.
   * @param {string} severity - The error severity
   * @returns {string} The CSS class for the icon
   */
  getErrorIconClass(severity) {
    switch (severity) {
      case "error":
        return "error-icon-error";
      case "warning":
        return "error-icon-warning";
      case "info":
        return "error-icon-info";
      default:
        return "error-icon-warning";
    }
  },

  /**
   * Updates the rewind button enabled/disabled state.
   * @param {boolean} canRewind - Whether the rewind functionality should be available
   */
  updateRewindButton(canRewind) {
    this.elements.rewindButton.disabled = !canRewind;
    logLocal(
      `[preview.js] 🔄 Rewind button state: ${
        canRewind ? "enabled" : "disabled"
      }`
    );
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
    // Message handler for Full State Replacement Pattern
    messageHandler.register(
      inboundMessages.updateState,
      this.handleUpdateState.bind(this)
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
    // Clear errors immediately when restart is requested
    storyView.errors = [];
    storyView.updateErrorButton();
    storyView.hideErrorModal();
    messageHandler.postMessage(outboundMessages.restartStory, {});
  },

  actionRewindStory() {
    logLocal("Action: Requesting story rewind");
    messageHandler.postMessage(outboundMessages.rewindStory, {});
  },

  /**
   * Handles a complete state update from the extension.
   * This implements the Full State Replacement Pattern where the entire state
   * is sent and the UI is updated to match.
   * @param {Object} state - The complete preview state
   */
  handleUpdateState(state) {
    logLocal("Message: Updating complete state", state);

    // Clear existing state if this is a story start
    if (state.isStart) {
      storyView.reset();
    }

    // Update errors - replace completely
    storyView.errors = state.errors || [];
    storyView.updateErrorButton();

    // Update UI state
    if (state.uiState) {
      storyView.updateRewindButton(state.uiState.rewind);
    }

    // Update story content by directly rendering to maintain proper styling
    this.renderCompleteStoryState(state);

    // Handle story end state
    if (state.isEnded) {
      storyView.renderStoryEnded();
    }

    // Update metadata if needed (could be used for title updates)
    if (state.metadata) {
      // Currently no UI elements use metadata directly
      // This is available for future enhancements
    }
  },

  /**
   * Renders the complete story state using server-side current/historical flags.
   * Events are grouped by their isCurrent property and rendered with appropriate CSS classes.
   * @param {Object} state - The complete preview state
   */
  renderCompleteStoryState(state) {
    const storyContent = storyView.elements.storyContent;

    // If starting fresh, clear everything
    if (state.isStart) {
      storyContent.innerHTML = "";
    }

    // If there are story events, render them using their isCurrent flags
    if (state.storyEvents && state.storyEvents.length > 0) {
      // Clear existing content
      storyContent.innerHTML = "";

      // Group events by their isCurrent status and render in order
      this.renderEventsByCurrentStatus(state.storyEvents, storyContent);
    }

    // Always update choices (they can change without new events)
    if (state.currentChoices && state.currentChoices.length > 0) {
      storyView.renderChoices(state.currentChoices);
    } else {
      // Clear choices if none exist
      storyView.elements.choicesContainer.innerHTML = "";
    }

    // Handle story end state
    if (state.isEnded) {
      storyView.renderStoryEnded();
    }

    // Scroll to bottom after rendering
    storyView.scrollToBottom();
  },

  /**
   * Renders events grouped by their isCurrent status.
   * Creates separate containers for historical and current events.
   * @param {Array} events - Array of story events with isCurrent property
   * @param {HTMLElement} container - Container to render events into
   */
  renderEventsByCurrentStatus(events, container) {
    // Group events by isCurrent status while preserving order
    const groups = [];
    let currentGroup = null;

    events.forEach((event) => {
      const isCurrent = event.isCurrent === true; // Default to false if undefined

      // If this is the start of a new group (different isCurrent status)
      if (!currentGroup || currentGroup.isCurrent !== isCurrent) {
        currentGroup = {
          isCurrent: isCurrent,
          events: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.events.push(event);
    });

    // Use DocumentFragment to batch DOM operations for better performance
    const fragment = document.createDocumentFragment();

    // Render each group with appropriate styling
    groups.forEach((group, groupIndex) => {
      const groupContainer = createElement(
        "div",
        group.isCurrent
          ? "story-group story-group-current fade-in"
          : "story-group story-group-previous",
        {
          dataGroupId: `group-${groupIndex}-${
            group.isCurrent ? "current" : "historical"
          }`,
        }
      );

      const eventsContainer = createElement("div", "story-events");

      // Render all events in this group
      group.events.forEach((event) => {
        switch (event.type) {
          case "text":
            storyView.renderTextEvent(event, eventsContainer);
            break;
          case "function":
            storyView.renderFunctionEvent(event, eventsContainer);
            break;
          default:
            log(`Received unknown event type: ${event.type}`);
            break;
        }
      });

      groupContainer.appendChild(eventsContainer);

      // Add to fragment instead of directly to DOM
      fragment.appendChild(groupContainer);
    });

    // Single DOM operation to append all groups at once
    container.appendChild(fragment);
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
