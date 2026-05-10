import { createContext, createRef, RefObject, useContext, useRef } from "react"
import Canvas from "./cores/Canvas"
import { styled } from "@mui/system"

const ShellElement = styled("div")({
    position: "relative",
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    alignContent: "flex-start",
    justifyContent: "flex-start",
    justifyItems: "flex-start",
    boxSizing: "border-box",
    flex: "1 0 0%",
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
                <Canvas />
                <OverlayElement ref={overlayRef} />
            </ShellElement>
        </OverlayElementProvider>
    )
}

const OverlayElementProvider = createContext<RefObject<HTMLDivElement | null>>(createRef())
export const useOverlayElement = () => {
    return useContext(OverlayElementProvider)
}
