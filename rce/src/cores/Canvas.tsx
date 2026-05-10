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
import { buildRenderSegments } from "../utils/rendering"
import { getCaretCoordinates } from "../utils/caret"
import { styled } from "@mui/system"
import { useEditor } from "../Editor"
import { useEditorHandler } from "../hooks/useEditorHandler"
import { useBraceMatching } from "../hooks/useBraceMatching"
import Span from "./Span"
import { DiagnosticDecorator } from "./DiagnosticDecorator"

const CanvasElement = styled("code")({
    position: "relative",
    display: "block",
    minHeight: "280px",
    padding: "20px 20px 20px 10px",
    outline: "none",
    overflow: "visible",
    whiteSpace: "pre",
    tabSize: 4,
    lineHeight: 1.7,
    letterSpacing: "0.01em",
    color: "#dbdbdbff",
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
    fontSize: "13px",
    borderRadius: "8px",
    transition: "box-shadow 0.2s ease",
    '&:focus': {
        outline: 'none',
    }
})

const MatchHighlight = styled("span")({
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.4)",
    borderRadius: "2px",
})

const HighlightSpan = styled("span", {
    shouldForwardProp: (prop) => !['color', 'backgroundColor', 'fontWeight', 'fontStyle'].includes(prop as string)
})<{ color?: string, backgroundColor?: string, fontWeight?: string, fontStyle?: string }>(({ color, backgroundColor, fontWeight, fontStyle }) => ({
    color,
    backgroundColor,
    fontWeight,
    fontStyle
}))



export default function Canvas() {
    const { state, dispatch } = useEditor()
    const { code, tokens, selection, diagnostics } = state
    const {
        editorRef,
        isComposing,
        handleKeyDown,
        handlePaste,
        handleCompositionStart,
        handleCompositionEnd,
        handleMouseUp,
        restoreSelection,
        syncSelection
    } = useEditorHandler(state, dispatch)

    const matchingBraces = useBraceMatching(state)
    const segments = useMemo(() => {
        const extraBoundaries = matchingBraces ? [matchingBraces[0], matchingBraces[0] + 1, matchingBraces[1], matchingBraces[1] + 1] : []
        return buildRenderSegments(code, tokens, diagnostics, extraBoundaries, state.highlights)
    }, [code, tokens, diagnostics, matchingBraces, state.highlights])
    const content = useMemo(() => {
        const nodes: ReactNode[] = []

        for (const segment of segments) {
            let wrapped = segment.tokens.reduceRight<ReactNode>(
                (children, token) => {
                    const TokenComponent = token.component
                    
                    const handleWidgetChange = (newText: string) => {
                        const newCode = state.code.slice(0, token.range[0]) + newText + state.code.slice(token.range[1]);
                        dispatch({ type: "SET_CODE", payload: newCode });
                    };

                    return (
                        <Span
                            as={TokenComponent}
                            segments={{
                                start: segment.start,
                                end: segment.end
                            }}
                            key={`${segment.key}:${token.range[0]}:${token.range[1]}`}
                            token={token}
                            onChange={handleWidgetChange}>
                            {children}
                        </Span>
                    )
                },
                segment.text
            )

            if (segment.diagnostics.length > 0) {
                const highestSeverity = segment.diagnostics.reduce((acc, curr) => {
                    if (acc === 'error' || curr.severity === 'error') return 'error';
                    if (acc === 'warning' || curr.severity === 'warning') return 'warning';
                    return 'info';
                }, 'info' as 'error' | 'warning' | 'info');

                wrapped = (
                    <DiagnosticDecorator
                        severity={highestSeverity}
                        data-message={segment.diagnostics.map(d => d.message).join("\n")}>
                        {wrapped}
                    </DiagnosticDecorator>
                )
            }

            // Apply highlights
            if (segment.highlights.length > 0) {
                // Apply first highlight (simple strategy for now)
                const h = segment.highlights[0]
                wrapped = (
                    <HighlightSpan
                        color={h.color}
                        backgroundColor={h.backgroundColor}
                        fontWeight={h.fontWeight}
                        fontStyle={h.fontStyle}
                        className={h.className}>
                        {wrapped}
                    </HighlightSpan>
                )
            }

            // Check if this segment contains a matching brace
            if (matchingBraces && ((segment.start === matchingBraces[0] && segment.end === matchingBraces[0] + 1) || (segment.start === matchingBraces[1] && segment.end === matchingBraces[1] + 1))) {
                wrapped = <MatchHighlight>{wrapped}</MatchHighlight>
            }

            nodes.push(
                <Span
                    key={segment.key}
                    segments={{
                        start: segment.start,
                        end: segment.end
                    }}>
                    {wrapped}
                </Span>
            )
        }

        // Add a placeholder BR at the end to ensure trailing newlines render correctly
        // and the caret can be placed at the end of the document.
        nodes.push(<br key="placeholder" data-placeholder="true" />)

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
                onKeyDown={handleKeyDown}
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
