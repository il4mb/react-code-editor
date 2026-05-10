import { useCallback, useEffect, useMemo, useRef } from "react"
import { EditorAction, EditorState, Range } from "../type"
import { setSelectionOffsets, getSelectionOffsets } from "../utils/caret"
import {
    deleteBackward,
    deleteForward,
    indent,
    insertNewLine,
    insertText
} from "../utils/editing"
import { isRangeEqual } from "../utils/range"
import { buildTokens } from "../utils/tokenizer"
import { useWidgets } from "../cores/WidgetsProvider"
import { getCurrentWord } from "../utils/suggestions"

type Snapshot = {
    code: string
    selection: Range | null
    position: number | null
}

function sameSnapshot(left: Snapshot, right: Snapshot) {
    return (
        left.code === right.code &&
        isRangeEqual(left.selection, right.selection) &&
        left.position === right.position
    )
}

function isMacPlatform() {
    return (
        typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    )
}

export function useEditorHandler(state: EditorState, dispatch: React.Dispatch<EditorAction>) {

    const widgets = useWidgets();
    const editorRef = useRef<HTMLElement>(null)
    const isComposing = useRef(false)
    const suppressSelectionSync = useRef(false)
    const handledBeforeInputRef = useRef(false)
    const historyRef = useRef<{ past: Snapshot[]; future: Snapshot[] }>({
        past: [],
        future: []
    })

    // prettier-ignore
    const snapshot = useMemo<Snapshot>(() => ({
        code: state.code,
        selection: state.selection,
        position: state.position
    }), [state.code, state.selection, state.position])

    // prettier-ignore
    const applySnapshot = useCallback((next: Snapshot, mode: "edit" | "undo" | "redo" = "edit") => {
        const current = {
            code: state.code,
            selection: state.selection,
            position: state.position
        }

        if (mode === "edit") {
            if (!sameSnapshot(current, next)) {
                historyRef.current.past.push(current)
                if (historyRef.current.past.length > 100) {
                    historyRef.current.past.shift()
                }
                historyRef.current.future = []
            }
        }

        dispatch({ type: "SET_CODE", payload: next.code })
        const nextTokens = buildTokens(next.code, widgets)
        dispatch({ type: "SET_TOKENS", payload: nextTokens })
        dispatch({ type: "SET_SELECTION", payload: next.selection })
        dispatch({ type: "SET_POSITION", payload: next.position })
    }, [dispatch, state.code, state.position, state.selection, widgets])

    // prettier-ignore
    const applyResult = useCallback((result: { code: string; selection: Range; position: number }) => {
        applySnapshot(result, "edit")
    }, [applySnapshot])

    const syncSelection = useCallback(() => {
        if (suppressSelectionSync.current || isComposing.current) return

        const editor = editorRef.current
        if (!editor) return

        const range = getSelectionOffsets(editor)
        if (!range) return

        const codeLength = state.code.length
        const clampedRange: Range = [
            Math.min(range[0], codeLength),
            Math.min(range[1], codeLength)
        ]
        const nextPosition =
            clampedRange[0] === clampedRange[1] ? clampedRange[1] : null
        if (
            !isRangeEqual(state.selection, clampedRange) ||
            state.position !== nextPosition
        ) {
            dispatch({ type: "SET_SELECTION", payload: clampedRange })
            dispatch({ type: "SET_POSITION", payload: nextPosition })
        }
    }, [dispatch, state.code.length, state.position, state.selection])

    const restoreSelection = useCallback((selection: Range) => {
        const editor = editorRef.current
        if (!editor) return

        suppressSelectionSync.current = true
        setSelectionOffsets(editor, selection[0], selection[1])
        queueMicrotask(() => {
            suppressSelectionSync.current = false
        })
    }, [])

    const handleBeforeInput = useCallback(
        (event: React.FormEvent<HTMLElement>) => {
            if (isComposing.current) return

            const nativeEvent = event.nativeEvent as InputEvent
            const inputType = nativeEvent.inputType
            const data = nativeEvent.data ?? ""

            if (inputType === "insertText" && data) {
                event.preventDefault()
                handledBeforeInputRef.current = true
                applyResult(insertText(state, data))
                return
            }

            if (inputType === "deleteContentBackward") {
                event.preventDefault()
                handledBeforeInputRef.current = true
                applyResult(deleteBackward(state))
                return
            }

            if (inputType === "deleteContentForward") {
                event.preventDefault()
                handledBeforeInputRef.current = true
                applyResult(deleteForward(state))
                return
            }

            if (inputType === "insertLineBreak" || inputType === "insertParagraph") {
                event.preventDefault()
                handledBeforeInputRef.current = true
                applyResult(insertNewLine(state))
            }
        },
        [applyResult, state]
    )

    const handlePaste = useCallback(
        (event: React.ClipboardEvent<HTMLElement>) => {
            if (isComposing.current) return

            const text = event.clipboardData.getData("text/plain")
            if (!text) return

            event.preventDefault()
            applyResult(insertText(state, text))
        },
        [applyResult, state]
    )

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (isComposing.current) return

            const isModKey = isMacPlatform() ? event.metaKey : event.ctrlKey

            if (isModKey && event.key.toLowerCase() === "z") {
                event.preventDefault()
                const history = historyRef.current
                const next = event.shiftKey
                    ? history.future.pop()
                    : history.past.pop()
                if (!next) return

                if (event.shiftKey) {
                    history.past.push(snapshot)
                    applySnapshot(next, "redo")
                } else {
                    history.future.push(snapshot)
                    applySnapshot(next, "undo")
                }
                return
            }

            if (isModKey && !event.shiftKey && event.key.toLowerCase() === "y") {
                event.preventDefault()
                const next = historyRef.current.future.pop()
                if (!next) return
                historyRef.current.past.push(snapshot)
                applySnapshot(next, "redo")
                return
            }

            if (state.suggestions.length > 0) {
                if (event.key === "ArrowDown") {
                    event.preventDefault()
                    dispatch({
                        type: "SET_SUGGESTION_INDEX",
                        payload: (state.suggestionIndex + 1) % state.suggestions.length
                    })
                    return
                }
                if (event.key === "ArrowUp") {
                    event.preventDefault()
                    dispatch({
                        type: "SET_SUGGESTION_INDEX",
                        payload: (state.suggestionIndex - 1 + state.suggestions.length) % state.suggestions.length
                    })
                    return
                }
                if (event.key === "Enter" || event.key === "Tab") {
                    event.preventDefault()
                    const suggestion = state.suggestions[state.suggestionIndex]
                    if (suggestion && state.position !== null) {
                        const { word, start, end } = getCurrentWord(state.code, state.position)
                        const nextCode = state.code.slice(0, start) + suggestion + state.code.slice(end)
                        const nextPosition = start + suggestion.length
                        applyResult({
                            code: nextCode,
                            selection: [nextPosition, nextPosition],
                            position: nextPosition
                        })
                        dispatch({ type: "SET_SUGGESTIONS", payload: [] })
                    }
                    return
                }
                if (event.key === "Escape") {
                    event.preventDefault()
                    dispatch({ type: "SET_SUGGESTIONS", payload: [] })
                    return
                }
            }

            if (event.key === "Tab") {
                event.preventDefault()
                applyResult(indent(state))
                return
            }

            if (event.key === "Enter") {
                event.preventDefault()
                applyResult(insertNewLine(state))
                return
            }

            if (event.key === "Backspace") {
                event.preventDefault()
                applyResult(deleteBackward(state))
                return
            }

            if (event.key === "Delete") {
                event.preventDefault()
                applyResult(deleteForward(state))
            }
        },
        [applyResult, applySnapshot, snapshot, state]
    )

    const handleInput = useCallback(
        (event: React.FormEvent<HTMLElement>) => {
            if (isComposing.current) return

            console.debug("[input] fired, handledBeforeInputRef =", handledBeforeInputRef.current)

            if (handledBeforeInputRef.current) {
                handledBeforeInputRef.current = false
                console.debug("[input] flag was true, skipping (beforeinput already handled)")
                syncSelection()
                return
            }

            const editor = editorRef.current ?? event.currentTarget
            const nextCode = editor.textContent ?? ""

            console.debug("[input] reading DOM, nextCode =", nextCode)

            const range = getSelectionOffsets(editor) ?? [nextCode.length, nextCode.length]
            const clampedRange: Range = [
                Math.min(range[0], nextCode.length),
                Math.min(range[1], nextCode.length)
            ]

            console.debug("[input] applying snapshot with code =", nextCode)
            applySnapshot({
                code: nextCode,
                selection: clampedRange,
                position: clampedRange[0] === clampedRange[1] ? clampedRange[1] : null
            })
        },
        [applySnapshot, syncSelection]
    )

    const handleCompositionStart = useCallback(() => {
        isComposing.current = true
    }, [])

    const handleCompositionEnd = useCallback(
        (event: React.CompositionEvent<HTMLElement>) => {
            isComposing.current = false
            const editor = editorRef.current ?? event.currentTarget
            const nextCode = editor.textContent ?? ""
            const range = getSelectionOffsets(editor) ?? [
                nextCode.length,
                nextCode.length
            ]
            const clampedRange: Range = [
                Math.min(range[0], nextCode.length),
                Math.min(range[1], nextCode.length)
            ]
            applySnapshot({
                code: nextCode,
                selection: clampedRange,
                position:
                    clampedRange[0] === clampedRange[1] ? clampedRange[1] : null
            })
        },
        [applySnapshot]
    )

    useEffect(() => {
        const editor = editorRef.current
        if (!editor) return

        const nativeBeforeInput = (event: Event) => {
            const inputEvent = event as InputEvent
            console.debug("[beforeinput NATIVE]", {
                inputType: inputEvent.inputType,
                data: inputEvent.data
            })
            if (isComposing.current) return

            const inputType = inputEvent.inputType
            const data = inputEvent.data ?? ""

            if (inputType === "insertText" && data) {
                event.preventDefault()
                handledBeforeInputRef.current = true
                console.debug("[beforeinput NATIVE] handling insertText")
                applyResult(insertText(state, data))
                return
            }

            if (inputType === "deleteContentBackward") {
                event.preventDefault()
                handledBeforeInputRef.current = true
                console.debug("[beforeinput NATIVE] handling deleteBackward")
                applyResult(deleteBackward(state))
                return
            }

            if (inputType === "deleteContentForward") {
                event.preventDefault()
                handledBeforeInputRef.current = true
                console.debug("[beforeinput NATIVE] handling deleteForward")
                applyResult(deleteForward(state))
                return
            }

            if (inputType === "insertLineBreak" || inputType === "insertParagraph") {
                event.preventDefault()
                handledBeforeInputRef.current = true
                console.debug("[beforeinput NATIVE] handling insertNewLine")
                applyResult(insertNewLine(state))
            }
        }

        editor.addEventListener("beforeinput", nativeBeforeInput)
        return () => editor.removeEventListener("beforeinput", nativeBeforeInput)
    }, [applyResult, state])


    useEffect(() => {
        const tokens = buildTokens(state.code, widgets);
        dispatch({ type: "SET_TOKENS", payload: tokens });
        // only trigger when widgets is changed, not when tokens is changed
    }, [widgets]);

    useEffect(() => {
        const onSelectionChange = () => {
            if (suppressSelectionSync.current || isComposing.current) return

            const editor = editorRef.current
            if (!editor) return

            const activeElement = document.activeElement
            if (!activeElement || !editor.contains(activeElement)) return

            syncSelection()
        }

        document.addEventListener("selectionchange", onSelectionChange)
        return () =>
            document.removeEventListener("selectionchange", onSelectionChange)
    }, [syncSelection])

    const handleMouseUp = useCallback(() => {
        syncSelection()
    }, [syncSelection])

    return {
        editorRef,
        isComposing,
        handleBeforeInput,
        handleKeyDown,
        handleInput,
        handlePaste,
        handleCompositionStart,
        handleCompositionEnd,
        handleMouseUp,
        restoreSelection,
        syncSelection
    }
}
