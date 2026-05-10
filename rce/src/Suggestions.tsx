import { useEffect, useState, useRef } from "react"
import { useEditor } from "./Editor"
import { getCurrentWord, getSuggestions as getDefaultSuggestions } from "./utils/suggestions"
import { useSuggestionResolver } from "./cores/SuggestionsProvider"

export default function Suggestions() {
    const { state, dispatch } = useEditor()
    const { caretCoordinates, code, position, suggestions, suggestionIndex } = state
    const [coordinates, setCoordinates] = useState<{ x: number; y: number } | null>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)
    const resolver = useSuggestionResolver()
    const lastPositionRef = useRef<number | null>(null)

    const WIDTH = 280
    const MAX_HEIGHT = 220
    const ITEM_HEIGHT = 32

    useEffect(() => {
        if (caretCoordinates) {
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            let x = caretCoordinates.x
            let y = caretCoordinates.y + caretCoordinates.height + 8

            // Horizontal flip
            if (x + WIDTH > viewportWidth - 20) {
                x = Math.max(20, viewportWidth - WIDTH - 20)
            }

            // Vertical flip if no space below
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
        if (position !== null) {
            const isContiguous = lastPositionRef.current === null || Math.abs(position - lastPositionRef.current) <= 1
            lastPositionRef.current = position

            if (!isContiguous) {
                dispatch({ type: "SET_SUGGESTIONS", payload: [] })
                return
            }

            const { word } = getCurrentWord(code, position)
            let matches: string[] = []
            
            if (resolver) {
                matches = resolver(word, { code, position })
            } else {
                matches = getDefaultSuggestions(word)
            }
            
            dispatch({ type: "SET_SUGGESTIONS", payload: matches })
        } else {
            lastPositionRef.current = null
            dispatch({ type: "SET_SUGGESTIONS", payload: [] })
        }
    }, [code, position, dispatch, resolver])

    // Scroll active item into view
    useEffect(() => {
        if (suggestionsRef.current && suggestionIndex >= 0) {
            const activeItem = suggestionsRef.current.querySelectorAll('li')[suggestionIndex]
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest' })
            }
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

    if (!coordinates || suggestions.length === 0) {
        return null
    }

    return (
        <div
            ref={suggestionsRef}
            style={{
                position: "absolute",
                left: `${coordinates.x}px`,
                top: `${coordinates.y}px`,
                backgroundColor: "rgba(30, 30, 30, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#cccccc",
                borderRadius: "6px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
                zIndex: 2000,
                width: `${WIDTH}px`,
                maxHeight: `${MAX_HEIGHT}px`,
                overflowY: "auto",
                fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
                userSelect: "none",
                scrollbarWidth: 'thin',
                scrollbarColor: '#444 transparent'
            }}>
            <ul style={{ margin: 0, padding: "4px 0", listStyle: "none" }}>
                {suggestions.map((suggestion, i) => {
                    const isProperty = !suggestion.includes(' ') && !suggestion.includes('#'); // Simple heuristic
                    return (
                        <li
                            key={`${suggestion}-${i}`}
                            onClick={() => handleSelect(suggestion)}
                            style={{
                                padding: "0 12px",
                                height: `${ITEM_HEIGHT}px`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: "pointer",
                                fontSize: "13px",
                                backgroundColor: i === suggestionIndex ? "#094771" : "transparent",
                                color: i === suggestionIndex ? "#ffffff" : "#cccccc",
                                transition: 'background-color 0.1s ease'
                            }}
                            onMouseEnter={() => {
                                dispatch({ type: "SET_SUGGESTION_INDEX", payload: i })
                            }}>
                            <span style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                height: '16px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                backgroundColor: isProperty ? 'rgba(0, 122, 204, 0.2)' : 'rgba(184, 115, 51, 0.2)',
                                color: isProperty ? '#4fc1ff' : '#d7ba7d',
                                border: `1px solid ${isProperty ? 'rgba(79, 193, 255, 0.2)' : 'rgba(215, 186, 125, 0.2)'}`
                            }}>
                                {isProperty ? 'P' : 'V'}
                            </span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {suggestion}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
