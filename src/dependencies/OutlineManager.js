"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineManager = void 0;
/**
 * Singleton manager for document outlines.
 */
class OutlineManager {
    static instance;
    outlines = new Map();
    constructor() { }
    static getInstance() {
        if (!OutlineManager.instance) {
            OutlineManager.instance = new OutlineManager();
        }
        return OutlineManager.instance;
    }
    /**
     * Get the outline (root entities) for a document URI.
     */
    getOutline(uri) {
        return this.outlines.get(uri.toString());
    }
    /**
     * Set the outline (root entities) for a document URI.
     */
    setOutline(uri, entities) {
        this.outlines.set(uri.toString(), entities);
    }
}
exports.OutlineManager = OutlineManager;
//# sourceMappingURL=OutlineManager.js.map