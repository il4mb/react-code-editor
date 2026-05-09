import { createContext, createRef, RefObject, useContext, useRef } from "react"
import Canvas from "./Canvas"

export default function Shell() {
    const overlayRef = useRef<HTMLDivElement>(null)
    return (
        <OverlayElement.Provider value={overlayRef}>
            <div className="code-editor-shell">
                <Canvas />
                <div className="slots-overlay" ref={overlayRef} />
            </div>
        </OverlayElement.Provider>
    )
}

const OverlayElement = createContext<RefObject<HTMLDivElement | null>>(createRef())
export const useOverlayElement = () => {
    return useContext(OverlayElement)
}
