# 🚨 Dual State Architecture - Remaining Work

## 📊 Current Status

### ✅ **COMPLETED: Core Architecture Migration**
- ✅ Dual state interfaces (StoryState, UIState, PreviewState)
- ✅ Domain-specific contexts (StoryActionContext, UIActionContext) 
- ✅ PreviewStateManager refactored for dual state
- ✅ All story actions migrated to new architecture
- ✅ Main PreviewStateManager tests updated and passing
- ✅ Priority 1 new functionality tests added

### ❌ **REMAINING: Critical Issues & Polish**

---

## 🚨 Critical Issues (Blocking Development)

### **Issue #1: Test Suite Compilation Failures**
**Status**: ❌ **93 TypeScript compilation errors**  
**Impact**: Test suite completely broken, no tests can run

#### **1.1 Individual Story Action Test Migration**
Individual action tests not migrated to dual state architecture:

**Files Affected:**
```
tests/preview/actions/story/AddErrorsAction.test.ts
tests/preview/actions/story/AddStoryEventsAction.test.ts  
tests/preview/actions/story/ClearErrorsAction.test.ts
tests/preview/actions/story/EndStoryAction.test.ts
tests/preview/actions/story/InitializeStoryAction.test.ts
tests/preview/actions/story/SetCurrentChoicesAction.test.ts
tests/preview/actions/story/StartStoryAction.test.ts
```

**Required Changes:**
1. **Mock Structure**: Update `mockPreviewState()` calls to use nested structure
   ```typescript
   // ❌ BROKEN: Flat structure
   mockPreviewState({ errors: [] })
   
   // ✅ FIXED: Nested structure
   mockPreviewState({ story: { errors: [] } })
   ```

2. **Context Types**: Update action tests to use `StoryActionContext`
   ```typescript
   // ❌ BROKEN: Old context type
   action.apply(mockContext); // PreviewActionContext
   
   // ✅ FIXED: New context type  
   action.apply(mockStoryContext); // StoryActionContext
   ```

3. **Action Signatures**: Fix `action.reduce()` calls for `StoryState`
   ```typescript
   // ❌ BROKEN: Wrong state type
   action.reduce(currentState); // PreviewState → StoryState mismatch
   
   // ✅ FIXED: Correct state type
   action.reduce(currentState.story); // StoryState → StoryState
   ```

4. **Property Access**: Update assertions for nested properties
   ```typescript
   // ❌ BROKEN: Flat property access
   expect(newState.storyEvents).toEqual(expected);
   
   // ✅ FIXED: Nested property access
   expect(newState.story.storyEvents).toEqual(expected);
   ```

#### **1.2 PreviewController Test Messages**
**File**: `tests/preview/PreviewController.test.ts`

**Required Changes:**
- Fix references to removed message types: `inboundMessages.selectChoice`, `inboundMessages.restartStory`, `inboundMessages.log`
- Update to use current message protocol: `inboundMessages.action`

---

## 🔴 High Priority Issues (User-Facing)

### **Issue #2: Rewind Functionality Incomplete**
**Status**: ❌ **User feature doesn't work**  
**File**: `src/preview/actions/ui/RewindStoryUIAction.ts:33`

```typescript
apply(context: UIActionContext): void {
  console.debug("[RewindStoryUIAction] Rewinding story to last choice");
  // TODO: Need to implement rewind functionality properly
  // context.storyManager.rewindToLastChoice();
  // For now, send current state to webview
  context.sendStoryState();
}
```

**Required Fix:**
```typescript
apply(context: UIActionContext): void {
  console.debug("[RewindStoryUIAction] Rewinding story to last choice");
  
  // Option 1: Access through context (if storyManager available in UIActionContext)
  context.storyManager.rewindStoryStateToLastChoice();
  
  // Option 2: Dispatch to PreviewStateManager directly
  // Implementation needed based on final UIActionContext design
  
  context.sendStoryState();
}
```

---

## 🟡 Medium Priority Issues (Technical Debt)

### **Issue #3: UI State Communication Protocol Incomplete**
**Status**: ⚠️ **Partially implemented**  
**File**: `src/preview/PreviewStateManager.ts:304`

```typescript
public sendUIState(): void {
  // TODO: Implement UI state communication protocol
  // For now, just trigger the callback if set
  if (this.onUIStateChange) {
    this.onUIStateChange(this.getUIState());
  }
}
```

**Decision Required:**
- Should UI state be sent separately to webview?
- Or is sending complete state sufficient? (currently working)

### **Issue #4: UI Action Type Guard Basic**
**Status**: ⚠️ **Could be more robust**  
**File**: `src/preview/PreviewStateManager.ts:368`

```typescript
private isUIAction(action: PreviewAction): action is UIAction {
  // For now, assume any action with apply method that's not a story action is a UI action
  // This can be refined with more specific checks if needed
  return "apply" in action && typeof (action as any).apply === "function";
}
```

**Potential Improvements:**
- More specific type checking
- Interface-based detection
- Action type pattern matching

---

## ✅ Validation Steps

### **Step 1: Test Suite Validation**
**Goal**: Ensure all tests pass after fixes
```bash
npm test
```

### **Step 2: Manual Functionality Testing**
**Goal**: Verify user-facing features work
- [ ] Story preview loads correctly
- [ ] Choice selection works
- [ ] Restart functionality works  
- [ ] Rewind functionality works (after fix)
- [ ] Error display works
- [ ] State persistence works

---

## 🎯 Implementation Priority

### **Immediate (Critical)**
1. **Fix test compilation errors** - Restore development capability
2. **Validate core architecture** - Ensure migration succeeded

### **Next (High Priority)**  
3. **Implement rewind functionality** - Fix user-facing feature

### **Future (Medium Priority)**
4. **Complete UI state protocol** - Architectural completeness
5. **Improve type guards** - Code robustness

---

## 🏁 Success Criteria

- [ ] **Test suite compiles and passes** (0 TypeScript errors)
- [ ] **All user features work** (preview, choice, restart, rewind)
- [ ] **No functionality regressions** from original system
- [ ] **Architecture is complete** (no major TODOs remaining)

---

## 📝 Notes

- **Current State**: Dual state architecture is functionally complete but needs test fixes
- **Risk**: Test failures are blocking all validation of the new architecture  
- **Next Session**: Focus on test compilation errors first, then rewind functionality 