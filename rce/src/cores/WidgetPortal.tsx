import { createPortal } from "react-dom"
import { useEditableElement } from "./Canvas"
import { RefObject, useEffect, useState } from "react"
import { getCaretCoordinates } from "../utils/caret"
import { useEditor } from "../Editor"
import { useOverlayElement } from "../Shell"
import { styled, SxProps } from "@mui/system"

const Element = styled("div")({
    position: "absolute",
    zIndex: 100,
})

interface WidgetPortalProps {
    children?: React.ReactNode
    sx?: SxProps
    anchor?: RefObject<HTMLElement | null>
    anchorOrigin?: {
        vertical: "top" | "bottom"
        horizontal: "left" | "right"
    }
}

export default function WidgetPortal({ children, sx, anchor, anchorOrigin }: WidgetPortalProps) {

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
        if (anchor?.current) {
            const rect = anchor.current.getBoundingClientRect()
            const origin = anchorOrigin ?? { vertical: "bottom", horizontal: "left" }
            const globalX = origin.horizontal === "left" ? rect.left : rect.right
            const globalY = origin.vertical === "top" ? rect.top : rect.bottom
            setCoordinates(globalToRelative(globalX, globalY))
            return
        }
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
    }, [editor.current, position, anchor?.current, anchorOrigin])

    if (!overlay.current || !coordinates) return null
    return createPortal(
        <Element sx={{
            left: coordinates?.x,
            top: coordinates?.y,
            ...sx
        }}>
            {children}
        </Element>,
        overlay.current
    )
}
