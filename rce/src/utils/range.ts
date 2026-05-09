import { Range } from "../type"

export function normalizeRange(range: Range, max = Number.MAX_SAFE_INTEGER): Range | null {
    const start = Math.max(0, Math.min(max, Math.floor(range[0])))
    const end = Math.max(0, Math.min(max, Math.floor(range[1])))

    if (start === end) return null
    return start < end ? [start, end] : [end, start]
}

export function clampOffset(offset: number, max: number) {
    return Math.max(0, Math.min(max, Math.floor(offset)))
}

export function rangeLength(range: Range) {
    return Math.max(0, range[1] - range[0])
}

export function isRangeCollapsed(range: Range) {
    return range[0] === range[1]
}

export function isRangeEqual(left: Range | null, right: Range | null) {
    if (!left || !right) return left === right
    return left[0] === right[0] && left[1] === right[1]
}

export function compareRanges(left: Range, right: Range) {
    if (left[0] !== right[0]) return left[0] - right[0]
    return left[1] - right[1]
}

export function containsRange(outer: Range, inner: Range) {
    return outer[0] <= inner[0] && outer[1] >= inner[1]
}
