import { useCallback, useRef } from "react";
import { EditorAction, EditorState, Range } from "../type";
import { getSelectionOffsets, setSelectionOffsets } from "../utils/caret";
import { isRangeEqual } from "../utils/range";

export function useSelection(
    state: EditorState,
    dispatch: React.Dispatch<EditorAction>,
    editorRef: React.RefObject<HTMLElement | null>,
    isComposing: React.RefObject<boolean>
) {
    const suppressSelectionSync = useRef(false);

    const syncSelection = useCallback(() => {
        if (suppressSelectionSync.current || isComposing.current) return;

        const editor = editorRef.current;
        if (!editor) return;

        const range = getSelectionOffsets(editor);
        if (!range) return;

        const codeLength = state.code.length;
        const clampedRange: Range = [
            Math.min(range[0], codeLength),
            Math.min(range[1], codeLength)
        ];
        const nextPosition =
            clampedRange[0] === clampedRange[1] ? clampedRange[1] : null;

        if (
            !isRangeEqual(state.selection, clampedRange) ||
            state.position !== nextPosition
        ) {
            dispatch({ type: "SET_SELECTION", payload: clampedRange });
            dispatch({ type: "SET_POSITION", payload: nextPosition });
        }
    }, [dispatch, state.code.length, state.position, state.selection, editorRef, isComposing]);

    const restoreSelection = useCallback((selection: Range) => {
        const editor = editorRef.current;
        if (!editor) return;

        suppressSelectionSync.current = true;
        setSelectionOffsets(editor, selection[0], selection[1]);
        setTimeout(() => {
            suppressSelectionSync.current = false;
        }, 0);
    }, [editorRef]);

    return {
        syncSelection,
        restoreSelection,
        suppressSelectionSync
    };
}
