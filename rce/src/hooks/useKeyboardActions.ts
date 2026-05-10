import { useCallback } from "react";
import { EditorAction, EditorState } from "../type";
import { getCurrentWord } from "../utils/suggestions";
import { Snapshot } from "./useHistory";

interface KeyboardActionsProps {
    state: EditorState;
    dispatch: React.Dispatch<EditorAction>;
    applyResult: (result: { code: string; selection: [number, number]; position: number }) => void;
    undo: () => Snapshot | undefined;
    redo: () => Snapshot | undefined;
    applySnapshot: (next: Snapshot, mode?: "edit" | "undo" | "redo") => void;
}

export function useKeyboardActions({
    state,
    dispatch,
    applyResult,
    undo,
    redo,
    applySnapshot
}: KeyboardActionsProps) {

    const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        const isModKey = isMac ? event.metaKey : event.ctrlKey;

        // Undo/Redo
        if (isModKey && event.key.toLowerCase() === "z") {
            event.preventDefault();
            dispatch({ type: "SET_SUGGESTIONS_TRIGGERED_BY_TYPING", payload: false });
            const next = event.shiftKey ? redo() : undo();
            if (next) {
                applySnapshot(next, event.shiftKey ? "redo" : "undo");
            }
            return;
        }

        if (isModKey && !event.shiftKey && event.key.toLowerCase() === "y") {
            event.preventDefault();
            dispatch({ type: "SET_SUGGESTIONS_TRIGGERED_BY_TYPING", payload: false });
            const next = redo();
            if (next) applySnapshot(next, "redo");
            return;
        }

        const navigationKeys = new Set([
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
            "PageUp",
            "PageDown"
        ]);

        if (navigationKeys.has(event.key)) {
            dispatch({ type: "SET_SUGGESTIONS_TRIGGERED_BY_TYPING", payload: false });
        }

        // Auto-closing brackets
        const pairs: Record<string, string> = {
            '(': ')',
            '[': ']',
            '{': '}',
            '"': '"',
            "'": "'",
        };

        if (pairs[event.key]) {
            event.preventDefault();
            dispatch({ type: "SET_SUGGESTIONS_TRIGGERED_BY_TYPING", payload: true });
            const char = event.key;
            const closeChar = pairs[char];
            const pos = state.position ?? 0;
            const selection = state.selection ?? [pos, pos];
            const start = Math.min(selection[0], selection[1]);
            const end = Math.max(selection[0], selection[1]);

            if (start !== end) {
                const selectedText = state.code.slice(start, end);
                applyResult({
                    code: state.code.slice(0, start) + char + selectedText + closeChar + state.code.slice(end),
                    selection: [start + 1, end + 1],
                    position: end + 1
                });
            } else {
                applyResult({
                    code: state.code.slice(0, start) + char + closeChar + state.code.slice(end),
                    selection: [start + 1, start + 1],
                    position: start + 1
                });
            }
            return;
        }

        // Special handling for Enter between braces
        if (event.key === "Enter" && state.position !== null) {
            const pos = state.position;
            const before = state.code[pos - 1];
            const after = state.code[pos];
            if (before === "{" && after === "}") {
                event.preventDefault();
                const indentUnit = "    ";
                const lineStartPos = state.code.lastIndexOf("\n", pos - 2) + 1;
                const currentIndent = state.code.slice(lineStartPos, pos - 1).match(/^\s*/)?.[0] ?? "";
                
                const nextCode = state.code.slice(0, pos) + "\n" + currentIndent + indentUnit + "\n" + currentIndent + state.code.slice(pos);
                const nextPos = pos + 1 + currentIndent.length + indentUnit.length;
                applyResult({
                    code: nextCode,
                    selection: [nextPos, nextPos],
                    position: nextPos
                });
                return;
            }
        }

        // Suggestions navigation
        if (state.suggestions.length > 0) {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                dispatch({
                    type: "SET_SUGGESTION_INDEX",
                    payload: (state.suggestionIndex + 1) % state.suggestions.length
                });
                return;
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                dispatch({
                    type: "SET_SUGGESTION_INDEX",
                    payload: (state.suggestionIndex - 1 + state.suggestions.length) % state.suggestions.length
                });
                return;
            }
            if (event.key === "Enter" || event.key === "Tab") {
                event.preventDefault();
                const suggestion = state.suggestions[state.suggestionIndex];
                if (suggestion && state.position !== null) {
                    const { start, end } = getCurrentWord(state.code, state.position);
                    const nextCode = state.code.slice(0, start) + suggestion + state.code.slice(end);
                    const nextPosition = start + suggestion.length;
                    applyResult({
                        code: nextCode,
                        selection: [nextPosition, nextPosition],
                        position: nextPosition
                    });
                    dispatch({ type: "SET_SUGGESTIONS", payload: [] });
                    dispatch({ type: "SET_SUGGESTIONS_TRIGGERED_BY_TYPING", payload: false });
                }
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                dispatch({ type: "SET_SUGGESTIONS", payload: [] });
                dispatch({ type: "SET_SUGGESTIONS_TRIGGERED_BY_TYPING", payload: false });
                return;
            }
        }

        // Generic shortcuts handled by the main handler (indent, newline, etc.)
    }, [isMac, state, dispatch, applyResult, undo, redo, applySnapshot]);

    return { handleKeyDown };
}
