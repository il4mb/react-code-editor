import { createContext, createRef, RefObject, useContext, useRef } from "react"
import Canvas from "./cores/Canvas"
import LineNumbers from "./cores/LineNumbers"
import Suggestions from "./Suggestions"
import { styled } from "@mui/system"

const ShellElement = styled("div")({
    position: "relative",
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#1e1e1e",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
})

const EditorLayout = styled("div")({
    display: "flex",
    flexDirection: "row",
    flex: 1,
    overflow: "auto", // The main scrollable area
    position: "relative",
})

const OverlayElement = styled("div")({
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 100
})

export default function Shell() {
    const overlayRef = useRef<HTMLDivElement>(null)
    return (
        <OverlayElementProvider value={overlayRef}>
            <ShellElement>
                <EditorLayout>
                    <LineNumbers />
                    <div style={{ flex: 1, position: "relative" }}>
                        <Canvas />
                    </div>
                    <OverlayElement ref={overlayRef} />
                </EditorLayout>
                <Suggestions />
            </ShellElement>
        </OverlayElementProvider>
    )
}

const OverlayElementProvider = createContext<RefObject<HTMLDivElement | null>>(createRef())
export const useOverlayElement = () => {
    return useContext(OverlayElementProvider)
}
