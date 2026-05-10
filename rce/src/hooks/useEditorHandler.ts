import { useCallback, useEffect, useRef } from "react"
import { EditorAction, EditorState, Range } from "../types"
import {
    deleteBackward,
    deleteForward,
    indent,
    insertNewLine,
    insertText
} from "../utils/editing"
import { buildTokens } from "../utils/tokenizer"
import { useWidgets } from "../cores/WidgetsProvider"
import { useHistory, Snapshot } from "./useHistory"
import { useSelection } from "./useSelection"
import { useKeyboardActions } from "./useKeyboardActions"
import { getSelectionOffsets } from "../utils/caret"

export function useEditorHandler(state: EditorState, dispatch: React.Dispatch<EditorAction>) {
    const widgets = useWidgets();
    const editorRef = useRef<HTMLElement>(null)
    const isComposing = useRef(false)
    const handledBeforeInputRef = useRef(false)

    const { snapshot, pushToHistory, undo, redo } = useHistory(state)
    const { syncSelection, restoreSelection, suppressSelectionSync } = useSelection(state, dispatch, editorRef, isComposing)

    const lastTokenizationRef = useRef<{ code: string; widgets: any }>({ code: "", widgets: null })

    const applySnapshot = useCallback((next: Snapshot, mode: "edit" | "undo" | "redo" = "edit") => {
        const current = {
            code: state.code,
            selection: state.selection,
            position: state.position
        }

        if (mode === "edit") {
            pushToHistory(current, next)
        }

        const nextTokens = buildTokens(next.code, widgets)
        
        // Update the ref so the useEffect skips this change
        lastTokenizationRef.current = { code: next.code, widgets }

        dispatch({ 
            type: "UPDATE", 
            payload: {
                code: next.code,
                tokens: nextTokens,
                selection: next.selection,
                position: next.position
            }
        })
    }, [dispatch, state.code, state.position, state.selection, widgets, pushToHistory])

    const applyResult = useCallback((result: { code: string; selection: Range; position: number }) => {
        applySnapshot(result, "edit")
    }, [applySnapshot])

    const { handleKeyDown: baseKeyDown } = useKeyboardActions({
        state,
        dispatch,
        applyResult,
        undo,
        redo,
        applySnapshot
    })

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (isComposing.current) return
        
        baseKeyDown(event)
        if (event.defaultPrevented) return

        const isMod = event.ctrlKey || event.metaKey;

        // Editor specific keys
        if (event.key === "Tab") {
            event.preventDefault()
            applyResult(indent(state))
        } else if (event.key === "Enter") {
            event.preventDefault()
            applyResult(insertNewLine(state))
        } else if (event.key === "Backspace") {
            event.preventDefault()
            applyResult(deleteBackward(state, isMod ? 'word' : 'char'))
        } else if (event.key === "Delete") {
            event.preventDefault()
            applyResult(deleteForward(state, isMod ? 'word' : 'char'))
        }
    }, [baseKeyDown, applyResult, state])

    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLElement>) => {
        if (isComposing.current) return
        const text = event.clipboardData.getData("text/plain")
        if (text) {
            event.preventDefault()
            applyResult(insertText(state, text))
        }
    }, [applyResult, state])

    const handleCompositionStart = useCallback(() => { isComposing.current = true }, [])
    const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLElement>) => {
        isComposing.current = false
        const editor = editorRef.current ?? event.currentTarget
        const nextCode = editor.textContent ?? ""
        const range = getSelectionOffsets(editor) ?? [nextCode.length, nextCode.length]
        const clampedRange: Range = [Math.min(range[0], nextCode.length), Math.min(range[1], nextCode.length)]
        applySnapshot({
            code: nextCode,
            selection: clampedRange,
            position: clampedRange[0] === clampedRange[1] ? clampedRange[1] : null
        })
    }, [applySnapshot])

    // Native beforeinput listener for maximum reliability
    useEffect(() => {
        const editor = editorRef.current
        if (!editor) return

        const onBeforeInput = (event: Event) => {
            const inputEvent = event as InputEvent
            if (isComposing.current) return

            const { inputType, data } = inputEvent
            const char = data ?? ""

            const handlers: Record<string, () => void> = {
                insertText: () => applyResult(insertText(state, char)),
                deleteContentBackward: () => applyResult(deleteBackward(state)),
                deleteContentForward: () => applyResult(deleteForward(state)),
                insertLineBreak: () => applyResult(insertNewLine(state)),
                insertParagraph: () => applyResult(insertNewLine(state))
            }

            if (handlers[inputType]) {
                event.preventDefault()
                handledBeforeInputRef.current = true
                handlers[inputType]()
            }
        }

        const onInput = (event: Event) => {
            if (isComposing.current) return
            if (handledBeforeInputRef.current) {
                handledBeforeInputRef.current = false
                syncSelection()
                return
            }

            const nextCode = editor.textContent ?? ""
            const range = getSelectionOffsets(editor) ?? [nextCode.length, nextCode.length]
            const clampedRange: Range = [Math.min(range[0], nextCode.length), Math.min(range[1], nextCode.length)]

            applySnapshot({
                code: nextCode,
                selection: clampedRange,
                position: clampedRange[0] === clampedRange[1] ? clampedRange[1] : null
            })
        }

        editor.addEventListener("beforeinput", onBeforeInput)
        editor.addEventListener("input", onInput)
        return () => {
            editor.removeEventListener("beforeinput", onBeforeInput)
            editor.removeEventListener("input", onInput)
        }
    }, [applyResult, applySnapshot, state, syncSelection])

    // Sync selection on global selection change
    useEffect(() => {
        const onSelectionChange = () => {
            if (suppressSelectionSync.current || isComposing.current) return
            const editor = editorRef.current
            if (!editor || !editor.contains(document.activeElement)) return
            syncSelection()
        }
        document.addEventListener("selectionchange", onSelectionChange)
        return () => document.removeEventListener("selectionchange", onSelectionChange)
    }, [syncSelection, suppressSelectionSync])

    // Handle initial load and external code/widget changes (Debounced)
    useEffect(() => {
        if (state.code === lastTokenizationRef.current.code && widgets === lastTokenizationRef.current.widgets) {
            return;
        }

        const timeout = setTimeout(() => {
            // Re-check if code hasn't changed since we scheduled this
            if (state.code !== lastTokenizationRef.current.code) {
                lastTokenizationRef.current = { code: state.code, widgets }
                const tokens = buildTokens(state.code, widgets, state.tokens)
                dispatch({ type: "SET_TOKENS", payload: tokens })
            }
        }, 150); // 150ms debounce for background tokenization

        return () => clearTimeout(timeout);
    }, [widgets, state.code, dispatch])

    return {
        editorRef,
        isComposing,
        handleKeyDown,
        handlePaste,
        handleCompositionStart,
        handleCompositionEnd,
        handleMouseUp: syncSelection,
        restoreSelection,
        syncSelection
    }
}
