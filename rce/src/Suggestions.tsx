import { useEffect, useState, useRef } from "react"
import { useEditor } from "./Editor"
import { getCurrentWord, getSuggestions as getDefaultSuggestions } from "./utils/suggestions"
import { useSuggestionResolver } from "./cores/SuggestionsProvider"
import { styled } from "@mui/system"

const SuggestionsContainer = styled("div")({
    position: "absolute",
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#cccccc",
    borderRadius: "6px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
    zIndex: 2000,
    overflowY: "auto",
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    userSelect: "none",
    scrollbarWidth: 'thin',
    scrollbarColor: '#444 transparent',
    padding: "4px 0",
})

const SuggestionList = styled("ul")({
    margin: 0,
    padding: 0,
    listStyle: "none",
})

const SuggestionItem = styled("li", {
    shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ active }) => ({
    padding: "0 12px",
    height: "32px",
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: "pointer",
    fontSize: "13px",
    backgroundColor: active ? "#094771" : "transparent",
    color: active ? "#ffffff" : "#cccccc",
    transition: 'background-color 0.1s ease',
    '&:hover': {
        backgroundColor: active ? "#094771" : "rgba(255, 255, 255, 0.05)",
    }
}))

const SuggestionIcon = styled("span", {
    shouldForwardProp: (prop) => prop !== "type",
})<{ type: 'P' | 'V' }>(({ type }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 'bold',
    backgroundColor: type === 'P' ? 'rgba(0, 122, 204, 0.2)' : 'rgba(184, 115, 51, 0.2)',
    color: type === 'P' ? '#4fc1ff' : '#d7ba7d',
    border: `1px solid ${type === 'P' ? 'rgba(79, 193, 255, 0.2)' : 'rgba(215, 186, 125, 0.2)'}`
}))

export default function Suggestions() {
    const { state, dispatch } = useEditor()
    const { caretCoordinates, code, position, suggestions, suggestionIndex } = state
    const [coordinates, setCoordinates] = useState<{ x: number; y: number } | null>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)
    const resolver = useSuggestionResolver()
    const lastPositionRef = useRef<number | null>(null)

    const WIDTH = 280
    const MAX_HEIGHT = 220

    useEffect(() => {
        if (caretCoordinates) {
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            let x = caretCoordinates.x
            let y = caretCoordinates.y + caretCoordinates.height + 8

            if (x + WIDTH > viewportWidth - 20) {
                x = Math.max(20, viewportWidth - WIDTH - 20)
            }

            const spaceBelow = viewportHeight - y
            if (spaceBelow < MAX_HEIGHT && y > MAX_HEIGHT) {
                y = caretCoordinates.y - MAX_HEIGHT - 8
            }

            setCoordinates({ x, y })
        } else {
            setCoordinates(null)
        }
    }, [caretCoordinates])

    useEffect(() => {
        const isInsideToken = state.tokens.some(t => position !== null && position >= t.range[0] && position < t.range[1]);

        if (position !== null && state.activeTokenId === null && state.hoveredTokenId === null && !isInsideToken) {
            const isContiguous = lastPositionRef.current === null || Math.abs(position - lastPositionRef.current) <= 1
            lastPositionRef.current = position

            if (!isContiguous) {
                dispatch({ type: "SET_SUGGESTIONS", payload: [] })
                return
            }

            const { word } = getCurrentWord(code, position)
            const matches = resolver 
                ? resolver(word, { code, position }) 
                : getDefaultSuggestions(word)
            
            dispatch({ type: "SET_SUGGESTIONS", payload: matches })
        } else {
            lastPositionRef.current = null
            dispatch({ type: "SET_SUGGESTIONS", payload: [] })
        }
    }, [code, position, dispatch, resolver, state.activeTokenId, state.hoveredTokenId, state.tokens])

    useEffect(() => {
        if (suggestionsRef.current && suggestionIndex >= 0) {
            const items = suggestionsRef.current.querySelectorAll('li')
            items[suggestionIndex]?.scrollIntoView({ block: 'nearest' })
        }
    }, [suggestionIndex])

    const handleSelect = (suggestion: string) => {
        if (position === null) return
        const { start, end } = getCurrentWord(code, position)
        const nextCode = code.slice(0, start) + suggestion + code.slice(end)
        const nextPosition = start + suggestion.length
        
        dispatch({ type: "SET_CODE", payload: nextCode })
        dispatch({ type: "SET_POSITION", payload: nextPosition })
        dispatch({ type: "SET_SELECTION", payload: [nextPosition, nextPosition] })
        dispatch({ type: "SET_SUGGESTIONS", payload: [] })
    }

    if (!coordinates || suggestions.length === 0) return null

    return (
        <SuggestionsContainer
            ref={suggestionsRef}
            style={{
                left: `${coordinates.x}px`,
                top: `${coordinates.y}px`,
                width: `${WIDTH}px`,
                maxHeight: `${MAX_HEIGHT}px`,
            }}
        >
            <SuggestionList>
                {suggestions.map((suggestion, i) => {
                    const isProperty = !suggestion.includes(' ') && !suggestion.includes('#');
                    return (
                        <SuggestionItem
                            key={`${suggestion}-${i}`}
                            active={i === suggestionIndex}
                            onClick={() => handleSelect(suggestion)}
                            onMouseEnter={() => dispatch({ type: "SET_SUGGESTION_INDEX", payload: i })}
                        >
                            <SuggestionIcon type={isProperty ? 'P' : 'V'}>
                                {isProperty ? 'P' : 'V'}
                            </SuggestionIcon>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {suggestion}
                            </span>
                        </SuggestionItem>
                    )
                })}
            </SuggestionList>
        </SuggestionsContainer>
    )
}
