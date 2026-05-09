import { useEffect, useState } from "react"
import { useEditorContext } from "./EditorProvider"

interface SuggestionsProps { }

export default function Suggestions({ }: SuggestionsProps) {
    const { state } = useEditorContext()
    const { caretCoordinates } = state
    const [suggestions, setSuggestions] = useState<string[]>([])

    const WIDTH = 220
    const HEIGHT = 100
    const MARGIN = 10
    const [coordinates, setCoordinates] = useState<{ x: number; y: number } | null>(
        null
    )

    useEffect(() => {
        if (caretCoordinates) {
            const editor = document.querySelector(".editable-canvas") as HTMLElement | null
            const editorRect = editor?.getBoundingClientRect()

            if (!editorRect) {
                setCoordinates(null)
                return
            }

            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            const caretX = editorRect.left + caretCoordinates.x
            const caretY = editorRect.top + caretCoordinates.y

            let x = caretX
            let y = caretY + caretCoordinates.height + MARGIN

            if (x + WIDTH > viewportWidth - MARGIN) {
                x = Math.max(MARGIN, viewportWidth - WIDTH - MARGIN)
            }

            if (y + HEIGHT > viewportHeight - MARGIN) {
                y = caretY - HEIGHT - MARGIN
            }

            y = Math.max(MARGIN, y)
            setCoordinates({ x, y })
        } else {
            setCoordinates(null)
        }
    }, [caretCoordinates])

    useEffect(() => {
        // Get suggestions based on caret position
        if (caretCoordinates) {
            // TODO: Implement suggestion logic based on code and position
            setSuggestions(["example1", "example2", "example3"])
        }
    }, [caretCoordinates])

    if (!caretCoordinates || suggestions.length === 0) {
        return null
    }

    return null;
    return (
        <div
            style={{
                position: "fixed",
                left: `${coordinates?.x ?? 0}px`,
                top: `${coordinates?.y ?? 0}px`,
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                color: "#333",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                zIndex: 1000,
                width: `${WIDTH}px`,
                height: `${HEIGHT}px`,
                overflowY: "auto"
            }}>
            <ul style={{ margin: 0, padding: "8px 0", listStyle: "none" }}>
                {suggestions.map((suggestion, i) => (
                    <li
                        key={i}
                        style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontSize: "14px"
                        }}
                        onMouseEnter={e => {
                            ; (e.currentTarget as HTMLElement).style.backgroundColor =
                                "#f0f0f0"
                        }}
                        onMouseLeave={e => {
                            ; (e.currentTarget as HTMLElement).style.backgroundColor =
                                "transparent"
                        }}>
                        {suggestion}
                    </li>
                ))}
            </ul>
        </div>
    )
}
