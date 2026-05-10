import { useCallback, useEffect, useRef, useState } from "react"
import { useEditor } from "../Editor"
import { Token } from "../types"

export function sanitizeWidgetText(value: string) {
    return value.replace(/[\r\n]/g, "")
}

export function useWidgetToken(token: Token) {
    const { state, dispatch } = useEditor()
    const tokenRef = useRef(token)
    tokenRef.current = token

    const setText = useCallback((newText: string) => {
        dispatch({
            type: "SET_TOKEN_TEXT",
            payload: {
                tokenId: tokenRef.current.id,
                newText: sanitizeWidgetText(newText)
            }
        })
    }, [dispatch])

    const setActive = useCallback(() => {
        dispatch({ type: "SET_ACTIVE_TOKEN", payload: tokenRef.current.id })
    }, [dispatch])

    const clearActive = useCallback(() => {
        dispatch({ type: "SET_ACTIVE_TOKEN", payload: null })
    }, [dispatch])

    const setHovered = useCallback(() => {
        dispatch({ type: "SET_HOVERED_TOKEN", payload: tokenRef.current.id })
    }, [dispatch])

    const clearHovered = useCallback(() => {
        dispatch({ type: "SET_HOVERED_TOKEN", payload: null })
    }, [dispatch])

    return {
        tokenRef,
        text: token.text,
        isActive: state.activeTokenId === token.id,
        isHovered: state.hoveredTokenId === token.id,
        setText,
        setActive,
        clearActive,
        setHovered,
        clearHovered
    }
}

type DragMoveArgs = {
    event: MouseEvent
    deltaX: number
    deltaY: number
}

type UseWidgetDragOptions = {
    cursor?: string
    onStart?: (event: React.MouseEvent<HTMLElement>) => void
    onMove: (args: DragMoveArgs) => void
    onEnd?: () => void
}

export function useWidgetDrag(options: UseWidgetDragOptions) {
    const [dragging, setDragging] = useState(false)
    const optionsRef = useRef(options)
    const moveHandlerRef = useRef<((event: MouseEvent) => void) | null>(null)
    const upHandlerRef = useRef<((event: MouseEvent) => void) | null>(null)

    useEffect(() => {
        optionsRef.current = options
    }, [options])

    const stopDrag = useCallback(() => {
        if (moveHandlerRef.current) {
            document.removeEventListener("mousemove", moveHandlerRef.current)
            moveHandlerRef.current = null
        }

        if (upHandlerRef.current) {
            document.removeEventListener("mouseup", upHandlerRef.current)
            upHandlerRef.current = null
        }

        document.body.style.cursor = ""
        setDragging(false)
        optionsRef.current.onEnd?.()
    }, [])

    useEffect(() => {
        return () => {
            stopDrag()
        }
    }, [stopDrag])

    const onMouseDown = useCallback((event: React.MouseEvent<HTMLElement>) => {
        if (event.button !== 0) return

        const startX = event.clientX
        const startY = event.clientY
        optionsRef.current.onStart?.(event)
        setDragging(true)

        moveHandlerRef.current = (nextEvent: MouseEvent) => {
            optionsRef.current.onMove({
                event: nextEvent,
                deltaX: nextEvent.clientX - startX,
                deltaY: nextEvent.clientY - startY
            })
        }

        upHandlerRef.current = () => {
            stopDrag()
        }

        document.addEventListener("mousemove", moveHandlerRef.current)
        document.addEventListener("mouseup", upHandlerRef.current)
        document.body.style.cursor = optionsRef.current.cursor ?? "ew-resize"

        event.preventDefault()
    }, [stopDrag])

    return {
        dragging,
        onMouseDown
    }
}
