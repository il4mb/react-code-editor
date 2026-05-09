import {
    createContext,
    createRef,
    ReactNode,
    RefObject,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo
} from "react"
import { useEditorContext } from "../EditorProvider"
import { useEditor } from "../hooks/useEditor"
import { buildRenderSegments } from "../utils/rendering"
import { getCaretCoordinates } from "../utils/caret"
import { styled } from "@mui/system"

const CanvasElement = styled("code")({
    position: "relative",
    display: "block",
    minHeight: "280px",
    outline: "none",
    overflow: "auto",
    whiteSpace: "pre",
    tabSize: 4,
    lineHeight: 1.7,
    letterSpacing: "0.01em",
    fontFamily: '"SFMono-Regular", "JetBrains Mono", "Cascadia Mono", Consolas, "Liberation Mono", monospace',
    fontSize: "12px",
    caretColor: "var(--editor-accent)",
    '&:focus': {
        outline: 'none',
    }
})

export default function Canvas() {
    const { state, dispatch } = useEditorContext()
    const { code, tokens, selection } = state
    const {
        editorRef,
        isComposing,
        handleInput,
        handleBeforeInput,
        handleKeyDown,
        handlePaste,
        handleCompositionStart,
        handleCompositionEnd,
        handleMouseUp,
        restoreSelection,
        syncSelection
    } = useEditor(state, dispatch)

    const segments = useMemo(() => buildRenderSegments(code, tokens), [code, tokens])
    const content = useMemo(() => {
        const nodes: ReactNode[] = []

        for (const segment of segments) {
            const wrapped = segment.tokens.reduceRight<ReactNode>(
                (children, token) => {
                    const TokenComponent = token.component
                    return (
                        <TokenComponent
                            key={`${segment.key}:${token.range[0]}:${token.range[1]}`}
                            token={token}>
                            {children}
                        </TokenComponent>
                    )
                },
                segment.text
            )

            nodes.push(
                <span
                    key={segment.key}
                    data-segment-start={segment.start}
                    data-segment-end={segment.end}>
                    {wrapped}
                </span>
            )
        }

        return nodes
    }, [segments])

    useLayoutEffect(() => {
        if (selection && !isComposing.current) {
            restoreSelection(selection)
        }
    }, [content, restoreSelection, selection, isComposing])

    useEffect(() => {
        if (editorRef.current && state.position !== null) {
            const coordinates = getCaretCoordinates(editorRef.current)
            if (coordinates) {
                dispatch({ type: "SET_CARET_COORDINATES", payload: coordinates })
            }
        }
    }, [state.position, dispatch])

    return (
        <EditableElement.Provider value={editorRef}>
            <CanvasElement
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onBeforeInput={handleBeforeInput}
                onPaste={handlePaste}
                onKeyUp={syncSelection}
                onClick={syncSelection}
                onMouseUp={handleMouseUp}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                spellCheck={false}
                autoCapitalize="off">
                {content}
            </CanvasElement>
        </EditableElement.Provider>
    )
}

const EditableElement = createContext<RefObject<HTMLElement | null>>(createRef())
export const useEditableElement = () => {
    return useContext(EditableElement)
}
