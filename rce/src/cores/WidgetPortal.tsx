import { createPortal } from "react-dom"
import { useEditableElement } from "./Canvas"
import { useEffect, useState } from "react"
import { getCaretCoordinates } from "../utils/caret"
import { useEditor } from "../Editor"
import { useOverlayElement } from "../Shell"

interface WidgetPortalProps {
    children?: React.ReactNode
}

export default function WidgetPortal({ children }: WidgetPortalProps) {

    const { state: { position } } = useEditor()
    const overlay = useOverlayElement()
    const editor = useEditableElement()
    const [coordinates, setCoordinates] = useState<{ x: number; y: number } | null>(
        null
    )

    const relativeToGlobal = (x: number, y: number) => {
        if (!editor.current) return { x, y }
        const rect = editor.current.getBoundingClientRect()
        return {
            x: rect.left + x,
            y: rect.top + y
        }
    }

    const globalToRelative = (x: number, y: number) => {
        if (!editor.current) return { x, y }
        const rect = editor.current.getBoundingClientRect()
        return {
            x: x - rect.left,
            y: y - rect.top
        }
    }

    useEffect(() => {
        if (!editor.current) return
        const coordinate = getCaretCoordinates(editor.current)
        if (coordinate) {
            const maxX = document.documentElement.clientWidth
            const maxY = document.documentElement.clientHeight
            const globalCoord = relativeToGlobal(
                coordinate.x,
                coordinate.y + coordinate.height
            )
            const clampedX = Math.min(globalCoord.x, maxX)
            const clampedY = Math.min(globalCoord.y, maxY)
            setCoordinates(globalToRelative(clampedX, clampedY))
        }
    }, [editor.current, position])

    if (!overlay.current || !coordinates) return null
    return createPortal(
        <div
            className="widget-portal"
            style={{ left: coordinates?.x, top: coordinates?.y }}>
            {children}
        </div>,
        overlay.current
    )
}
