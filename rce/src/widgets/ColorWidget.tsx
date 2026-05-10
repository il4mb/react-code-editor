import { useEffect, useRef, useState } from "react"
import { WidgetComponent } from "../types"
import { useEditor } from "../Editor"
import { styled } from "@mui/system"
import { createPortal } from "react-dom"
import { useOverlayElement } from "../Shell"

const ColorSpan = styled("span")({
    display: "inline-block",
    width: 14,
    height: 14,
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.2)",
    marginRight: 4,
    marginLeft: 2,
    verticalAlign: "middle",
    cursor: "pointer",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
    transition: "transform 0.1s ease",
    "&:hover": {
        transform: "scale(1.2)"
    }
})

const PickerContainer = styled("div")({
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "180px",
    padding: "10px",
    backgroundColor: "#1e1e1e",
    border: "1px solid #333",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    userSelect: "none",
    pointerEvents: "auto",
    zIndex: 1000,
})

const SpectrumArea = styled("div")({
    position: "relative",
    width: "100%",
    height: "120px",
    borderRadius: "4px",
    overflow: "hidden",
    cursor: "crosshair"
})

const Slider = styled("div")({
    position: "relative",
    width: "100%",
    height: "12px",
    borderRadius: "6px",
    cursor: "pointer",
})

const SliderHandle = styled("div")({
    position: "absolute",
    top: "-2px",
    width: "4px",
    height: "16px",
    backgroundColor: "#fff",
    border: "1px solid #000",
    borderRadius: "2px",
    transform: "translateX(-50%)",
    pointerEvents: "none"
})

const SpectrumPointer = styled("div")({
    position: "absolute",
    width: "12px",
    height: "12px",
    border: "2px solid #fff",
    borderRadius: "50%",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.5)",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none"
})

export const ColorWidget: WidgetComponent = ({ children, token, renderDecorator }: any) => {
    const { state, dispatch } = useEditor()
    const overlay = useOverlayElement()
    
    const [coords, setCoords] = useState({ top: 0, left: 0 })
    const [visible, setVisible] = useState(false)
    const [isInteracting, setIsInteracting] = useState(false)
    
    const hsvRef = useRef({ h: 0, s: 0, v: 0, a: 1 })
    const isInteractingRef = useRef(false)
    const swatchRef = useRef<HTMLSpanElement>(null)
    const showTimer = useRef<number | null>(null)
    const closeTimer = useRef<number | null>(null)

    const isHovered = state.hoveredTokenId === token.id
    const colorText = token.text
    const formatInfo = detectFormat(colorText)
    
    const displayHsv = isInteracting ? hsvRef.current : parseColorToHsv(colorText)
    const currentColor = hsvToHex(displayHsv.h, displayHsv.s, displayHsv.v)

    useEffect(() => {
        if (isHovered && !visible) {
            setVisible(true)
            hsvRef.current = parseColorToHsv(colorText)
        } else if (!isHovered && visible && !isInteractingRef.current) {
            setVisible(false)
        }
    }, [isHovered, visible])

    const handleUpdate = (h: number, s: number, v: number, a: number) => {
        hsvRef.current = { h, s, v, a }
        
        let newText = ""
        if (formatInfo.format === "rgb") {
            const rgb = hsvToRgb(h, s, v)
            newText = formatInfo.hasAlpha 
                ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a.toFixed(2)})`
                : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
        } else if (formatInfo.format === "hsl") {
            const hsl = hsvToHsl(h, s, v)
            newText = formatInfo.hasAlpha
                ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a.toFixed(2)})`
                : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
        } else {
            newText = formatInfo.hasAlpha 
                ? hsvToHexWithAlpha(h, s, v, a)
                : hsvToHex(h, s, v)
        }

        dispatch({
            type: "SET_TOKEN_TEXT",
            payload: { tokenId: token.id, newText }
        })
        
        setIsInteracting(true) 
    }

    const onMouseEnter = () => {
        if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
        if (!isHovered) {
            if (showTimer.current) clearTimeout(showTimer.current)
            showTimer.current = window.setTimeout(() => {
                if (swatchRef.current) {
                    const rect = swatchRef.current.getBoundingClientRect()
                    const overlayRect = overlay.current?.getBoundingClientRect() || { left: 0, top: 0 }
                    setCoords({
                        top: rect.bottom + 5 - overlayRect.top,
                        left: rect.left - overlayRect.left
                    })
                    dispatch({ type: "SET_HOVERED_TOKEN", payload: token.id })
                }
            }, 2000)
        }
    }

    const onMouseLeave = () => {
        if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
        closeTimer.current = window.setTimeout(() => {
            if (state.hoveredTokenId === token.id && !isInteractingRef.current) {
                dispatch({ type: "SET_HOVERED_TOKEN", payload: null })
            }
        }, 2000)
    }

    const onSwatchClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
        if (swatchRef.current) {
            const rect = swatchRef.current.getBoundingClientRect()
            const overlayRect = overlay.current?.getBoundingClientRect() || { left: 0, top: 0 }
            setCoords({
                top: rect.bottom + 5 - overlayRect.top,
                left: rect.left - overlayRect.left
            })
            dispatch({ type: "SET_HOVERED_TOKEN", payload: token.id })
        }
    }

    useEffect(() => {
        if (state.position !== null && isHovered && !isInteractingRef.current) {
            dispatch({ type: "SET_HOVERED_TOKEN", payload: null })
        }
    }, [state.position])

    return (
        <span onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {renderDecorator && (
                <ColorSpan
                    ref={swatchRef}
                    onClick={onSwatchClick}
                    sx={{ backgroundColor: formatInfo.hasAlpha ? colorText : currentColor }}
                    data-ignore="true"
                    contentEditable={false}
                />
            )}

            {visible && overlay.current && createPortal(
                <PickerContainer 
                    style={{ top: coords.top, left: coords.left }}
                    onMouseEnter={onMouseEnter} 
                    onMouseLeave={onMouseLeave}>
                    <ColorSpectrum 
                        hsv={displayHsv} 
                        onStart={() => { setIsInteracting(true); isInteractingRef.current = true; }}
                        onEnd={() => { setIsInteracting(false); isInteractingRef.current = false; }}
                        onChange={(s: number, v: number) => handleUpdate(hsvRef.current.h, s, v, hsvRef.current.a)} 
                    />
                    <HueSlider 
                        h={displayHsv.h} 
                        onStart={() => { setIsInteracting(true); isInteractingRef.current = true; }}
                        onEnd={() => { setIsInteracting(false); isInteractingRef.current = false; }}
                        onChange={(h: number) => handleUpdate(h, hsvRef.current.s, hsvRef.current.v, hsvRef.current.a)} 
                    />
                    {formatInfo.hasAlpha && (
                        <AlphaSlider
                            a={displayHsv.a}
                            color={currentColor}
                            onStart={() => { setIsInteracting(true); isInteractingRef.current = true; }}
                            onEnd={() => { setIsInteracting(false); isInteractingRef.current = false; }}
                            onChange={(a: number) => handleUpdate(hsvRef.current.h, hsvRef.current.s, hsvRef.current.v, a)}
                        />
                    )}
                    <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "space-between",
                        fontSize: "10px",
                        color: "#aaa",
                        fontFamily: "monospace"
                    }}>
                        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{colorText}</span>
                        <div style={{ 
                            width: 14, 
                            height: 14, 
                            backgroundColor: formatInfo.hasAlpha ? colorText : currentColor, 
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.1)"
                        }} />
                    </div>
                </PickerContainer>,
                overlay.current
            )}
            {children}
        </span>
    )
}

const ColorSpectrum = ({ hsv, onStart, onEnd, onChange }: any) => {
    const areaRef = useRef<HTMLDivElement>(null)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const handleMove = (e: MouseEvent | React.MouseEvent) => {
        if (!areaRef.current) return
        const rect = areaRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
        onChangeRef.current(x * 100, y * 100)
    }
    const onMouseDown = (e: React.MouseEvent) => {
        onStart()
        handleMove(e)
        const onMouseMove = (me: MouseEvent) => handleMove(me)
        const onMouseUp = () => {
            onEnd()
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
        }
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    }
    return (
        <SpectrumArea ref={areaRef} onMouseDown={onMouseDown} style={{ backgroundColor: hsvToHex(hsv.h, 100, 100) }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #fff, transparent)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #000, transparent)" }} />
            <SpectrumPointer style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }} />
        </SpectrumArea>
    )
}

const HueSlider = ({ h, onStart, onEnd, onChange }: any) => {
    const sliderRef = useRef<HTMLDivElement>(null)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const handleMove = (e: MouseEvent | React.MouseEvent) => {
        if (!sliderRef.current) return
        const rect = sliderRef.current.getBoundingClientRect()
        const hue = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360))
        onChangeRef.current(hue)
    }
    const onMouseDown = (e: React.MouseEvent) => {
        onStart()
        handleMove(e)
        const onMouseMove = (me: MouseEvent) => handleMove(me)
        const onMouseUp = () => {
            onEnd()
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
        }
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    }
    return (
        <Slider ref={sliderRef} onMouseDown={onMouseDown} style={{ background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)" }}>
            <SliderHandle style={{ left: `${(h / 360) * 100}%` }} />
        </Slider>
    )
}

const AlphaSlider = ({ a, color, onStart, onEnd, onChange }: any) => {
    const sliderRef = useRef<HTMLDivElement>(null)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const handleMove = (e: MouseEvent | React.MouseEvent) => {
        if (!sliderRef.current) return
        const rect = sliderRef.current.getBoundingClientRect()
        const alpha = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        onChangeRef.current(alpha)
    }
    const onMouseDown = (e: React.MouseEvent) => {
        onStart()
        handleMove(e)
        const onMouseMove = (me: MouseEvent) => handleMove(me)
        const onMouseUp = () => {
            onEnd()
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
        }
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
    }
    return (
        <Slider ref={sliderRef} onMouseDown={onMouseDown} style={{ 
            background: `linear-gradient(to right, transparent, ${color}), 
                        url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACFJREFUGF5jYmBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgAAAABJRU5ErkJggg==')` 
        }}>
            <SliderHandle style={{ left: `${a * 100}%` }} />
        </Slider>
    )
}

const HEX_PATTERN = /#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/g
const RGB_PATTERN = /rgba?\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)/g
const HSL_PATTERN = /hsla?\s*\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*[\d.]+)?\s*\)/g

ColorWidget.widget = {
    tokenizer(code: string) {
        const ranges: [number, number][] = []
        let m: RegExpExecArray | null
        HEX_PATTERN.lastIndex = 0
        while ((m = HEX_PATTERN.exec(code)) !== null) ranges.push([m.index, m.index + m[0].length])
        RGB_PATTERN.lastIndex = 0
        while ((m = RGB_PATTERN.exec(code)) !== null) ranges.push([m.index, m.index + m[0].length])
        HSL_PATTERN.lastIndex = 0
        while ((m = HSL_PATTERN.exec(code)) !== null) ranges.push([m.index, m.index + m[0].length])
        return ranges
    }
}

function detectFormat(text: string): { format: "hex" | "rgb" | "hsl", hasAlpha: boolean } {
    const lower = text.toLowerCase()
    if (text.startsWith("#")) return { format: "hex", hasAlpha: text.length > 7 }
    if (lower.startsWith("rgb")) return { format: "rgb", hasAlpha: lower.startsWith("rgba") || lower.includes(",") && lower.split(",").length > 3 }
    if (lower.startsWith("hsl")) return { format: "hsl", hasAlpha: lower.startsWith("hsla") || lower.includes(",") && lower.split(",").length > 3 }
    return { format: "hex", hasAlpha: false }
}

function parseColorToHsv(text: string): { h: number, s: number, v: number, a: number } {
    if (text.startsWith("#")) {
        const rgb = hexToRgb(text)
        const [h, s, v] = rgbToHsv(rgb.r, rgb.g, rgb.b)
        return { h, s, v, a: rgb.a }
    }
    if (text.toLowerCase().startsWith("rgb")) {
        const rgb = parseRgba(text)
        if (!rgb) return { h: 0, s: 0, v: 0, a: 1 }
        const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2])
        return { h, s, v, a: rgb[3] ?? 1 }
    }
    if (text.toLowerCase().startsWith("hsl")) {
        const hsl = parseHsla(text)
        if (!hsl) return { h: 0, s: 0, v: 0, a: 1 }
        const [r, g, b] = hslToRgbValues(hsl[0], hsl[1], hsl[2])
        const [h, s, v] = rgbToHsv(r, g, b)
        return { h, s, v, a: hsl[3] ?? 1 }
    }
    return { h: 0, s: 0, v: 0, a: 1 }
}

function hexToRgb(hex: string) {
    let r = 0, g = 0, b = 0, a = 1
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16); g = parseInt(hex[2] + hex[2], 16); b = parseInt(hex[3] + hex[3], 16)
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16)
    } else if (hex.length === 9) {
        r = parseInt(hex.slice(1, 3), 16); g = parseInt(hex.slice(3, 5), 16); b = parseInt(hex.slice(5, 7), 16)
        a = parseInt(hex.slice(7, 9), 16) / 255
    }
    return { r, g, b, a }
}

function hsvToRgb(h: number, s: number, v: number) {
    s /= 100; v /= 100
    const i = Math.floor(h / 60); const f = h / 60 - i
    const p = v * (1 - s); const q = v * (1 - f * s); const t = v * (1 - (1 - f) * s)
    let r = 0, g = 0, b = 0
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break
        case 1: r = q; g = v; b = p; break
        case 2: r = p; g = v; b = t; break
        case 3: r = p; g = q; b = v; break
        case 4: r = t; g = p; b = v; break
        case 5: r = v; g = p; b = q; break
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

function hsvToHsl(h: number, s: number, v: number) {
    s /= 100; v /= 100;
    let l = (2 - s) * v / 2;
    if (l !== 0) {
        if (l === 1) s = 0;
        else if (l < 0.5) s = s * v / (l * 2);
        else s = s * v / (2 - l * 2);
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgbValues(h: number, s: number, l: number): [number, number, number] {
    s /= 100; l /= 100; h /= 360;
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hsvToHex(h: number, s: number, v: number) {
    const rgb = hsvToRgb(h, s, v)
    const f2h = (n: number) => n.toString(16).padStart(2, '0')
    return `#${f2h(rgb.r)}${f2h(rgb.g)}${f2h(rgb.b)}`
}

function hsvToHexWithAlpha(h: number, s: number, v: number, a: number) {
    const rgb = hsvToRgb(h, s, v)
    const f2h = (n: number) => n.toString(16).padStart(2, '0')
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0')
    return `#${f2h(rgb.r)}${f2h(rgb.g)}${f2h(rgb.b)}${alphaHex}`
}

function parseRgba(match: string): [number, number, number, number?] | null {
    const pattern = /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?/
    const result = pattern.exec(match)
    return result ? [parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), result[4] ? parseFloat(result[4]) : undefined] : null
}

function parseHsla(match: string): [number, number, number, number?] | null {
    const pattern = /hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*([\d.]+))?/
    const result = pattern.exec(match)
    return result ? [parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), result[4] ? parseFloat(result[4]) : undefined] : null
}

function rgbToHsv(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, v = max
    const d = max - min
    s = max === 0 ? 0 : d / max
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
        }
        h /= 6
    }
    return [h * 360, s * 100, v * 100] as [number, number, number]
}
