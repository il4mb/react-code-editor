# Changelog

All notable changes to React Code Editor are documented here.

## [Unreleased]

### Added

#### Widget Hooks API (`useWidgetToken`, `useWidgetDrag`)

New low-level and high-level hooks for building robust custom widgets:

- **`useWidgetToken(token)`** – Provides stable dispatch callbacks for token manipulation (`setText`, `setActive`, `setHovered`) and state readers (`isActive`, `isHovered`). Replaces manual `useEditor()` dispatch calls with a cleaner API.
  
- **`useWidgetDrag(options)`** – Manages document-level drag interactions with automatic cleanup. Handles cursor changes, delta calculations, and event listener teardown. Supports `onStart`, `onMove`, `onEnd` callbacks.

- **`sanitizeWidgetText(value)`** – Utility function to strip newlines from widget text before token replacement. Called automatically by `setText()`, but available for explicit use.

**Export path:** `react-code-editor/hooks/widgetHooks`  
**Documentation:** See [Widget Hooks API Reference](./WIDGET_HOOKS_API.md)

**Migration:** Existing widgets using `useEditor()` directly can migrate to the new hooks for cleaner code:

```typescript
// Before
const { dispatch } = useEditor()
const setText = (newText) => {
  dispatch({ type: "SET_TOKEN_TEXT", payload: { tokenId: token.id, newText } })
}

// After
const { setText } = useWidgetToken(token)
```

#### Typing-Triggered Suggestions

Autocomplete dropdown now only appears when the user is actively typing, not on selection changes or caret movement.

- Added `suggestionsTriggeredByTyping` state flag to `EditorState`
- Suggestions filter to `false` on selection/cursor navigation
- Suggestions filter to `true` on text-edit inputs (insertText, delete, paste, composition)
- **Behavior:** Cleaner UI experience; suggestions don't distract during document navigation

### Fixed

#### Widget Decorator Contamination Bug

**Issue:** Widget decorators (e.g., unit widget arrow `▾`) were leaking into editable code text, corrupting the output (e.g., `border: 2px▾ dashed ...`).

**Root cause:** Decorator elements added via `[data-placeholder]` were not marked as non-editable, allowing their text content to be included when reading the editor's code.

**Solution:**
- Added `getEditorCodeFromDom()` helper in `useEditorHandler.ts` that strips non-editable nodes (`[data-ignore]`, `[contenteditable=false]`, `[data-placeholder]`) before reading code text
- Made all widget decorators explicitly `contentEditable={false}` (e.g., `UnitWidget` badge)
- Applies sanitization in all `beforeinput` handlers and DOM code extraction

**Files modified:**
- `rce/src/hooks/useEditorHandler.ts` – Added `getEditorCodeFromDom()` helper
- `rce/src/widgets/UnitWidget.tsx` – Added `contentEditable={false}` to badge
- `rce/src/utils/editing.ts` – Applied DOM sanitization in text-reading logic

#### Color/Value Corruption on Text Insertion

**Issue:** Inserting whitespace near color values caused trailing content corruption (e.g., inserting space in `rgb(0,0, 0)` resulted in `0)0.5` appearing).

**Root cause:** `beforeinput` handlers relied on `state.code` (stale closure) and `state.selection` instead of reading the live DOM. During rapid edits, the closure's state was out of date, causing text insertion at wrong offsets.

**Solution:**
- Refactored `beforeinput` handlers to use live DOM code extraction via `getEditorCodeFromDom(editor)` instead of stale `state.code`
- Use live selection from editor ref (`editor.current.selectionStart/End`) instead of `state.selection`
- Ensures offset calculations are always based on current DOM state, not stale React state

**Files modified:**
- `rce/src/hooks/useEditorHandler.ts` – Switched to live DOM code/selection extraction in all beforeinput handlers

#### Render Layer Visual Artifacts (Stale Fragments)

**Issue:** DOM displayed stale text fragments (e.g., `rgba(...)0.5` appearing twice) while `state.code` was correct. Visual desync between DOM and React state.

**Root cause:** 
1. Plain-text segments (non-decorated ranges) were using position-based keys that could be reused across unrelated text fragments
2. React's reconciliation would update a stale segment's props rather than unmounting/remounting, leaving ghost text in the DOM
3. Token segments were overly aggressive in memo comparisons, losing interaction smoothness

**Solution (multi-part fix):**

1. **Segment Key Determinism** (`rce/src/utils/rendering.ts`):
   - Token segments use token ID-based keys: `token-{tokenId}` (stable across text changes)
   - Plain segments use deterministic range-start identifiers: `plain-{start}` (unique per position)
   - Prevents stale fragment reuse while maintaining token identity stability

2. **Canvas DOM/Code Desync Detection** (`rce/src/cores/Canvas.tsx`):
   - Added `getEditorCodeFromDom()` check to detect when DOM diverges from React state
   - If code length changes without active token interaction, triggers one-time canvas remount via `syncKey` state
   - Self-healing mechanism: clears ghost DOM content by forcing React reconciliation

3. **Restored Widget Interaction Stability**:
   - Reverted overly-strict range-checking in `MemoizedToken` memo
   - Token memo now ignores range jitter (small position shifts) to preserve widget interaction smoothness
   - Separate checks for token ID, text, component ref, and active/hovered state

**Files modified:**
- `rce/src/utils/rendering.ts` – Refined segment key generation strategy
- `rce/src/cores/Canvas.tsx` – Added DOM/code drift detection and self-heal remount guard

**Impact:** Eliminates visual corruption while maintaining smooth draggable widget interactions.

#### TypeScript Type Strictness

- Added explicit return type annotations to styled components for improved declaration file portability
- Fixed `any` types in `NumberWidget` and `JSNumberWidget` through migration to new widget hooks
- All TypeScript checks pass cleanly (`pnpm exec tsc --noEmit`)

### Changed

#### Widget Component Refactoring

- **`NumberWidget.tsx`** – Migrated to use `useWidgetToken()` and `useWidgetDrag()` hooks
  - Removes manual token dispatch logic
  - Cleaner state management for drag interactions
  - Improved type safety (no `any` types)

- **`JSNumberWidget.tsx`** – Migrated to use new widget hooks with same improvements

#### Editor State Expansion

- Added `hoveredTokenId: string | null` to `EditorState` – Tracks which token the user is hovering over
- Added `suggestionsTriggeredByTyping: boolean` to `EditorState` – Controls suggestion visibility
- New editor actions: `SET_HOVERED_TOKEN`, `SET_SUGGESTIONS_TRIGGERED_BY_TYPING`

#### Suggestions Component Behavior

- `Suggestions.tsx` now filters rendering based on `suggestionsTriggeredByTyping` flag
- Suggestions clear automatically when flag is set to `false` (on selection, navigation, etc.)
- Improves UX by preventing distraction during document browsing

### Technical Details

#### New Type Exports

- `rce/src/type.ts` – Backward-compatible type export barrel for existing import paths
- Exports: `WidgetComponent`, `WidgetComponentProps`, `WidgetDefinition`, `WidgetTokenizer`
- Maintains import compatibility for existing widget code

#### Backward Compatibility

All changes are fully backward compatible:
- Existing widgets continue to work unchanged
- New widget hooks are optional; old `useEditor()` pattern still works
- Existing imports for types are preserved via `type.ts` shim

### Performance

- **Widget rendering:** No change (surgical memoization unchanged)
- **Tokenization:** Improved via stable DOM code extraction (avoids re-reading malformed DOM)
- **Suggestion filtering:** Negligible overhead (boolean flag check)

### Build & Quality

- **TypeScript:** Clean pass with no errors or warnings
- **Build:** `pnpm exec tsc --noEmit` passes
- **Monorepo:** All workspaces (rce, example) compile cleanly

---

## Known Limitations

1. **Multi-line decorators:** Widget decorators cannot contain newlines (automatically sanitized)
2. **Overlapping tokenizers:** If two tokenizers match the same range, only the first registered widget appears
3. **Performance at scale:** Editors with 10,000+ tokens may experience slowdown in suggestion computation

---

## Migration Guides

### Migrating Existing Widgets to New Hooks

If you have custom widgets using `useEditor()` directly:

```typescript
// OLD: Manual dispatch
const MyWidget: WidgetComponent = ({ token }) => {
  const { state, dispatch } = useEditor()
  
  const handleChange = (newText) => {
    dispatch({
      type: "SET_TOKEN_TEXT",
      payload: { tokenId: token.id, newText }
    })
  }
  
  return <div onClick={() => handleChange("new")}>Click me</div>
}

// NEW: Using widget hooks
import { useWidgetToken } from "react-code-editor"

const MyWidget: WidgetComponent = ({ token }) => {
  const { setText } = useWidgetToken(token)
  
  return <div onClick={() => setText("new")}>Click me</div>
}
```

See [Widget Hooks API Reference](./WIDGET_HOOKS_API.md) for complete migration examples.

---

## Future Roadmap

Potential improvements for future releases:

- [ ] `useWidgetValue` hook for parsed value extraction (e.g., numeric vs unit parsing)
- [ ] `useWidgetValidation` hook for input validation with error handling
- [ ] Built-in color picker widget with named color support
- [ ] Gesture support (long-press, multi-touch) via extended drag handler
- [ ] Performance optimizations for tokenizers on very large files
- [ ] Widget composition API for building complex multi-part widgets

---

## Support & Issues

For bug reports, feature requests, or questions about the widget API, please open an issue on the project repository.

**Documentation:**
- [Widget Hooks API Reference](./WIDGET_HOOKS_API.md)
- [Custom Widgets Guide](./CUSTOM_WIDGETS_GUIDE.md)
- [Architecture Reference](./rce_architecture_summary.md)
