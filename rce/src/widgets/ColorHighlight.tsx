import React, { useEffect, useState } from "react"
import { WidgetComponent } from "../type"
import { useCodeState } from "../EditorProvider"
import WidgetPortal from "../cores/WidgetPortal"

const HEX_PATTERN = /#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/g
const RGB_PATTERN =
    /rgba?\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)/g
const HSL_PATTERN =
    /hsla?\s*\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*[\d.]+)?\s*\)/g

function normalizeHexColor(hex: string): string {
    const clean = hex.slice(1)
    if (clean.length === 3) {
        return (
            "#" +
            clean
                .split("")
                .map(c => c + c)
                .join("")
        )
    }
    return hex.slice(0, 7)
}

function parseRgb(match: string): [number, number, number, number?] | null {
    const pattern =
        /rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)/
    const result = pattern.exec(match)
    return result
        ? [
            parseInt(result[1]),
            parseInt(result[2]),
            parseInt(result[3]),
            result[4] ? parseFloat(result[4]) : undefined
        ]
        : null
}

function parseHsl(match: string): [number, number, number, number?] | null {
    const pattern =
        /hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*([\d.]+))?\s*\)/
    const result = pattern.exec(match)
    return result
        ? [
            parseInt(result[1]),
            parseInt(result[2]),
            parseInt(result[3]),
            result[4] ? parseFloat(result[4]) : undefined
        ]
        : null
}

function hslToRgb(h: number, s: number, l: number): string {
    h = h / 360
    s = s / 100
    l = l / 100

    let r: number, g: number, b: number

    if (s === 0) {
        r = g = b = l
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }

    const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16)
        return hex.length === 1 ? "0" + hex : hex
    }

    return "#" + toHex(r) + toHex(g) + toHex(b)
}

function getColorFromMatch(match: string): string | null {
    if (match.startsWith("#")) return normalizeHexColor(match)
    if (match.toLowerCase().startsWith("rgb")) {
        const rgb = parseRgb(match)
        if (!rgb) return null
        const r = Math.min(255, Math.max(0, rgb[0])).toString(16).padStart(2, "0")
        const g = Math.min(255, Math.max(0, rgb[1])).toString(16).padStart(2, "0")
        const b = Math.min(255, Math.max(0, rgb[2])).toString(16).padStart(2, "0")
        return "#" + r + g + b
    }
    if (match.toLowerCase().startsWith("hsl")) {
        const hsl = parseHsl(match)
        return hsl ? hslToRgb(hsl[0], hsl[1], hsl[2]) : null
    }
    return null
}

const ColorHighlight: WidgetComponent = ({ children, token }) => {
    const [visible, setVisible] = useState(false)
    const { code, position } = useCodeState()
    const [start, end] = token.range
    const text = code.slice(start, end)
    const color = getColorFromMatch(text)

    const toggleVisibility = () => setVisible(v => !v)

    useEffect(() => {
        setVisible(false)
    }, [position])

    return (
        <span
            data-token-start={start}
            data-token-end={end}
            style={{
                position: "relative"
            }}>
            {color && (
                <span
                    onClick={toggleVisibility}
                    aria-hidden
                    style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        backgroundColor: color,
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.08)",
                        marginRight: 6,
                        verticalAlign: "middle"
                    }}
                />
            )}
            {visible && color && (
                <WidgetPortal>
                    <div
                        style={{
                            width: "100%"
                        }}>
                        <div
                            style={{
                                width: 100,
                                height: 100,
                                backgroundColor: color,
                                borderRadius: 4,
                                border: "1px solid rgba(0,0,0,0.1)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                            }}
                        />
                    </div>
                </WidgetPortal>
            )}
            {children}
        </span>
    )
}

ColorHighlight.widget = {
    tokenizer(code: string) {
        const ranges: [number, number][] = []

        let m: RegExpExecArray | null
        HEX_PATTERN.lastIndex = 0
        while ((m = HEX_PATTERN.exec(code)) !== null)
            ranges.push([m.index, m.index + m[0].length])

        RGB_PATTERN.lastIndex = 0
        while ((m = RGB_PATTERN.exec(code)) !== null)
            ranges.push([m.index, m.index + m[0].length])

        HSL_PATTERN.lastIndex = 0
        while ((m = HSL_PATTERN.exec(code)) !== null)
            ranges.push([m.index, m.index + m[0].length])

        return ranges
    }
}

export default ColorHighlight
