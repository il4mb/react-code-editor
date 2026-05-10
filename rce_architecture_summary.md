# RCE Architecture: Stabilized Interaction System

This document summarizes the high-performance architectural patterns implemented to solve flickering, layout corruption, and rendering instability in the React Code Editor (RCE).

## 1. Surgical Rendering & Memoization
To achieve a "zero-jitter" experience, we've implemented a strict surgical rendering pipeline in `Canvas.tsx`.

- **MemoizedToken Component**: Wraps every widget. It uses a custom comparison function that specifically ignores character range shifts. If a token's `id` and `text` are the same, it skips re-rendering even if the text around it has moved.
- **Stable Keys**: Every segment and token in the DOM uses a logical, persistent key rather than a position-based key (`start:end`).
- **Prop Decoupling**: Widgets no longer receive `onChange` closures from the parent. Instead, they use `useEditor()` to dispatch updates directly. This removes the "changing function reference" problem that usually breaks React memoization.

## 2. Token Reconciliation
The Tokenizer now performs "Reconciliation" to maintain stable identities across renders.

- **Persistent IDs**: When the code changes, `buildTokens` compares the new results with the previous state. If a token of the same type exists in a similar position, it "inherits" its original ID.
- **Unmount Prevention**: By keeping IDs stable during an interaction, we prevent React from unmounting and remounting widgets. This keeps the browser's mouse capture alive and preserves the widget's internal state (refs, local variables).

## 3. Local Interaction Model
Interactive widgets (like `NumberWidget`) follow a specialized state pattern to maximize smoothness:

- **Local State (`localValue`)**: During a drag, the widget updates its own internal state. This provides immediate, 60fps visual feedback regardless of the global editor's performance.
- **Real-Time Global Sync**: Simultaneously, it dispatches the updated text to the global `editorReducer` on every `mousemove`. This ensures that the Visual Preview and the actual code remain in sync with the user's hand.
- **Display Toggle**: The widget renders `{dragging ? localValue : children}`. This ensures it always shows the most current "interactive" value during a drag, then seamlessly switches back to the global state when finished.

## 4. Atomic Reducer Updates
The `editorReducer` handles `SET_TOKEN_TEXT` as an atomic operation:

- **Source of Truth**: The reducer takes the `tokenId` and `newText`, performs the string substitution on the `code`, and immediately re-tokenizes the result using the `buildTokens` reconciliation.
- **Widget Registration**: All widgets are synced into the global state via `WidgetsProvider`, ensuring the reducer always has the full map of tokenizers needed to maintain document integrity.

## 5. Widget Hooks API

To simplify custom widget development, RCE now provides high-level hooks that encapsulate common widget patterns:

### `useWidgetToken(token)`
Provides dispatch helpers and state readers for widget token manipulation:
- `setText(newText)` – Update token text with automatic newline sanitization
- `setActive()` / `clearActive()` – Manage active token state
- `setHovered()` / `clearHovered()` – Manage hover state
- `isActive`, `isHovered`, `text` – Read current state
- `tokenRef` – Fresh token reference for event handlers (avoids stale closures)

**Use case:** Simplifies token interaction without manual `useEditor()` dispatch.

### `useWidgetDrag(options)`
Manages document-level drag interactions with automatic cleanup:
- `onStart(event)` – Called when drag begins
- `onMove({ event, deltaX, deltaY })` – Called on every mousemove
- `onEnd()` – Called on mouseup
- Returns `{ dragging: boolean, onMouseDown }` for attaching to elements

**Features:**
- Automatic mouse cursor management
- Document-level event listener cleanup
- Prevention of text selection during drag
- Left-click only (ignores right-click and middle-click)

**Use case:** Simplifies building draggable widgets without boilerplate event handling.

### `sanitizeWidgetText(value)`
Strips newline characters from a string. Called automatically by `setText()`, but available for explicit use.

**Widget Hooks Philosophy:**
- **Low-level control:** Both hooks are optional; widgets can still use `useEditor()` directly if needed
- **Composition-friendly:** Hooks compose well together (`useWidgetToken` + `useWidgetDrag`)
- **Closure safety:** Hooks provide refs and refs-based patterns to avoid stale closures in event handlers
- **Minimal overhead:** Hooks are thin wrappers around existing editor dispatch; no additional state management

## 6. ContentEditable DOM Safety

Recent bug fixes revealed that contentEditable DOM can drift from React state if not carefully managed:

### Live DOM Code Extraction
Instead of relying on React state (`state.code`), text-reading operations now extract code directly from the DOM:

```typescript
function getEditorCodeFromDom(editor: HTMLDivElement): string {
  const clone = editor.cloneNode(true) as HTMLDivElement
  // Strip non-editable decorators
  clone.querySelectorAll('[data-ignore], [contenteditable="false"], [data-placeholder]')
    .forEach(el => el.remove())
  return clone.textContent || ""
}
```

**Why:** `beforeinput` event handlers can fire with stale closures over `state.code`. Reading from the DOM guarantees current state.

**Applied in:** `useEditorHandler.ts` (`beforeinput` handlers), all text-insertion logic.

### Non-Editable Markers
Widget decorators are explicitly marked as non-editable:

```typescript
<div contentEditable={false} data-placeholder>
  🎨  {/* This won't be included in code text */}
</div>
```

**Why:** Prevents decorator elements from leaking into the editable code.

### DOM/Code Desync Detection
Canvas includes a self-healing mechanism that detects when DOM diverges from React state:

```typescript
const editorCode = getEditorCodeFromDom(editor.current)
if (editorCode.length !== state.code.length && !state.activeTokenId) {
  // Trigger remount to force React reconciliation
  setSyncKey(prev => prev + 1)
}
```

**Why:** Stale React fragments can accumulate in the DOM. This forces a clean re-render.

## 7. Summary of Stability Rules

Core principles for maintaining a stable, interactive editor:

- **Never use range as a key**: Always use `token.id`.
- **Never pass anonymous functions to widgets**: Use direct dispatch or stable callback refs.
- **Ignore range in memo comparison**: Only check `id`, `text`, and `isActive`.
- **Always use refs for interaction logic**: Avoid stale closures in document event listeners.
- **Read code from DOM, not state**: In `beforeinput` handlers, call `getEditorCodeFromDom()` instead of relying on `state.code`.
- **Mark decorators non-editable**: All widget decorators should have `contentEditable={false}`.
- **Sanitize widget output**: Widgets should strip newlines before calling `setText()` (or use the hook which does it automatically).

## 8. Rendering Segment Strategy

The render layer converts code + tokens + diagnostics into React segments for efficient DOM updates:

### Segment Key Determinism
- **Token segments** (decorated ranges): Use token ID-based keys: `token-{tokenId}`
  - Stable across text changes in other parts of the code
  - Allows token components to remount when their ID changes
  
- **Plain segments** (undecorated ranges): Use range-start identifiers: `plain-{start}`
  - Unique per position to prevent stale fragment reuse
  - Never reused even if text content changes

### Segment Ordering
Overlapping tokens are sorted by length (longest first) to ensure correct nesting:

```typescript
function sortActiveTokens(tokens: Token[]): Token[] {
  return [...tokens].sort((a, b) => {
    const lenA = a.end - a.start
    const lenB = b.end - b.start
    return lenB - lenA  // Longest first
  })
}
```

**Why:** Prevents shorter tokens from visually dominating longer decorators.

---

## References & Further Reading

- **Widget Hooks API:** See [WIDGET_HOOKS_API.md](./WIDGET_HOOKS_API.md) for complete API documentation and examples
- **Custom Widget Development:** See [CUSTOM_WIDGETS_GUIDE.md](./CUSTOM_WIDGETS_GUIDE.md) for step-by-step guides
- **Recent Changes:** See [CHANGELOG.md](./CHANGELOG.md) for bug fixes and new features
