"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutlineEntity = exports.SymbolType = void 0;
/**
 * Enum for Ink Symbol types.
 */
var SymbolType;
(function (SymbolType) {
    SymbolType["knot"] = "knot";
    SymbolType["stitch"] = "stitch";
    SymbolType["list"] = "list";
    SymbolType["listItem"] = "listItem";
    SymbolType["function"] = "function";
    SymbolType["external"] = "external";
    SymbolType["variable"] = "variable";
    SymbolType["include"] = "include";
})(SymbolType || (exports.SymbolType = SymbolType = {}));
/**
 * Represents any entity in the Ink outline.
 */
class OutlineEntity {
    name;
    type;
    definitionLine;
    definitionRange;
    scopeRange;
    parent;
    children = [];
    constructor(name, type, definitionLine, definitionRange, scopeRange, parent) {
        this.name = name;
        this.type = type;
        this.definitionLine = definitionLine;
        this.definitionRange = definitionRange;
        this.scopeRange = scopeRange;
        this.parent = parent;
    }
    /**
     * Add a child entity to this entity. Only allowed for knot, stitch, and list.
     */
    addChild(child) {
        if (this.type === SymbolType.knot ||
            this.type === SymbolType.stitch ||
            this.type === SymbolType.list) {
            child.parent = this;
            this.children.push(child);
        }
        else {
            throw new Error(`Entities of type '${this.type}' cannot have children.`);
        }
    }
}
exports.OutlineEntity = OutlineEntity;
//# sourceMappingURL=OutlineEntity.js.map