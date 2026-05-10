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
            const next = event.shiftKey ? redo() : undo();
            if (next) {
                applySnapshot(next, event.shiftKey ? "redo" : "undo");
            }
            return;
        }

        if (isModKey && !event.shiftKey && event.key.toLowerCase() === "y") {
            event.preventDefault();
            const next = redo();
            if (next) applySnapshot(next, "redo");
            return;
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
                }
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                dispatch({ type: "SET_SUGGESTIONS", payload: [] });
                return;
            }
        }

        // Generic shortcuts handled by the main handler (indent, newline, etc.)
    }, [isMac, state, dispatch, applyResult, undo, redo, applySnapshot]);

    return { handleKeyDown };
}
