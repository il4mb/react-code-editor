import { Range } from "../type"
import {
    getSelectionOffsets as getDomSelectionOffsets,
    setSelectionOffsets as setDomSelectionOffsets
} from "./domMapping"

export function getSelectionOffsets(container: HTMLElement): Range | null {
    return getDomSelectionOffsets(container)
}

export function setSelectionOffsets(
    container: HTMLElement,
    start: number,
    end: number
) {
    setDomSelectionOffsets(container, start, end)
}

export interface CaretCoordinates {
    x: number
    y: number
    height: number
}

export function getCaretCoordinates(container: HTMLElement): CaretCoordinates | null {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return null

    try {
        const range = selection.getRangeAt(0).cloneRange()
        
        // Create a temporary span to get the exact position
        const span = document.createElement("span")
        span.textContent = "|"
        span.style.display = "inline"
        range.insertNode(span)
        
        const rect = span.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        
        span.remove()
        
        return {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            height: rect.height
        }
    } catch {
        return null
    }
}
