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

## 5. Summary of Stability Rules
- **Never use range as a key**: Always use `token.id`.
- **Never pass anonymous functions to widgets**: Use direct dispatch.
- **Ignore range in memo comparison**: Only check `id`, `text`, and `isActive`.
- **Always use refs for interaction logic**: Avoid stale closures in document event listeners.
