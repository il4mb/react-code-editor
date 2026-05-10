import { useCallback, useRef, useMemo } from "react";
import { EditorState, Range } from "../type";
import { isRangeEqual } from "../utils/range";

export type Snapshot = {
    code: string;
    selection: Range | null;
    position: number | null;
};

export function sameSnapshot(left: Snapshot, right: Snapshot) {
    return (
        left.code === right.code &&
        isRangeEqual(left.selection, right.selection) &&
        left.position === right.position
    );
}

export function useHistory(state: EditorState) {
    const historyRef = useRef<{ past: Snapshot[]; future: Snapshot[] }>({
        past: [],
        future: []
    });

    const snapshot = useMemo<Snapshot>(() => ({
        code: state.code,
        selection: state.selection,
        position: state.position
    }), [state.code, state.selection, state.position]);

    const pushToHistory = useCallback((current: Snapshot, next: Snapshot) => {
        if (!sameSnapshot(current, next)) {
            historyRef.current.past.push(current);
            if (historyRef.current.past.length > 100) {
                historyRef.current.past.shift();
            }
            historyRef.current.future = [];
        }
    }, []);

    const undo = useCallback(() => {
        const next = historyRef.current.past.pop();
        if (next) {
            historyRef.current.future.push(snapshot);
        }
        return next;
    }, [snapshot]);

    const redo = useCallback(() => {
        const next = historyRef.current.future.pop();
        if (next) {
            historyRef.current.past.push(snapshot);
        }
        return next;
    }, [snapshot]);

    return {
        snapshot,
        pushToHistory,
        undo,
        redo,
        hasPast: historyRef.current.past.length > 0,
        hasFuture: historyRef.current.future.length > 0
    };
}
